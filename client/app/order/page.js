import { Suspense } from 'react';
import OrderApp from '@/components/order/OrderApp';

export const metadata = { title: 'Order from your table' };

export default function OrderPage() {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderApp />
    </Suspense>
  );
}

function OrderSkeleton() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="container-px py-6">
        <div className="skeleton h-8 w-1/2" />
        <div className="mt-6 space-y-4">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      </div>
    </div>
  );
}