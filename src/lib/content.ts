/**
 * Public-site content reader. Per-clinic, direct from Postgres (no snapshot
 * indirection in v2 — the local-first sync architecture is gone).
 *
 * Used by the public website pages under /c/[clinicSlug]/...
 *
 * Caching: Next.js' `unstable_cache` with a short TTL would help when one
 * clinic gets a traffic spike. For v1 we trust Next's segment-level
 * `dynamic = 'force-dynamic'` + Postgres being plenty fast for these reads.
 * Add caching when measurements show it matters.
 */
import { prisma } from './db';
import { getClinicBySlug } from './tenant';

export type PublicSnapshot = {
  clinic: { id: number; slug: string; name: string };
  settings: {
    clinicName: string;
    tagline: string;
    about: string;
    address: string;
    phone: string;
    email: string;
    googlePlaceId: string;
    googleMapsUrl: string;
    latitude: number | null;
    longitude: number | null;
    timezone: string;
    workingHours: unknown;
    themeConfig: unknown;
    logoUrl: string;
    faviconUrl: string;
    heroImageUrl: string;
    heroHeadline: string;
    heroSubheadline: string;
  };
  doctors: Array<{
    id: number;
    name: string;
    slug: string;
    photoUrl: string;
    qualifications: string;
    bio: string;
    specialties: string;
    yearsExperience: number;
    consultationDurationMin: number;
    acceptingAppointments: boolean;
    displayOrder: number;
  }>;
  services: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
    durationMin: number;
    displayOrder: number;
  }>;
  reviews: Array<{
    id: number;
    source: string;
    author: string;
    rating: number;
    text: string;
    reviewedAt: string;
    authorPhotoUrl: string;
    featured: boolean;
    displayOrder: number;
  }>;
  siteContent: Record<string, unknown>;
};

const EMPTY_SETTINGS: PublicSnapshot['settings'] = {
  clinicName: '',
  tagline: '',
  about: '',
  address: '',
  phone: '',
  email: '',
  googlePlaceId: '',
  googleMapsUrl: '',
  latitude: null,
  longitude: null,
  timezone: 'Asia/Kolkata',
  workingHours: {},
  themeConfig: {},
  logoUrl: '',
  faviconUrl: '',
  heroImageUrl: '',
  heroHeadline: '',
  heroSubheadline: '',
};

export async function getPublicSnapshot(clinicSlug: string): Promise<PublicSnapshot | null> {
  const clinic = await getClinicBySlug(clinicSlug);
  if (!clinic || !clinic.active) return null;

  const [settings, doctors, services, reviews, siteContent] = await Promise.all([
    prisma.settings.findUnique({ where: { clinicId: clinic.id } }),
    prisma.doctor.findMany({
      where: { clinicId: clinic.id, active: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.service.findMany({
      where: { clinicId: clinic.id, active: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.review.findMany({
      where: { clinicId: clinic.id },
      orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { reviewedAt: 'desc' }],
    }),
    prisma.siteContent.findMany({ where: { clinicId: clinic.id } }),
  ]);

  const sc: Record<string, unknown> = {};
  for (const row of siteContent) sc[row.key] = row.value;

  return {
    clinic: { id: clinic.id, slug: clinic.slug, name: clinic.name },
    settings: settings
      ? {
          clinicName: settings.clinicName,
          tagline: settings.tagline,
          about: settings.about,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          googlePlaceId: settings.googlePlaceId,
          googleMapsUrl: settings.googleMapsUrl,
          latitude: settings.latitude,
          longitude: settings.longitude,
          timezone: settings.timezone,
          workingHours: settings.workingHours,
          themeConfig: settings.themeConfig,
          logoUrl: settings.logoUrl,
          faviconUrl: settings.faviconUrl,
          heroImageUrl: settings.heroImageUrl,
          heroHeadline: settings.heroHeadline,
          heroSubheadline: settings.heroSubheadline,
        }
      : { ...EMPTY_SETTINGS, clinicName: clinic.name },
    doctors: doctors.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      photoUrl: d.photoUrl,
      qualifications: d.qualifications,
      bio: d.bio,
      specialties: d.specialties,
      yearsExperience: d.yearsExperience,
      consultationDurationMin: d.consultationDurationMin,
      acceptingAppointments: d.acceptingAppointments,
      displayOrder: d.displayOrder,
    })),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
      durationMin: s.durationMin,
      displayOrder: s.displayOrder,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      source: r.source,
      author: r.author,
      rating: r.rating,
      text: r.text,
      reviewedAt: r.reviewedAt.toISOString(),
      authorPhotoUrl: r.authorPhotoUrl,
      featured: r.featured,
      displayOrder: r.displayOrder,
    })),
    siteContent: sc,
  };
}

export function siteContentValue<T>(
  snapshot: PublicSnapshot,
  key: string,
  fallback: T
): T {
  const v = snapshot.siteContent[key];
  return (v ?? fallback) as T;
}
