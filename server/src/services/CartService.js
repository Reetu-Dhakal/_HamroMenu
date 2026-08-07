import cartRepository from '../repositories/CartRepository.js';
import MenuItem from '../models/MenuItem.js';
import restaurantRepository from '../repositories/RestaurantRepository.js';
import menuService from './MenuService.js';
import ApiError, { ErrorCodes } from '../utils/ApiError.js';

class CartService {
  constructor() {
    this.repo = cartRepository;
    this.menuItems = MenuItem;
  }

  async getCart(customerId, restaurantId) {
    let cart = await this.repo.findByCustomerAndRestaurant(customerId, restaurantId);
    if (!cart) {
      cart = await this.repo.create({
        customer: customerId,
        restaurant: restaurantId,
        items: [],
      });
    }
    await this.recalc(cart);
    return cart;
  }

  async recalc(cart) {
    const restaurant = await restaurantRepository.findById(cart.restaurant);
    const taxRate = restaurant ? restaurant.taxRate : 0;
    const serviceChargeRate = restaurant ? restaurant.serviceChargeRate : 0;
    cart.calculateTotals(taxRate, serviceChargeRate);
    await cart.save();
    return cart;
  }

  async validateCartItem(menuItemId, quantity, options = {}) {
    const item = await this.menuItems.findById(menuItemId);
    if (!item) throw new ApiError(404, 'Menu item not found', null, ErrorCodes.NOT_FOUND);
    if (!item.isAvailable) throw new ApiError(400, `"${item.name}" is currently unavailable`);

    let unitPrice = item.effectivePrice();
    let optionsLabel = '';
    const optionChoices = [];
    for (const group of item.options || []) {
      const selected = options[group.title];
      if (group.required && !selected) throw new ApiError(400, `${group.title} is required`);
      if (selected) {
        const choice = group.choices.find((c) => c.label === selected);
        if (choice) {
          unitPrice += choice.priceDelta || 0;
          optionChoices.push(`${group.title}: ${selected}`);
        }
      }
    }
    if (optionChoices.length) optionsLabel = optionChoices.join(', ');

    return {
      menuItem: item._id,
      name: item.name,
      unitPrice: Math.round(unitPrice * 100) / 100,
      imageUrl: item.imageUrl,
      options,
      optionsLabel,
    };
  }

  async addItem(customerId, restaurantId, { menuItem, quantity = 1, options = {}, specialInstructions = '' }) {
    if (!menuItem) throw new ApiError(400, 'Menu item is required');
    const validated = await this.validateCartItem(menuItem, quantity, options);
    let cart = await this.getCart(customerId, restaurantId);

    const existing = cart.items.find(
      (it) =>
        it.menuItem.toString() === menuItem &&
        it.optionsLabel === validated.optionsLabel &&
        (it.specialInstructions || '') === (specialInstructions || '')
    );

    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = existing.unitPrice * existing.quantity;
    } else {
      cart.items.push({
        ...validated,
        quantity,
        specialInstructions,
        lineTotal: validated.unitPrice * quantity,
      });
    }
    await this.recalc(cart);
    return this.toDTO(cart);
  }

  async updateItem(customerId, restaurantId, cartItemId, { quantity, specialInstructions }) {
    let cart = await this.getCart(customerId, restaurantId);
    const target = cart.items.id(cartItemId);
    if (!target) throw new ApiError(404, 'Item not in cart');
    if (quantity != null) {
      if (quantity < 1) return this.removeItem(customerId, restaurantId, cartItemId);
      target.quantity = quantity;
      target.lineTotal = target.unitPrice * target.quantity;
    }
    if (specialInstructions != null) target.specialInstructions = specialInstructions;
    await this.recalc(cart);
    return this.toDTO(cart);
  }

  async removeItem(customerId, restaurantId, cartItemId) {
    let cart = await this.getCart(customerId, restaurantId);
    cart.items.id(cartItemId)?.remove();
    await this.recalc(cart);
    return this.toDTO(cart);
  }

  async clear(customerId, restaurantId) {
    const cart = await this.repo.findByCustomerAndRestaurant(customerId, restaurantId);
    if (cart) {
      cart.items = [];
      cart.coupon = undefined;
      cart.appliedCoupon = undefined;
      await this.recalc(cart);
    }
    return this.toDTO(cart);
  }

  async applyCoupon(customerId, restaurantId, code) {
    const cart = await this.getCart(customerId, restaurantId);
    if (cart.isEmpty()) throw new ApiError(400, 'Cart is empty', null, ErrorCodes.CART_EMPTY);
    const coupon = await menuService.validateCoupon(restaurantId, code, cart.subtotal, customerId);
    cart.coupon = coupon._id;
    cart.applyCoupon(coupon, cart.subtotal);
    await this.recalc(cart);
    return { coupon: { code: coupon.code, discountValue: coupon.discountValue, discountType: coupon.discountType }, ...this.toDTO(cart) };
  }

  async removeCoupon(customerId, restaurantId) {
    const cart = await this.getCart(customerId, restaurantId);
    cart.coupon = undefined;
    cart.appliedCoupon = undefined;
    await this.recalc(cart);
    return this.toDTO(cart);
  }

  toDTO(cart) {
    if (!cart) return { items: [], itemCount: 0, subtotal: 0, discountTotal: 0, tax: 0, serviceCharge: 0, grandTotal: 0 };
    return {
      _id: cart._id,
      restaurant: cart.restaurant,
      table: cart.table || null,
      items: cart.items,
      coupon: cart.coupon,
      appliedCoupon: cart.appliedCoupon,
      subtotal: cart.subtotal,
      discountTotal: cart.discountTotal,
      tax: cart.tax,
      serviceCharge: cart.serviceCharge,
      grandTotal: cart.grandTotal,
      itemCount: cart.itemCount,
    };
  }
}

export default new CartService();