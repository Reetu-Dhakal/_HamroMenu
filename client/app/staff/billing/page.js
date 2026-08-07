'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Receipt, Banknote, Printer } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import RoleGuard from '@/components/RoleGuard';
import DashboardShell from '@/components/DashboardShell';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/components/Toast';

export default function BillingPage() {
  const { user } = useAuth();
  return <RoleGuard roles={['staff', 'admin']}><BillingInner /></RoleGuard>;
}

function BillingInner() {
  const toast = useToast();
  const params = useSearchParams();
  const orderId = params.get('order');
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(orderId ? true : false);

  useEffect(() => {
    if (orderId) {
      api.get(`/staff/orders/${orderId}/bill`).then((r) => setBill(r.data)).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
    }
  }, [orderId, toast]);

  const collect = async () => {
    try {
      await api.post(`/staff/orders/${orderId}/collect-cash`);
      toast.success('Payment collected, order completed');
      api.get(`/staff/orders/${orderId}/bill`).then((r) => setBill(r.data));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardShell title="Billing" subtitle="Generate and settle an order bill">
      {loading ? (
        <div className="skeleton h-72" />
      ) : !bill ? (
        <div className="card p-12 text-center">
          <Receipt className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 font-display text-lg font-semibold text-ink-900">Select an order to bill</p>
          <p className="text-sm text-ink-500">Go to Staff → Orders and click "Bill" on any order.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-md">
          <div className="card overflow-hidden">
            <div className="bg-ink-950 px-6 py-5 text-center text-cream">
              <p className="font-display text-lg font-semibold">Himalayan Flavors</p>
              <p className="text-xs text-ink-300">{bill.orderNumber} · {formatDate(bill.placedAt)}</p>
              {bill.table && <p className="text-xs text-ink-300">Table {bill.table.label}</p>}
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {bill.items.map((it) => (
                  <li key={it._id} className="flex justify-between text-sm">
                    <span className="text-ink-700">{it.name} <span className="text-ink-400">×{it.quantity}</span></span>
                    <span className="font-medium">{formatCurrency(it.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1.5 border-t border-dashed border-ink-900/15 pt-4 text-sm">
                <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span></div>
                {bill.discountTotal > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{formatCurrency(bill.discountTotal)}</span></div>}
                <div className="flex justify-between text-ink-600"><span>Tax</span><span>{formatCurrency(bill.tax)}</span></div>
                <div className="flex justify-between text-ink-600"><span>Service</span><span>{formatCurrency(bill.serviceCharge)}</span></div>
                <div className="flex justify-between gap-4 border-t border-ink-900/10 pt-3 font-display text-xl font-semibold text-ink-950">
                  <span>Total</span><span>{formatCurrency(bill.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-clay flex-1" onClick={collect}><Banknote className="h-4 w-4" /> Collect cash & complete</button>
            <button className="btn-outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}