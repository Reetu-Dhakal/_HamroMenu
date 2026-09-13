import mongoose from 'mongoose';
import Order, { ORDER_STATUS } from '../models/Order.js';
import Review from '../models/Review.js';
import MenuItem from '../models/MenuItem.js';
import RecommendationCache from '../models/RecommendationCache.js';
import { apriori } from '../services/AssociationRuleService.js';

/**
 * RecommendationService — enhanced with user-based KNN + item-based collaborative filtering.
 * -------------------------------------------------------------
 * 1. Item-based collaborative filtering with cosine similarity (existing).
 * 2. User-based KNN: find similar customers using cosine similarity on preference vectors.
 * 3. Co-occurrence ("frequently ordered together") via Apriori-like counting.
 * 4. Surfaces:
 *      - "Recommended for you"   personalized (KNN) or bestsellers fallback.
 *      - "Frequently ordered with"  co-occurrence from order history.
 */

/** ———————————————————————————————— Constants */

const SIMILARITY_TOP_K = 15; // neighbours kept per item / user
const CO_OCCUR_TOP_K = 10;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour between automatic rebuilds
const RECENCY_HALF_LIFE_DAYS = 14;

/** ———————————————————————————————— Helpers */

function recencyWeight(date) {
  const days = (Date.now() - new Date(date).getTime()) / 86400000;
  return Math.pow(0.5, Math.max(0, days) / RECENCY_HALF_LIFE_DAYS);
}

