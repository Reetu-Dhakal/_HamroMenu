import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request } from '../lib/apiClient';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const LOCAL_CART_KEY = 'hm_local_cart';
const SESSION_KEY = 'hm_menu_session';
const MODE_KEY = 'hm_cart_mode';

const round2 = (n) => Math.round(n * 100) / 100;

const EMPTY_CART = Object.freeze({
  items: [],
  itemCount: 0,
  subtotal: 0,
  discountTotal: 0,
  tax: 0,
  serviceCharge: 0,
  grandTotal: 0,
  appliedCoupon: null,
});

function sumOptionDeltas(options, item) {
  let delta = 0;
  for (const group of item.options || []) {
    const chosen = options?.[group.title];
    if (!chosen) continue;
    const choice = (group.choices || []).find((c) => c.label === chosen);
    if (choice) delta += Number(choice.priceDelta) || 0;
  }
  return delta;
}

function labelForOptions(options, item) {
  const parts = [];
  for (const group of item.options || []) {
    const chosen = options?.[group.title];
    if (chosen && (group.choices || []).some((c) => c.label === chosen)) parts.push(`${group.title}: ${chosen}`);
  }
  return parts.join(', ');
}

function computeTotals(items, taxRate = 0, serviceChargeRate = 0) {
  const subtotal = round2(items.reduce((s, it) => s + (it.lineTotal || 0), 0));
  const tax = round2(subtotal * taxRate);
  const serviceCharge = round2(subtotal * serviceChargeRate);
  const itemCount = items.reduce((s, it) => s + (it.quantity || 0), 0);
  return { subtotal, tax, serviceCharge, itemCount, grandTotal: round2(subtotal + tax + serviceCharge) };
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function readLocalCart(session) {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_CART_KEY)) || null;
    if (!raw) return null;
    if (session && raw.restaurantId !== session.restaurantId) return null;
    return { ...EMPTY_CART, ...raw };
  } catch {
    return null;
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [session, setSessionState] = useState(() => readSession());
  const [cart, setCart] = useState(() => {
    const s = readSession();
    const local = readLocalCart(s);
    return local || { ...EMPTY_CART };
  });
  const [mode, setMode] = useState(() => sessionStorage.getItem(MODE_KEY) || 'local');
  const [busy, setBusy] = useState(false);

  const restaurantId = session?.restaurantId || null;
  const taxRate = session?.restaurant?.taxRate ?? 0;
  const serviceChargeRate = session?.restaurant?.serviceChargeRate ?? 0;

  // ---------- session ----------
  const setSession = useCallback((data) => {
    const next = data
      ? { restaurantId: data.restaurantId, table: data.table || null, restaurant: data.restaurant || null }
      : null;
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSessionState(next);
    const local = readLocalCart(next);
    setCart(local || { ...EMPTY_CART });
    setMode('local');
    sessionStorage.setItem(MODE_KEY, 'local');
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSessionState(null);
    setCart({ ...EMPTY_CART });
    setMode('local');
    sessionStorage.setItem(MODE_KEY, 'local');
  }, []);

  // ---------- local cart ops ----------
  const updateLocalItem = useCallback((cartItemId, updates) => {
    setCart((prev) => {
      const items = prev.items.map((it) => {
        if (it._id !== cartItemId) return it;
        const quantity =
          updates.quantity != null && updates.quantity > 0 ? updates.quantity : it.quantity;
        return {
          ...it,
          quantity,
          specialInstructions: updates.specialInstructions ?? it.specialInstructions,
          lineTotal: round2(it.unitPrice * quantity),
        };
      });
      const next = { ...prev, items, ...computeLocalTotals(items, taxRate, serviceChargeRate) };
      return next;
    });
  }, [taxRate, serviceChargeRate]);

  const removeLocalItem = useCallback((cartItemId) => {
    setCart((prev) => {
      const items = prev.items.filter((it) => it._id !== cartItemId);
      const next = { ...prev, items, ...computeLocalTotals(items, taxRate, serviceChargeRate) };
      return next;
    });
  }, [taxRate, serviceChargeRate]);

  const clearLocal = useCallback(() => {
    setCart({ ...EMPTY_CART });
  }, []);

  // Persist local cart whenever it changes while in local mode
  useEffect(() => {
    if (mode === 'local') {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify({ restaurantId, ...cart }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, mode]);

  // ---------- server sync ----------
  const loadServerCart = useCallback(async (rid) => {
    setBusy(true);
    try {
      const data = await request(`/api/cart/${rid}`);
      setCart({
        items: data.items || [],
        itemCount: data.itemCount || 0,
        subtotal: data.subtotal || 0,
        discountTotal: data.discountTotal || 0,
        tax: data.tax || 0,
        serviceCharge: data.serviceCharge || 0,
        grandTotal: data.grandTotal || 0,
        appliedCoupon: data.appliedCoupon || data.coupon || null,
      });
      setMode('server');
      sessionStorage.setItem(MODE_KEY, 'server');
    } finally {
      setBusy(false);
    }
  }, []);

  const mergeLocalToServer = useCallback(
    async (rid) => {
      const local = readLocalCart({ restaurantId: rid });
      if (!local || !local.items?.length) {
        await loadServerCart(rid);
        return;
      }
      setBusy(true);
      try {
        for (const it of local.items) {
          await request(`/api/cart/${rid}/items`, {
            method: 'POST',
            body: {
              menuItem: it.menuItem,
              quantity: it.quantity,
              options: it.options || {},
              specialInstructions: it.specialInstructions || '',
            },
          });
        }
        localStorage.removeItem(LOCAL_CART_KEY);
        await loadServerCart(rid);
      } finally {
        setBusy(false);
      }
    },
    [loadServerCart]
  );

  // When auth state changes: merge guest cart into the server cart, or stay local
  useEffect(() => {
    if (!restaurantId) return;
    if (user && mode === 'local') {
      mergeLocalToServer(restaurantId);
    } else if (user && mode === 'server') {
      loadServerCart(restaurantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, restaurantId]);

  // ---------- public ops ----------
  const addItem = useCallback(
    async (item, opts = {}) => {
      if (mode === 'server' && user && restaurantId) {
        setBusy(true);
        try {
          const data = await request(`/api/cart/${restaurantId}/items`, {
            method: 'POST',
            body: {
              menuItem: item._id,
              quantity: opts.quantity || 1,
              options: opts.options || {},
              specialInstructions: opts.specialInstructions || '',
            },
          });
          setCart({
            items: data.items || [],
            itemCount: data.itemCount || 0,
            subtotal: data.subtotal || 0,
            discountTotal: data.discountTotal || 0,
            tax: data.tax || 0,
            serviceCharge: data.serviceCharge || 0,
            grandTotal: data.grandTotal || 0,
            appliedCoupon: data.appliedCoupon || null,
          });
        } finally {
          setBusy(false);
        }
      } else {
        setCart((prev) => {
          const label = labelForOptions(opts.options, item);
          const existing = prev.items.find(
            (it) =>
              it.menuItem === item._id &&
              (it.optionsLabel || '') === label &&
              (it.specialInstructions || '') === (opts.specialInstructions || '')
          );
          const quantity = opts.quantity || 1;
          const items = existing
            ? prev.items.map((it) =>
                it._id === existing._id
                  ? { ...it, quantity: it.quantity + quantity, lineTotal: round2(it.unitPrice * (it.quantity + quantity)) }
                  : it
              )
            : [
                ...prev.items,
                {
                  _id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  menuItem: item._id,
                  name: item.name,
                  unitPrice: round2(Number(item.price) + sumOptionDeltas(opts.options, item)),
                  quantity,
                  lineTotal: round2(unitPriceOf(item, opts) * quantity),
                  specialInstructions: opts.specialInstructions || '',
                  options: opts.options || {},
                  optionsLabel: label,
                  imageUrl: item.imageUrl,
                  prepTimeMinutes: item.prepTimeMinutes || 0,
                  isVeg: Boolean(item.isVeg),
                },
              ];
          const totals = computeLocalTotals(items, taxRate, serviceChargeRate);
          return { ...prev, items, ...totals };
        });
      }
    },
    [mode, user, restaurantId, taxRate, serviceChargeRate]
  );

  const updateItem = useCallback(
    async (cartItemId, updates) => {
      if (mode === 'server' && user && restaurantId) {
        setBusy(true);
        try {
          const data = await request(`/api/cart/${restaurantId}/items/${cartItemId}`, {
            method: 'PUT',
            body: updates,
          });
          setCart({
            items: data.items || [],
            subtotal: data.subtotal || 0,
            discountTotal: data.discountTotal || 0,
            tax: data.tax || 0,
            serviceCharge: data.serviceCharge || 0,
            grandTotal: data.grandTotal || 0,
          });
        } finally {
          setBusy(false);
        }
      } else {
        updateLocalItem(cartItemId, updates);
      }
    },
    [mode, user, restaurantId, updateLocalItem]
  );

  const removeItem = useCallback(
    async (cartItemId) => {
      if (mode === 'server' && user && restaurantId) {
        setBusy(true);
        try {
          const data = await request(`/api/cart/${restaurantId}/items/${cartItemId}`, { method: 'DELETE' });
          setCart({
            items: data.items || [],
            subtotal: data.subtotal || 0,
            discountTotal: data.discountTotal || 0,
            tax: data.tax || 0,
            serviceCharge: data.serviceCharge || 0,
            grandTotal: data.grandTotal || 0,
          });
        } finally {
          setBusy(false);
        }
      } else {
        removeLocalItem(cartItemId);
      }
    },
    [mode, restaurantId, removeLocalItem]
  );

  const clear = useCallback(async () => {
    if (mode === 'server' && user && restaurantId) {
      try {
        await request(`/api/cart/${restaurantId}`, { method: 'DELETE' });
      } catch (_) {}
    }
    clearLocal();
  }, [mode, user, restaurantId, clearLocal]);

  const applyCoupon = useCallback(
    async (code) => {
      if (!(mode === 'server' && user && restaurantId)) {
        return { guest: true };
      }
      const data = await request(`/api/cart/${restaurantId}/coupon`, { method: 'POST', body: { code } });
      setCart((prev) => ({
        ...prev,
        subtotal: data.subtotal || 0,
        discountTotal: data.discountTotal || 0,
        tax: data.tax || 0,
        serviceCharge: data.serviceCharge || 0,
        grandTotal: data.grandTotal || 0,
        appliedCoupon: data.appliedCoupon || null,
      }));
      return data.appliedCoupon;
    },
    [mode, user, restaurantId]
  );

  const removeCoupon = useCallback(async () => {
    if (mode === 'server' && user && restaurantId) {
      const data = await request(`/api/cart/${restaurantId}/coupon`, { method: 'DELETE' });
      setCart((prev) => ({ ...prev, ...data }));
    }
    setCart((prev) => ({ ...prev, appliedCoupon: null }));
  }, [mode, user, restaurantId]);

  const value = useMemo(
    () => ({
      ...cart,
      session,
      mode,
      busy,
      setSession,
      clearSession,
      addItem,
      updateItem,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
      mergeLocalToServer,
      hasItems: (cart?.itemCount || 0) > 0,
      menuItemIds: cart?.items?.map((i) => i.menuItem) || [],
    }),
    [cart, session, mode, busy, setSession, clearSession, addItem, updateItem, removeItem, clear, applyCoupon, removeCoupon, mergeLocalToServer]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function computeLocalTotals(items, taxRate, serviceChargeRate) {
  const subtotal = round2(items.reduce((s, it) => s + (it.lineTotal || 0), 0));
  const tax = round2(subtotal * taxRate);
  const serviceCharge = round2(subtotal * serviceChargeRate);
  const itemCount = items.reduce((s, it) => s + (it.quantity || 0), 0);
  return { subtotal, tax, serviceCharge, itemCount, grandTotal: round2(subtotal + tax + serviceCharge) };
}

function unitPriceOf(item, opts) {
  return round2(Number(item.price) + sumOptionDeltas(opts.options, item));
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}