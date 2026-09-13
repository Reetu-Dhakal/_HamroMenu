import { Server } from 'socket.io';
import config from './index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import userRepository from '../repositories/UserRepository.js';

let io = null;

export const ROOMS = {
  restaurant: (id) => `restaurant:${id}`,
  kitchen: (id) => `kitchen:${id}`,
  customer: (id) => `customer:${id}`,
};

const RESTAURANT_ROLES = ['admin', 'manager', 'staff', 'kitchen'];

function ownRestaurantId(user) {
  return user?.restaurant ? String(user.restaurant) : null;
}

/**
 * Authorize a room join against the authenticated socket user.
 * Returns { ok: true, rooms: [...] } or { ok: false, reason }.
 *
 * Rules:
 * - super_admin: may join any requested restaurant/kitchen room (oversight).
 * - admin/manager/staff: only restaurant:{ownRestaurant}.
 * - kitchen: restaurant:{own} + kitchen:{own}.
 * - customer: only customer:{ownId}. Never another customer's room,
 *   never another restaurant's room.
 * - Unauthenticated sockets: no rooms.
 */
export function authorizeJoin(user, data = {}) {
  if (!user) return { ok: false, reason: 'Not authenticated' };
  const rooms = [];
  const { restaurantId, customerId } = data;

  if (restaurantId) {
    const rid = String(restaurantId);
    if (user.role === 'super_admin') {
      rooms.push(ROOMS.restaurant(rid));
    } else if (RESTAURANT_ROLES.includes(user.role)) {
      if (ownRestaurantId(user) !== rid) {
        return { ok: false, reason: 'Access denied to this restaurant room' };
      }
      rooms.push(ROOMS.restaurant(rid));
      if (user.role === 'kitchen' || user.role === 'admin' || user.role === 'manager') {
        rooms.push(ROOMS.kitchen(rid));
      }
    } else {
      // customers (and any other role) may not join restaurant rooms
      return { ok: false, reason: 'Access denied to this restaurant room' };
    }
  }

  if (customerId) {
    if (String(customerId) !== String(user._id)) {
      return { ok: false, reason: 'Access denied to this customer room' };
    }
    rooms.push(ROOMS.customer(String(customerId)));
  }

  if (!rooms.length) return { ok: false, reason: 'Nothing to join' };
  return { ok: true, rooms };
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT authentication: reuses the REST access-token mechanism.
  // Client must connect with `auth: { token }`.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) return next(new Error('Unauthorized: missing token'));
      const payload = verifyAccessToken(token);
      const user = await userRepository.findByIdAcrossRoles(payload.id);
      if (!user || !user.isActive) return next(new Error('Unauthorized: user not found'));
      socket.user = user;
      return next();
    } catch (err) {
      return next(new Error('Unauthorized: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', async (data = {}, ack) => {
      const result = authorizeJoin(socket.user, data);
      if (!result.ok) {
        if (typeof ack === 'function') ack({ ok: false, reason: result.reason });
        return;
      }
      for (const room of result.rooms) socket.join(room);
      if (typeof ack === 'function') ack({ ok: true, rooms: result.rooms });
    });
    socket.on('leave', (payload = {}) => {
      if (payload.restaurantId) {
        socket.leave(ROOMS.restaurant(String(payload.restaurantId)));
        socket.leave(ROOMS.kitchen(String(payload.restaurantId)));
      }
      if (payload.customerId) socket.leave(ROOMS.customer(String(payload.customerId)));
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export default { initSocket, getIO, ROOMS, authorizeJoin };
