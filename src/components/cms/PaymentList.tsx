'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PaymentItem = {
  id: number;
  billNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  patient: { name: string; phone: string };
  card: { id: number; doctor: { name: string } } | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-600',
  refunded: 'bg-slate-100 text-slate-600',
};

export default function PaymentList() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    fetch(`/api/cms/payments?${params}`)
      .then((r) => r.json())
      .then((j: { items?: PaymentItem[]; total?: number }) => {
        setItems(j.items ?? []);
        setTotal(j.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status]);

  const totalPages = Math.ceil(total / 30);
  const totalPaid = items.filter((p) => p.status === 'paid').reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Bills', value: total },
          { label: 'Paid this page', value: `₹${totalPaid.toLocaleString('en-IN')}` },
          { label: 'Pending this page', value: items.filter(p => p.status === 'pending').length },
          { label: 'Page', value: `${page} / ${totalPages || 1}` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className="text-lg font-semibold mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'paid', 'refunded'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              status === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:border-slate-400'
            }`}
          >
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-500 py-8 text-center">No payments found.</div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="text-left px-4 py-3">Bill #</th>
                  <th className="text-left px-4 py-3">Patient</th>
                  <th className="text-left px-4 py-3">Doctor</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.billNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.patient.name}</div>
                      <div className="text-xs text-slate-400">{p.patient.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.card?.doctor?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₹{p.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {p.card?.id && (
                        <Link
                          href={`/cms/cards/${p.card.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View card
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm px-3 py-1.5 text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
