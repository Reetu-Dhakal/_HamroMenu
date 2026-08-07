import BaseRepository from './BaseRepository.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

class MenuRepository extends BaseRepository {
  constructor() {
    super(MenuItem);
    this.categories = new BaseRepository(Category);
  }

  async listWithCategory(restaurantId, { includeInactive = false } = {}) {
    const filter = { restaurant: restaurantId };
    if (!includeInactive) filter.isAvailable = true;
    const [items, categories] = await Promise.all([
      this.find(filter, { sort: { displayOrder: 1, name: 1 } }),
      this.categories.find({ restaurant: restaurantId }, { sort: { displayOrder: 1 } }),
    ]);
    return { items, categories };
  }

  async search(restaurantId, query, { limit = 30 } = {}) {
    const filter = { restaurant: restaurantId, isAvailable: true };
    if (query) {
      const words = query.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (words.length) {
        filter.$or = [
          { name: { $regex: words.join('.*'), $options: 'i' } },
          { description: { $regex: words.join('.*'), $options: 'i' } },
          { tags: { $in: words } },
        ];
      }
    }
    return this.find(filter, { sort: { isPopular: -1, orderCount: -1 }, limit });
  }

  async featured(restaurantId) {
    return this.find({ restaurant: restaurantId, isAvailable: true, isFeatured: true }, { sort: { displayOrder: 1 } });
  }

  async popular(restaurantId, limit = 8) {
    return this.find({ restaurant: restaurantId, isAvailable: true, isPopular: true }, { sort: { orderCount: -1 }, limit });
  }

  async incrementOrderCounts(items) {
    const ids = items.map((it) => it.menuItem);
    const counts = {};
    items.forEach((it) => {
      counts[it.menuItem] = (counts[it.menuItem] || 0) + it.quantity;
    });
    for (const [id, qty] of Object.entries(counts)) {
      await this.updateOne({ _id: id }, { $inc: { orderCount: qty } });
    }
  }

  async findByCategory(restaurantId, categoryId) {
    return this.find({ restaurant: restaurantId, category: categoryId, isAvailable: true }, { sort: { displayOrder: 1 } });
  }

  async topSellers(restaurantId, limit = 10) {
    return this.find({ restaurant: restaurantId }, { sort: { orderCount: -1 }, limit });
  }
}

export default new MenuRepository();
export { MenuRepository };