function cosine(a = {}, b = {}) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const key of Object.keys(a)) {
    const av = a[key] || 0;
    dot += av * (b[key] || 0);
    normA += av * av;
  }
  for (const key of Object.keys(b)) normB += (b[key] || 0) * (b[key] || 0);
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function asObjectId(id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

/** ———————————————————————————————— User-Item Matrix */

function buildUserItemMatrix(orders) {
  /** Returns { userId: { itemId: weight } } */
  const userItems = {};

  for (const order of orders) {
    const w = recencyWeight(order.placedAt);
    for (const it of order.items || []) {
      const itemId = it.menuItem.toString();
      const uId = order.customer.toString();
      userItems[uId] = userItems[uId] || {};
      userItems[uId][itemId] = (userItems[uId][itemId] || 0) + (it.quantity || 1) * w;
    }
  }
  return userItems;
}

/** ———————————————————————————————— Class */

class RecommendationService {
  constructor() {
    this.model = RecommendationCache;
  }

  /** Load orders + reviews for the given restaurant (optionally one customer). */
  async fetchInteractions(restaurantId, customerId = null) {
    const orderFilter = { restaurant: restaurantId, status: { $nin: [ORDER_STATUS.CANCELLED] } };
    const reviewFilter = { restaurant: restaurantId };
    if (customerId) {
      orderFilter.customer = customerId;
      reviewFilter.customer = customerId;
    }
    const [orders, reviews] = await Promise.all([
      Order.find(orderFilter).select('customer items placedAt').lean(),
      Review.find(reviewFilter).select('customer menuItem rating createdAt').lean(),
    ]);
    return { orders, reviews };
  }

  /** Build the user-item interaction matrix for a restaurant. */
  async buildMatrix(restaurantId, customerId = null) {
    const { orders } = await this.fetchInteractions(restaurantId, customerId);
    return buildUserItemMatrix(orders);
  }

  /** Compute user-user cosine similarity matrix. */
  computeUserSimilarity(userVectors) {
    const userIds = Object.keys(userVectors);
    const scores = {};

    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const idA = userIds[i];
        const idB = userIds[j];
        const vecA = userVectors[idA] || {};
        const vecB = userVectors[idB] || {};
        const sim = cosine(vecA, vecB);
        if (sim > 0) {
          scores[`${idA}::${idB}`] = sim;
          scores[`${idB}::${idA}`] = sim;
        }
      }
    }
    return scores;
  }

  /** Find K nearest neighbours for a user. */
  async knnNeighbours(restaurantId, customerId, k = SIMILARITY_TOP_K) {
    const userVectors = await this.buildMatrix(restaurantId, customerId);
    const targetVector = userVectors[customerId] || {};

    // Compute similarity between target and all other users
    const allOrders = await Order.find({ restaurant: restaurantId, status: { $nin: [ORDER_STATUS.CANCELLED] } })
      .select('customer items placedAt')
      .lean();

    const otherUserVectors = {};
    for (const order of allOrders) {
      const uId = order.customer.toString();
      if (uId === customerId) continue;
      otherUserVectors[uId] = otherUserVectors[uId] || {};
      for (const it of order.items || []) {
        otherUserVectors[uId][it.menuItem.toString()] =
          (otherUserVectors[uId][it.menuItem.toString()] || 0) + (it.quantity || 1);
      }
    }

    const otherUserScores = {};
    for (const uId of Object.keys(otherUserVectors)) {
      otherUserScores[uId] = cosine(targetVector, otherUserVectors[uId]);
    }

    // Sort by similarity desc, take top k
    const ranked = Object.entries(otherUserScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([uId, sim]) => ({ userId: uId, similarity: sim }));

    return ranked;
  }

  /** Get recommendations using KNN (user-based). */
  async recommendedByKNN(restaurantId, customerId, { limit = 8 } = {}) {
    const neighbours = await this.knnNeighbours(restaurantId, customerId, limit);

    if (!neighbours.length) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }

    // Collect preferences from neighbours, excluding already-ordered items
    const { orders } = await this.fetchInteractions(restaurantId, customerId);
    const orderedItemIds = new Set();
    for (const order of orders) {
      for (const it of order.items || []) {
        orderedItemIds.add(it.menuItem.toString());
      }
    }

    // Aggregate scores from neighbours
    const candidateScores = {};

    for (const { userId, similarity } of neighbours) {
      const { orders: neighbourOrders } = await this.fetchInteractions(restaurantId, userId);
      for (const order of neighbourOrders) {
        for (const it of order.items || []) {
          const itemId = it.menuItem.toString();
          if (orderedItemIds.has(itemId)) continue;
          candidateScores[itemId] = (candidateScores[itemId] || 0) + similarity * (it.quantity || 1);
        }
      }
    }

    if (Object.keys(candidateScores).length === 0) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }

    const ranked = Object.entries(candidateScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const items = await MenuItem.find({
      restaurant: restaurantId,
      _id: { $in: ranked },
      isAvailable: true,
    }).lean();

    const order = new Map(ranked.map((id, i) => [id, i]));
    const sorted = items.sort((a, b) => (order.get(a._id.toString()) ?? 99) - (order.get(b._id.toString()) ?? 99));

    return { type: 'personalized', items: sorted, basedOn: neighbours.length };
  }

  /** "Frequently ordered together" — recency-weighted co-occurrence. */
  computeCoOccurrence(orders) {
    const counts = {};
    for (const order of orders) {
      const ids = [...new Set((order.items || []).map((it) => it.menuItem?.toString()).filter(Boolean))];
      if (ids.length < 2) continue;
      const w = recencyWeight(order.placedAt);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const [a, b] = [ids[i], ids[j]].sort();
          counts[a] = counts[a] || {};
          counts[b] = counts[b] || {};
          counts[a][b] = (counts[a][b] || 0) + w;
          counts[b][a] = (counts[b][a] || 0) + w;
        }
      }
    }
    const out = {};
    for (const id of Object.keys(counts)) {
      out[id] = Object.entries(counts[id])
        .map(([neighbour, score]) => ({ id: neighbour, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, CO_OCCUR_TOP_K);
    }
    return out;
  }

  /** Recompute and store the whole cache for one restaurant. */
  async rebuild(restaurantId) {
    const rid = asObjectId(restaurantId);
    const { orders } = await this.fetchInteractions(rid);

    // 1. User-user similarity for KNN
    const userVectors = await this.buildMatrix(rid);

    // 2. Apriori association rules for "Frequently Ordered Together"
    const { rules: aprioriRules, itemsets } = apriori(orders, 0.02, 0.3, 1.0);

    // 3. Item-item similarity for "Recommended for you" (item-based CF)
    const itemVectors = {};
    for (const order of orders) {
      const w = recencyWeight(order.placedAt);
      for (const it of order.items || []) {
        const itemId = it.menuItem.toString();
        itemVectors[itemId] = itemVectors[itemId] || {};
        itemVectors[itemId][order.customer.toString()] = (itemVectors[itemId][order.customer.toString()] || 0) + w;
      }
    }
    const similarity = this.computeItemSimilarity(itemVectors);

    // 4. Store Apriori rules BOTH as flat list (for API transparency) and as
    // an adjacency list `id -> [{id, score}]` (for companion lookup).
    // Weight = lift * confidence so strong, reliable pairings rank highest.
    const coOccurrence = {};
    const ruleList = aprioriRules.slice(0, 50);
    for (const rule of ruleList) {
      const key = `${rule.antecedent}→${rule.consequent}`;
      coOccurrence[key] = {
        antecedent: rule.antecedent,
        consequent: rule.consequent,
        support: rule.support,
        confidence: rule.confidence,
        lift: rule.lift,
      };
      const w = (rule.lift || 1) * (rule.confidence || 0);
      coOccurrence[rule.antecedent] = coOccurrence[rule.antecedent] || [];
      if (Array.isArray(coOccurrence[rule.antecedent])) {
        coOccurrence[rule.antecedent].push({ id: rule.consequent, score: w });
      }
    }
    // Keep adjacency lists trimmed to top-K per item
    for (const k of Object.keys(coOccurrence)) {
      if (Array.isArray(coOccurrence[k])) {
        coOccurrence[k].sort((a, b) => b.score - a.score);
        coOccurrence[k] = coOccurrence[k].slice(0, CO_OCCUR_TOP_K);
      }
    }
    coOccurrence._rules = ruleList.slice(0, CO_OCCUR_TOP_K);

    let doc = await this.model.findOne({ restaurant: rid });
    if (!doc) doc = new this.model({ restaurant: rid });
    doc.similarity = similarity;
    doc.coOccurrence = coOccurrence;
    doc.itemCount = Object.keys(itemVectors).length;
    const { orders: allOrders } = await this.fetchInteractions(rid);
    const userCount = new Set(allOrders.map(o => o.customer.toString())).size;
    doc.stats = { users: userCount, orders: allOrders.length, reviews: 0 };
    doc.computedAt = new Date();
    await doc.save();
    return doc;
  }

  /** Compute item-item cosine similarity (existing functionality). */
  computeItemSimilarity(itemVectors) {
    const ids = Object.keys(itemVectors);
    const scores = {};
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const sim = cosine(itemVectors[ids[i]], itemVectors[ids[j]]);
        if (sim > 0.01) {
          scores[ids[i]] = scores[ids[i]] || [];
          scores[ids[j]] = scores[ids[j]] || [];
          scores[ids[i]].push({ id: ids[j], score: sim });
          scores[ids[j]].push({ id: ids[i], score: sim });
        }
      }
    }
    for (const id of ids) {
      (scores[id] || []).sort((a, b) => b.score - a.score);
      scores[id] = (scores[id] || []).slice(0, SIMILARITY_TOP_K);
    }
    return scores;
  }

  /** Fresh cache — rebuild when missing or older than one hour. */
  async cacheFor(restaurantId) {
    let doc = await this.model.findOne({ restaurant: restaurantId });
    if (!doc || Date.now() - new Date(doc.computedAt).getTime() > CACHE_TTL_MS) {
      doc = await this.rebuild(restaurantId);
    }
    return doc;
  }

  async bestsellers(restaurantId, limit = 8) {
    return MenuItem.find({ restaurant: restaurantId, isAvailable: true })
      .sort({ orderCount: -1, isPopular: -1, isFeatured: -1 })
      .limit(limit);
  }

  /**
   * TRUE HYBRID "Recommended for you".
   * FinalScore = wKNN * norm(KNN) + wItem * norm(itemCF) + wApriori * norm(apriori) + wPop * norm(popularity)
   * Weights (documented, sum = 1): KNN 0.40 (personal taste), item-CF 0.25
   * (similar dishes), Apriori 0.20 (combos with known items), popularity 0.15
   * (bestsellers). Missing sources contribute 0 and remaining weights are
   * re-normalized so new users/restaurants degrade gracefully to bestsellers.
   */
  static HYBRID_WEIGHTS = { knn: 0.4, item: 0.25, apriori: 0.2, popularity: 0.15 };

  normalizeScores(scores) {
    const vals = Object.values(scores);
    if (!vals.length) return {};
    const max = Math.max(...vals, 1e-9);
    const out = {};
    for (const [k, v] of Object.entries(scores)) out[k] = v / max;
    return out;
  }

  async recommendedFor(restaurantId, customerId = null, { limit = 8 } = {}) {
    const W = RecommendationService.HYBRID_WEIGHTS;
    const cache = await this.cacheFor(restaurantId);

    if (!customerId) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }
    const userVectors = await this.buildMatrix(restaurantId, customerId);
    const userVector = userVectors[customerId] || {};
    const known = Object.keys(userVector).filter((k) => (userVector[k] || 0) > 0);
    if (!known.length) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }
    const knownIds = known.map(String);

    // 1) KNN user-based scores
    const knnRaw = {};
    try {
      const neighbours = await this.knnNeighbours(restaurantId, String(customerId), SIMILARITY_TOP_K);
      for (const { userId, similarity } of neighbours) {
        const { orders: nOrders } = await this.fetchInteractions(restaurantId, userId);
        for (const o of nOrders) {
          for (const it of o.items || []) {
            const id = it.menuItem.toString();
            if (knownIds.includes(id)) continue;
            knnRaw[id] = (knnRaw[id] || 0) + similarity * (it.quantity || 1);
          }
        }
      }
    } catch (_) { /* treat as empty source */ }

    // 2) Item-based CF scores from cached item similarity
    const itemRaw = {};
    for (const itemId of knownIds) {
      const weight = userVector[itemId] || 0;
      for (const nb of cache.similarity?.[itemId] || []) {
        if (knownIds.includes(String(nb.id))) continue;
        itemRaw[nb.id] = (itemRaw[nb.id] || 0) + nb.score * weight;
      }
    }

    // 3) Apriori association scores: rules whose antecedent is a known item
    const aprioriRaw = {};
    const co = cache.coOccurrence || {};
    for (const itemId of knownIds) {
      for (const nb of co[itemId] || []) {
        if (!nb || !nb.id || knownIds.includes(String(nb.id))) continue;
        aprioriRaw[nb.id] = (aprioriRaw[nb.id] || 0) + (nb.score || 0);
      }
    }

    // 4) Popularity scores (orderCount normalized later)
    const popularDocs = await MenuItem.find({ restaurant: restaurantId, isAvailable: true })
      .select('_id orderCount').sort({ orderCount: -1 }).limit(30).lean();
    const popRaw = {};
    for (const d of popularDocs) {
      const id = d._id.toString();
      if (knownIds.includes(id)) continue;
      popRaw[id] = d.orderCount || 0;
    }

    const nKnn = this.normalizeScores(knnRaw);
    const nItem = this.normalizeScores(itemRaw);
    const nApr = this.normalizeScores(aprioriRaw);
    const nPop = this.normalizeScores(popRaw);

    // Re-normalize weights over sources that actually produced candidates
    const hasKnn = Object.keys(nKnn).length > 0;
    const hasItem = Object.keys(nItem).length > 0;
    const hasApr = Object.keys(nApr).length > 0;
    const hasPop = Object.keys(nPop).length > 0;
    let wSum = (hasKnn ? W.knn : 0) + (hasItem ? W.item : 0) + (hasApr ? W.apriori : 0) + (hasPop ? W.popularity : 0);
    if (wSum === 0) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }

    const final = {};
    const add = (norm, w) => {
      for (const [id, v] of Object.entries(norm)) final[id] = (final[id] || 0) + (w / wSum) * v;
    };
    if (hasKnn) add(nKnn, W.knn);
    if (hasItem) add(nItem, W.item);
    if (hasApr) add(nApr, W.apriori);
    if (hasPop) add(nPop, W.popularity);

    const ranked = Object.entries(final).sort((a, b) => b[1] - a[1]).slice(0, limit);
    if (!ranked.length) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }
    const ids = ranked.map(([id]) => id);
    const scoreMap = new Map(ranked);
    const items = await MenuItem.find({ _id: { $in: ids }, restaurant: restaurantId, isAvailable: true }).lean();
    const sorted = items
      .map((it) => ({ ...it, _score: Math.round((scoreMap.get(it._id.toString()) || 0) * 100) / 100 }))
      .sort((a, b) => b._score - a._score);
    const personalized = hasKnn || hasItem || hasApr;
    return {
      type: personalized ? 'hybrid' : 'bestsellers',
      items: sorted,
      basedOn: known.length,
      weights: W,
      sources: { knn: hasKnn, itemCF: hasItem, apriori: hasApr, popularity: hasPop },
    };
  }

  /** "Frequently ordered together" — Apriori adjacency with cart content. */
  async companionFor(restaurantId, cartItemIds = [], { limit = 6 } = {}) {
    const ids = [...new Set(cartItemIds.map((x) => String(x)).filter(Boolean))];
    if (!ids.length) return { items: [], rules: [] };
    const cache = await this.cacheFor(restaurantId);
    const co = cache.coOccurrence || {};
    const scores = {};
    const matchedRules = [];
    for (const id of ids) {
      for (const neighbour of co[id] || []) {
        if (!neighbour || !neighbour.id || ids.includes(String(neighbour.id))) continue;
        scores[neighbour.id] = (scores[neighbour.id] || 0) + (neighbour.score || 0);
      }
    }
    // Include flat rule list for transparency (antecedent in cart)
    for (const r of co._rules || []) {
      if (ids.includes(String(r.antecedent)) && !ids.includes(String(r.consequent))) matchedRules.push(r);
    }
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
    if (!ranked.length) return { items: [], rules: matchedRules.slice(0, limit) };
    const found = await MenuItem.find({ _id: { $in: ranked }, restaurant: restaurantId, isAvailable: true }).lean();
    const map = new Map(found.map((i) => [i._id.toString(), i]));
    return { items: ranked.map((id) => map.get(id)).filter(Boolean), rules: matchedRules.slice(0, limit) };
  }

  async statsFor(restaurantId) {
    const doc = await this.model.findOne({ restaurant: restaurantId });
    return {
      isBuilt: Boolean(doc),
      computedAt: doc?.computedAt || null,
      stats: doc?.stats || { users: 0, orders: 0, reviews: 0 },
      itemCount: doc?.itemCount || 0,
    };
  }
}

export default new RecommendationService();