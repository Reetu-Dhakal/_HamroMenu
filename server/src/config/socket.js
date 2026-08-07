import { Server } from 'socket.io';
import config from './index.js';

let io = null;

export const ROOMS = {
  restaurant: (id) => `restaurant:${id}`,
  kitchen: (id) => `kitchen:${id}`,
  customer: (id) => `customer:${id}`,
};

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join', (data = {}) => {
      if (data.restaurantId) {
        socket.join(ROOMS.restaurant(data.restaurantId));
        socket.join(ROOMS.kitchen(data.restaurantId));
      }
      if (data.customerId) socket.join(ROOMS.customer(data.customerId));
    });
    socket.on('leave', (payload = {}) => {
      if (payload.restaurantId) {
        socket.leave(ROOMS.restaurant(payload.restaurantId));
        socket.leave(ROOMS.kitchen(payload.restaurantId));
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export default { initSocket, getIO, ROOMS };