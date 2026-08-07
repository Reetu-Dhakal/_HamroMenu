'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { getStoredTokens } from './api';

const CART_CACHE = 'hm.cart';

export function useCart(restaurantId, user) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAuthed = () => !!user && !!getStoredTokens();

  const fetchCart = useCallback(async () => {
    if (!restaurantId) return null;
    if (isAuthed()) {
      const res = await api.get(`/cart/${restaurantId}`);
      setCart(res.data);
      return res.data;
    }
    try {
      const cached = JSON.parse(localStorage.getItem(CART_CACHE) || 'null');
      if (cached) setCart(cached);
      return cached;
    } catch {
      return null;
    }
  }, [restaurantId, user]);

  useEffect(() => {
    if (restaurantId) fetchCart();
  }, [restaurantId, user, fetchCart]);

  const persistLocal = (next) => {
    setCart(next);
    if (!isAuthed()) localStorage.setItem(CART_CACHE, JSON.stringify(next));
    return next;
  };

  const mutate = useCallback(
    async (op) => {
      if (isAuthed()) {
        setLoading(true);
        try {
          const res = await op();
          setCart(res.data);
          return res.data;
        } finally {
          setLoading(false);
        }
      }
      // guest: local-only cart mutations
      let current = cart || { items: [], subtotal: 0, discountTotal: 0, tax: 0, serviceCharge: 0, grandTotal: 0, itemCount: 0 };
      return persistLocal(current);
    },
    [cart, user]
  );

  const addItem = useCallback(
    async (menuItem, { quantity = 1, options = {}, specialInstructions = '' } = {}) => {
      if (isAuthed()) {
        return mutate(() => api.post(`/cart/${restaurantId}/items`, { menuItem: menuItem._id, quantity, options, specialInstructions }));
      }
      const current = cart || { items: [], subtotal: 0, discountTotal: 0, tax: 0, serviceCharge: 0, grandTotal: 0, itemCount: 0 };
      const existing = current.items.find((it) => it.menuItem === menuItem._id);
      const unitPrice = menuItem.discountedPrice ?? menuItem.price;
      if (existing) {
        existing.quantity += quantity;
        existing.lineTotal = existing.unitPrice * existing.quantity;
      } else {
        current.items.push({
          _id: `local-${Date.now()}`,
          menuItem: menuItem._id,
          name: menuItem.name,
          unitPrice,
          imageUrl: menuItem.imageUrl,
          quantity,
          specialInstructions,
          optionsLabel: '',
          lineTotal: unitPrice * quantity,
        });
      }
      return persistLocal({ ...current });
    },
    [cart, restaurantId]
  );

  const updateQty = useCallback(
    async (itemId, quantity) => {
      if (isAuthed()) return mutate(() => api.put(`/cart/${restaurantId}/items/${itemId}`, { quantity }));
      const current = { ...cart };
      const it = current.items.find((i) => i._id === itemId);
      if (it) {
        if (quantity <= 0) current.items = current.items.filter((i) => i._id !== itemId);
        else {
          it.quantity = quantity;
          it.lineTotal = it.unitPrice * quantity;
        }
      }
      return persistLocal({ ...current });
    },
    [cart, restaurantId]
  );

  const removeItem = useCallback(
    async (itemId) => {
      if (isAuthed()) return mutate(() => api.del(`/cart/${restaurantId}/items/${itemId}`));
      return persistLocal({ ...cart, items: (cart?.items || []).filter((i) => i._id !== itemId) });
    },
    [cart, restaurantId]
  );

  const clear = useCallback(async () => {
    if (isAuthed()) return mutate(() => api.del(`/cart/${restaurantId}`));
    return persistLocal({ items: [], subtotal: 0, discountTotal: 0, tax: 0, serviceCharge: 0, grandTotal: 0, itemCount: 0 });
  }, [cart, restaurantId]);

  const applyCoupon = useCallback(
    async (code) => {
      if (isAuthed()) return mutate(() => api.post(`/cart/${restaurantId}/coupon`, { code }));
      return { error: 'Sign in to apply coupons' };
    },
    [cart, restaurantId]
  );

  const removeCoupon = useCallback(async () => {
    if (isAuthed()) return mutate(() => api.del(`/cart/${restaurantId}/coupon`));
    return persistLocal({ ...cart, appliedCoupon: undefined });
  }, [cart, restaurantId]);

  return {
    cart,
    loading,
    addItem,
    updateQty,
    removeItem,
    clear,
    applyCoupon,
    removeCoupon,
    fetchCart,
    isAuthed,
    itemCount: cart?.itemCount || 0,
    grandTotal: cart?.grandTotal || 0,
  };
}