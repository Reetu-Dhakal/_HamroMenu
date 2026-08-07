import { getIO, ROOMS } from '../config/socket.js';

class NotificationService {
  emit(room, event, payload) {
    try {
      getIO().to(room).emit(event, payload);
    } catch (err) {
      // Socket not initialized yet — safe to ignore in non-realtime flows
    }
  }

  emitToRestaurant(restaurantId, event, payload) {
    this.emit(ROOMS.restaurant(restaurantId), event, payload);
  }

  emitToKitchen(restaurantId, event, payload) {
    this.emit(ROOMS.kitchen(restaurantId), event, payload);
  }

  emitToCustomer(customerId, event, payload) {
    this.emit(ROOMS.customer(customerId), event, payload);
  }

  emitToTable(restaurantId, tableId, event, payload) {
    this.emit(`${ROOMS.restaurant(restaurantId)}-table-${tableId}`, event, payload);
  }
}

export default new NotificationService();