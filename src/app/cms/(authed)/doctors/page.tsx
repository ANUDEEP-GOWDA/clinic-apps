import Link from 'next/link';
import { ssrTenant } from '@/lib/ssr-tenant';

export const dynamic = 'force-dynamic';

export default async function DoctorsPage() {
  const { tdb } = await ssrTenant();
  const doctors = await tdb.doctor.findMany({ orderBy: { displayOrder: 'asc' } });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Doctors</h1>
        <Link
          href="/cms/doctors/new"
          className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm"
        >
          + Add Doctor
        </Link>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100">
        {doctors.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No doctors yet.</p>
        ) : (
          doctors.map((d) => (
            <Link
              key={d.id}
              href={`/cms/doctors/${d.id}`}
              className="flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-slate-500">
                  {d.qualifications}
                  {d.specialties ? ` · ${d.specialties}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={d.acceptingAppointments ? 'text-emerald-700' : 'text-red-700'}>
                  {d.acceptingAppointments ? 'Accepting' : 'Paused'}
                </span>
                <span className={d.active ? 'text-slate-500' : 'text-slate-400 line-through'}>
                  {d.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
