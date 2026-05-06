import Link from 'next/link';
import { ssrTenant } from '@/lib/ssr-tenant';

export const dynamic = 'force-dynamic';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; id?: string };
}) {
  const { tdb } = await ssrTenant();
  const q = (searchParams.q || '').trim();
  const id = Number(searchParams.id || 0);

  const list = q
    ? await tdb.patient.findMany({
        where: {
          OR: [{ name: { contains: q } }, { phone: { contains: q } }],
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })
    : [];

  const selected = id
    ? await tdb.patient.findUnique({
        where: { id },
        include: {
          cards: {
            orderBy: { createdAt: 'desc' },
            include: { doctor: true },
            take: 100,
          },
        },
      })
    : null;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5">
        <h1 className="text-lg font-semibold mb-3">Patients</h1>
        <form>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or phone…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </form>
        <ul className="mt-4 space-y-1 text-sm">
          {q && list.length === 0 ? (
            <li className="text-slate-500">No matches.</li>
          ) : null}
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/cms/patients?q=${encodeURIComponent(q)}&id=${p.id}`}
                className={`block px-3 py-2 rounded-lg hover:bg-slate-50 ${
                  selected?.id === p.id ? 'bg-slate-100 font-medium' : ''
                }`}
              >
                <div>{p.name}</div>
                <div className="text-xs text-slate-500">{p.phone}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-2">
        {selected ? (
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h2 className="text-lg font-semibold">{selected.name}</h2>
              <p className="text-sm text-slate-500">{selected.phone}</p>
              {selected.notes ? (
                <p className="text-sm mt-2 text-slate-700 whitespace-pre-line">{selected.notes}</p>
              ) : null}
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-medium mb-3">Cards</h3>
              {selected.cards.length === 0 ? (
                <p className="text-sm text-slate-500">No cards yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {selected.cards.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/cms/cards/${c.id}`}
                        className="block px-3 py-2 rounded-lg hover:bg-slate-50"
                      >
                        <span className="capitalize font-medium">{c.type}</span>
                        <span className="ml-2 text-slate-500">{c.doctor.name}</span>
                        <span className="ml-2">
                          {c.slotDatetime ? new Date(c.slotDatetime).toLocaleString() : '—'}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">({c.state})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500">
            Search a patient to view their cards.
          </div>
        )}
      </div>
    </div>
  );
}
