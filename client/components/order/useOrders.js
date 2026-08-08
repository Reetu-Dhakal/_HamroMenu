'use client';

import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import api, { getStoredTokens } from '@/lib/api';
import { useToast } from '@/components/Toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useOrders(restaurantId, user, tableId) {
  const [active, setActive] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const refresh = useCallback(async () => {
    if (!restaurantId || !tableId || !getStoredTokens()) return;
    try {
      const res = await api.get(`/orders/table/${tableId}/active`);
      setActive(res.data);
    } catch {
      setActive(null);
    }
  }, [restaurantId, tableId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user || !restaurantId) return;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      socket.emit('join', { restaurantId, customerId: user._id });
    });
    socket.on('order:status', (payload) => {
      refresh();
      if (payload.status === 'ready') toast && toast.success?.('Your order is ready!');
      if (payload.status === 'cancelled') toast && toast.error?.('Order cancelled.');
    });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, restaurantId]);

  const placeOrder = useCallback(
    async (payload) => {
      setBusy(true);
      try {
        const res = await api.post(`/orders/restaurant/${restaurantId}`, payload);
        setActive(res.data);
        return res.data;
      } finally {
        setBusy(false);
      }
    },
    [restaurantId]
  );

  return { active, busy, refresh, placeOrder };
}

export default api;