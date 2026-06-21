import PaymentList from '@/components/cms/PaymentList';

export const dynamic = 'force-dynamic';

export default function PaymentsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Payments</h1>
      <PaymentList />
    </div>
  );
}
