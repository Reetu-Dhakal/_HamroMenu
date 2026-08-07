import BaseRepository from './BaseRepository.js';
import Cart from '../models/Cart.js';

class CartRepository extends BaseRepository {
  constructor() {
    super(Cart);
  }

  async findByCustomerAndRestaurant(customerId, restaurantId) {
    return this.findOne({
      customer: customerId,
      restaurant: restaurantId,
    });
  }

  async findByCustomer(customerId) {
    return this.findOne({ customer: customerId });
  }
}

export default new CartRepository();
export { CartRepository };