import BaseRepository from './BaseRepository.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import QRCode from '../models/QRCode.js';

class RestaurantRepository extends BaseRepository {
  constructor() {
    super(Restaurant);
    this.tables = new BaseRepository(Table);
    this.qrCodes = new BaseRepository(QRCode);
  }

  async findBySlug(slug) {
    return this.findOne({ slug, isActive: true });
  }

  async tableByNumber(restaurantId, number) {
    return this.tables.findOne({ restaurant: restaurantId, number });
  }

  async tablesFor(restaurantId) {
    return this.tables.find({ restaurant: restaurantId, isActive: true }, { sort: { number: 1 } });
  }

  async tableById(id) {
    return this.tables.findById(id);
  }

  async createTable(data) {
    return this.tables.create(data);
  }

  async updateTable(id, update) {
    return this.tables.findByIdAndUpdate(id, update);
  }

  async deleteTable(id) {
    return this.tables.findByIdAndDelete(id);
  }

  async qrByPayload(payload) {
    return this.qrCodes.findOne({ payload });
  }

  async qrByTable(restaurantId, tableId) {
    return this.qrCodes.findOne({ restaurant: restaurantId, table: tableId });
  }

  async createQR(data) {
    return this.qrCodes.create(data);
  }

  async listQR(restaurantId) {
    return this.qrCodes.find({ restaurant: restaurantId }, { sort: { createdAt: -1 }, populate: 'table' });
  }
}

export default new RestaurantRepository();
export { RestaurantRepository };