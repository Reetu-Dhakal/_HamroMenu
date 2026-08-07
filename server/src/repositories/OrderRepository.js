import mongoose from 'mongoose';
import BaseRepository from './BaseRepository.js';
import Order from '../models/Order.js';

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async nextOrderNumber(restaurantId) {
    const today = new Date();
    const prefix = `HM${today.getFullYear().toString().slice(2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
    const count = await this.model.countDocuments({
      restaurant: restaurantId,
      createdAt: { $gte: start, $lte: end },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async findActiveByTable(tableId) {
    return this.findOne({ table: tableId, status: { $nin: ['completed', 'cancelled'] } });
  }

  async markOrderItemStatus(orderId, itemId, status) {
    return this.model.updateOne(
      { _id: orderId, 'items._id': itemId },
      { $set: { 'items.$.status': status } }
    );
  }

  async countByStatus(restaurantId) {
    return this.aggregate([
      { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }
}

export default new OrderRepository();
export { OrderRepository };