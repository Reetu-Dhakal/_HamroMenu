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
    const { userVectors } = await this.buildMatrix(restaurantId, customerId);
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
    const userSimilarity = this.computeUserSimilarity(userVectors);

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

    // 4. Flatten Apriori rules into coOccurrence for API access
    const coOccurrence = {};
    for (const rule of aprioriRules.slice(0, CO_OCCUR_TOP_K)) {
      const key = rule.antecedent.replace(/ /g, '') + '→' + rule.consequent.replace(/ /g, '');
      coOccurrence[key] = {
        antecedent: rule.antecedent,
        consequent: rule.consequent,
        support: rule.support,
        confidence: rule.confidence,
        lift: rule.lift,
      };
    }

    let doc = await this.model.findOne({ restaurant: rid });
    if (!doc) doc = new this.model({ restaurant: rid });
    doc.similarity = similarity;
    doc.userSimilarity = userSimilarity;
    doc.coOccurrence = coOccurrence;
    doc.aprioriRules = aprioriRules; // full rules for admin view
    doc.itemCount = Object.keys(itemVectors).length;
    const { stats } = await this.buildMatrix(rid);
    doc.stats = stats;
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
   * "Recommended for you".
   * Logged-in customer with history -> personalized KNN cosine scoring;
   * otherwise (guest / new customer / not enough signal) -> bestsellers.
   */
  async recommendedFor(restaurantId, customerId = null, { limit = 8 } = {}) {
    if (!customerId) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }
    const [{ userVectors }, cache] = await Promise.all([this.buildMatrix(restaurantId, customerId), this.cacheFor(restaurantId)]);
    const userVector = userVectors[customerId] || {};

    // If user has no order history, fallback to bestsellers
    const known = Object.keys(userVector).filter((k) => (userVector[k] || 0) > 0);
    if (!known.length) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }

    // Try KNN first
    const knnResult = await this.recommendedByKNN(restaurantId, customerId, limit);

    // If KNN produced results, use them; otherwise fall back to item-based similarity
    if (knnResult.type === 'personalized' && knnResult.items.length > 0) {
      return knnResult;
    }

    // Fallback: item-based collaborative filtering
    const knownIds = known.map((k) => k.toString ? k.toString() : String(k));
    const scores = {};
    for (const itemId of knownIds) {
      const weight = userVector[itemId] || 0;
      for (const neighbour of cache.similarity[itemId] || []) {
        if (knownIds.includes(neighbour.id)) continue;
        scores[neighbour.id] = (scores[neighbour.id] || 0) + neighbour.score * weight;
      }
    }
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
    if (!ranked.length) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }

    const items = await MenuItem.find({ _id: { $in: ranked }, restaurant: restaurantId, isAvailable: true }).lean();
    const order = new Map(ranked.map((id, i) => [id, i]));
    const sorted = items.sort((a, b) => (order.get(a._id.toString()) ?? 99) - (order.get(b._id.toString()) ?? 99));
    return { type: 'personalized', items: sorted, basedOn: known.length };
  }

  /** "Frequently ordered together" — co-occurrence with the cart content. */
  async companionFor(restaurantId, cartItemIds = [], { limit = 6 } = {}) {
    const ids = [...new Set(cartItemIds.map((x) => String(x)).filter(Boolean))];
    if (!ids.length) return { items: [] };
    const cache = await this.cacheFor(restaurantId);
    const scores = {};
    for (const id of ids) {
      for (const neighbour of cache.coOccurrence[id] || []) {
        if (ids.includes(neighbour.id)) continue;
        scores[neighbour.id] = (scores[neighbour.id] || 0) + neighbour.score;
      }
    }
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
    if (!ranked.length) return { items: [] };
    const found = await MenuItem.find({ _id: { $in: ranked }, restaurant: restaurantId, isAvailable: true }).lean();
    const map = new Map(found.map((i) => [i._id.toString(), i]));
    return { items: ranked.map((id) => map.get(id)).filter(Boolean) };
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