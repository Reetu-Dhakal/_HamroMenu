'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRestaurant, useMenu } from '@/lib/useApi';
import { useCart } from '@/lib/useCart';
import MenuBrowser from './MenuBrowser';
import CartSheet from './CartSheet';
import CheckoutSheet from './CheckoutSheet';
import OrderTracker from './OrderTracker';
import { useOrders } from './useOrders';

function OrderCore() {
  const params = useSearchParams();
  const rid = params.get('r');
  const tid = params.get('t');
  const { user } = useAuth();

  const restaurant = useRestaurant(rid);
  const menu = useMenu(rid);
  const cart = useCart(rid, user);
  const orders = useOrders(rid, user, tid);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(typeof window !== 'undefined' ? localStorage.getItem('hm.activeOrder') || null : null);

  const showTracker = !!activeOrderId && !!orders.active;

  useEffect(() => {
    if (activeOrderId) localStorage.setItem('hm.activeOrder', activeOrderId);
  }, [activeOrderId]);

  const onPlaced = (orderId) => {
    setActiveOrderId(orderId);
    setCheckoutOpen(false);
    setCartOpen(false);
    orders.refresh();
  };

  if (showTracker && orders.active) {
    return (
      <OrderTracker
        order={orders.active}
        restaurantId={rid}
        table={orders.table}
        onDone={() => {
          localStorage.removeItem('hm.activeOrder');
          setActiveOrderId(null);
          orders.refresh();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <MenuBrowser
        restaurant={restaurant.data}
        menu={menu}
        cart={cart}
        onOpenCart={() => setCartOpen(true)}
        onCheckout={() => setCheckoutOpen(true)}
        onAdd={cart.addItem}
        activeOrder={orders.active}
      />

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        restaurant={restaurant.data}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        restaurant={restaurant.data}
        tableId={tid}
        user={user}
        onPlaced={onPlaced}
        onPlace={orders.placeOrder}
      />
    </div>
  );
}

export default function OrderApp() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-600">Loading your table…</div>}>
      <OrderCore />
    </Suspense>
  );
}