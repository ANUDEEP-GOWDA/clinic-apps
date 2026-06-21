'use client';

import { useEffect, useRef, useState } from 'react';

type LineItem = { name: string; qty: number; rate: number };

type Payment = {
  id: number;
  billNumber: string;
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes: string;
  status: string;
  razorpayLinkUrl: string | null;
  razorpayLinkId: string | null;
  paidAt: string | null;
  patient: { name: string; phone: string };
  card?: { doctor?: { name: string } } | null;
};

type Props = {
  cardId: number;
  patientId: number;
  patientName: string;
  doctorName?: string;
  consultationLabel?: string;
  existingPayment?: Payment | null;
};

function fmt(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function BillingPanel({
  cardId,
  patientId,
  patientName,
  doctorName,
  existingPayment,
}: Props) {
  const [payment, setPayment] = useState<Payment | null>(existingPayment ?? null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [waMsg, setWaMsg] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [manualPaidBusy, setManualPaidBusy] = useState(false);

  const [items, setItems] = useState<LineItem[]>([
    { name: doctorName ? `Consultation — Dr. ${doctorName}` : 'Consultation', qty: 1, rate: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const total = subtotal - discount + tax;

  // Load QR when payment has a link
  useEffect(() => {
    if (payment?.razorpayLinkUrl && !qrDataUrl) {
      fetch(`/api/cms/payments/${payment.id}`)
        .then((r) => r.json())
        .then((j: { qrDataUrl?: string }) => {
          if (j.qrDataUrl) setQrDataUrl(j.qrDataUrl);
        })
        .catch(() => {});
    }
  }, [payment?.id, payment?.razorpayLinkUrl, qrDataUrl]);

  async function createBill() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/cms/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          patientId,
          lineItems: items,
          discountAmount: discount * 100,
          taxAmount: tax * 100,
          notes,
          currency: 'INR',
        }),
      });
      const j = (await res.json()) as { payment?: Payment; error?: string };
      if (!res.ok || !j.payment) {
        setError(j.error ?? 'Failed to create bill');
        return;
      }
      setPayment(j.payment);
      setShowForm(false);
    } catch {
      setError('Network error');
    } finally {
      setBusy(false);
    }
  }

  async function sendWhatsApp(type: 'request' | 'receipt') {
    setBusy(true);
    setWaMsg('');
    try {
      const res = await fetch(`/api/cms/payments/${payment!.id}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setWaMsg(j.error ?? 'Send failed');
      } else {
        setWaMsg(type === 'request' ? 'Payment link sent via WhatsApp!' : 'Receipt sent via WhatsApp!');
      }
    } catch {
      setWaMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  async function markPaid() {
    setManualPaidBusy(true);
    try {
      const res = await fetch(`/api/cms/payments/${payment!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      const j = (await res.json()) as { payment?: Payment };
      if (j.payment) setPayment(j.payment as any);
    } catch {}
    setManualPaidBusy(false);
  }

  // ---- No payment yet ----
  if (!payment && !showForm) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium">Billing</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">No bill generated yet for this consultation.</p>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-700"
        >
          Generate Bill
        </button>
      </div>
    );
  }

  // ---- Bill creation form ----
  if (showForm) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <h3 className="font-medium">Generate Bill — {patientName}</h3>

        {/* Line items */}
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-6 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                placeholder="Description"
                value={item.name}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], name: e.target.value };
                  setItems(next);
                }}
              />
              <input
                type="number"
                className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center"
                placeholder="Qty"
                min={1}
                value={item.qty}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], qty: Number(e.target.value) || 1 };
                  setItems(next);
                }}
              />
              <input
                type="number"
                className="col-span-3 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right"
                placeholder="₹ Rate"
                min={0}
                value={item.rate || ''}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], rate: Number(e.target.value) || 0 };
                  setItems(next);
                }}
              />
              <button
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="col-span-1 text-slate-400 hover:text-red-500 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setItems([...items, { name: '', qty: 1, rate: 0 }])}
            className="text-xs text-blue-600 hover:underline"
          >
            + Add line item
          </button>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Discount (₹)</span>
            <input
              type="number"
              min={0}
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right"
              placeholder="0"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Tax (₹)</span>
            <input
              type="number"
              min={0}
              value={tax || ''}
              onChange={(e) => setTax(Number(e.target.value) || 0)}
              className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right"
              placeholder="0"
            />
          </div>
          <div className="flex justify-between font-semibold text-base border-t border-slate-200 pt-2">
            <span>Total</span>
            <span>₹{Math.max(0, total).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <textarea
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none"
          placeholder="Notes (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={createBill}
            disabled={busy || total <= 0}
            className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-sm disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create Bill'}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---- Existing payment view ----
  const isPaid = payment!.status === 'paid';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Bill {payment!.billNumber}</h3>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isPaid
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isPaid ? 'Paid' : 'Pending'}
        </span>
      </div>

      {/* Line items */}
      <div className="text-sm space-y-1">
        {payment!.lineItems.map((item, i) => (
          <div key={i} className="flex justify-between text-slate-700">
            <span>{item.name} × {item.qty}</span>
            <span>₹{(item.qty * item.rate).toLocaleString('en-IN')}</span>
          </div>
        ))}
        {payment!.discountAmount > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>Discount</span>
            <span>−₹{(payment!.discountAmount / 100).toLocaleString('en-IN')}</span>
          </div>
        )}
        {payment!.taxAmount > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>Tax</span>
            <span>+₹{(payment!.taxAmount / 100).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t border-slate-100 pt-1.5 mt-1">
          <span>Total</span>
          <span>₹{payment!.totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {isPaid && payment!.paidAt && (
        <p className="text-xs text-emerald-600">
          Paid on {new Date(payment!.paidAt).toLocaleString('en-IN')}
        </p>
      )}

      {/* QR + actions for pending */}
      {!isPaid && (
        <div className="space-y-3">
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-slate-500">Show QR to patient for in-clinic payment</p>
              <img src={qrDataUrl} alt="Payment QR" className="w-40 h-40 rounded-xl" />
            </div>
          )}

          {payment!.razorpayLinkUrl && (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={payment!.razorpayLinkUrl}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-slate-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(payment!.razorpayLinkUrl!)}
                className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Copy
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {payment!.razorpayLinkUrl && (
              <button
                onClick={() => sendWhatsApp('request')}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send Payment Link
              </button>
            )}
            <button
              onClick={markPaid}
              disabled={manualPaidBusy}
              className="text-sm px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              {manualPaidBusy ? 'Marking…' : 'Mark Paid (Cash/UPI)'}
            </button>
          </div>
        </div>
      )}

      {/* Receipt actions for paid */}
      {isPaid && (
        <button
          onClick={() => sendWhatsApp('receipt')}
          disabled={busy}
          className="flex items-center gap-1.5 text-sm px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Send Receipt via WhatsApp
        </button>
      )}

      {waMsg && (
        <p className={`text-xs ${waMsg.includes('!') ? 'text-emerald-600' : 'text-red-500'}`}>
          {waMsg}
        </p>
      )}
    </div>
  );
}
