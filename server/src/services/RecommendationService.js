import mongoose from 'mongoose';
import Order, { ORDER_STATUS } from '../models/Order.js';
import Review from '../models/Review.js';
import MenuItem from '../models/MenuItem.js';
import RecommendationCache from '../models/RecommendationCache.js';

/**
 * RecommendationService — item-based collaborative filtering.
 * -------------------------------------------------------------
 * Pure vanilla JavaScript, no external ML services, so it is easy to
 * explain, demo and tweak.
 *
 * 1. A user-item interaction matrix is derived from the live data:
 *      - every non-cancelled order contributes (quantity x recency decay)
 *      - every rating contributes (rating - 3) x recency decay
 *    Recent behaviour is weighted more heavily (14-day half life).
 * 2. Item-to-item cosine similarity is computed over the customer
 *    dimensions of that matrix and cached in RecommendationCache.
 * 3. Co-occurrence ("frequently ordered together") is derived by counting
 *    how often pairs of dishes appear in the same order.
 * 4. Surfaces:
 *      - "Recommended for you"   personalized for a logged-in customer,
 *                                cold-start falls back to bestsellers.
 *      - "Frequently ordered with your cart" -> co-occurrence.
 */

const SIMILARITY_TOP_K = 15; // neighbours kept per item
const CO_OCCUR_TOP_K = 10;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour between automatic rebuilds
const RECENCY_HALF_LIFE_DAYS = 14;

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

  /**
   * Build the user-item interaction matrix.
   * Returns { itemVectors, userVectors, stats }
   *   itemVectors: itemId -> { userId: weight }
   *   userVectors: userId -> { itemId: weight }
   * A "you" pseudo-user replaces the real customer when personalized.
   */
  async buildMatrix(restaurantId, customerId = null) {
    const { orders, reviews } = await this.fetchInteractions(restaurantId, customerId);
    const itemVectors = {};
    const userVectors = {};

    const add = (itemId, userId, weight) => {
      if (!itemId || !userId) return;
      itemId = itemId.toString();
      itemVectors[itemId] = itemVectors[itemId] || {};
      itemVectors[itemId][userId] = (itemVectors[itemId][userId] || 0) + weight;
      userVectors[userId] = userVectors[userId] || {};
      userVectors[userId][itemId] = (userVectors[userId][itemId] || 0) + weight;
    };

    for (const order of orders) {
      const w = recencyWeight(order.placedAt);
      for (const it of order.items || []) {
        add(it.menuItem, customerId ? 'you' : order.customer, (it.quantity || 1) * w);
      }
    }
    for (const review of reviews) {
      add(review.menuItem, customerId ? 'you' : review.customer, (review.rating - 3) * recencyWeight(review.createdAt));
    }

    return {
      itemVectors,
      userVectors,
      stats: { users: Object.keys(userVectors).length, orders: orders.length, reviews: reviews.length },
    };
  }

  /** Compute item-to-item cosine similarity, top-K neighbours each. */
  computeSimilarity(itemVectors) {
    const ids = Object.keys(itemVectors);
    const scores = {};
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const sim = cosine(itemVectors[ids[i]], itemVectors[ids[j]]);
        if (sim <= 0.01) continue;
        scores[ids[i]] = scores[ids[i]] || [];
        scores[ids[j]] = scores[ids[j]] || [];
        scores[ids[i]].push({ id: ids[j], score: sim });
        scores[ids[j]].push({ id: ids[i], score: sim });
      }
    }
    for (const id of ids) {
      (scores[id] || []).sort((a, b) => b.score - a.score);
      scores[id] = (scores[id] || []).slice(0, SIMILARITY_TOP_K);
    }
    return scores;
  }

  /** Pairwise order co-occurrence, recency-weighted counts. */
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
    const { itemVectors, stats } = await this.buildMatrix(rid);
    const orders = await Order.find({ restaurant: rid, status: { $nin: [ORDER_STATUS.CANCELLED] } })
      .select('items placedAt')
      .lean();

    let doc = await this.model.findOne({ restaurant: rid });
    if (!doc) doc = new this.model({ restaurant: rid });
    doc.similarity = this.computeSimilarity(itemVectors);
    doc.coOccurrence = this.computeCoOccurrence(orders);
    doc.itemCount = Object.keys(itemVectors).length;
    doc.stats = stats;
    doc.computedAt = new Date();
    await doc.save();
    return doc;
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
   * Logged-in customer with history -> personalized cosine scoring;
   * otherwise (guest / new customer / not enough signal) -> bestsellers.
   */
  async recommendedFor(restaurantId, customerId = null, { limit = 8 } = {}) {
    if (!customerId) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }
    const [{ userVectors }, cache] = await Promise.all([this.buildMatrix(restaurantId, customerId), this.cacheFor(restaurantId)]);
    const userVector = userVectors['you'] || {};
    const known = Object.keys(userVector).filter((k) => (userVector[k] || 0) > 0);
    if (!known.length) {
      return { type: 'bestsellers', items: await this.bestsellers(restaurantId, limit) };
    }

    const scores = {};
    for (const itemId of known) {
      const weight = userVector[itemId] || 0;
      for (const neighbour of cache.similarity[itemId] || []) {
        if (known.includes(neighbour.id)) continue;
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