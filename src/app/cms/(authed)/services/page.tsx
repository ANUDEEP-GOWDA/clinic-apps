import { ssrTenant } from '@/lib/ssr-tenant';
import ServiceEditor from '@/components/cms/ServiceEditor';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const { tdb } = await ssrTenant();
  const services = await tdb.service.findMany({ orderBy: { displayOrder: 'asc' } });
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Services</h1>
      <ServiceEditor
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          icon: s.icon,
          durationMin: s.durationMin,
          displayOrder: s.displayOrder,
          active: s.active,
        }))}
      />
    </div>
  );
}
