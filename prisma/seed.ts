/**
 * Seed script — creates a single demo clinic so a fresh deploy boots into a
 * usable state. Idempotent: re-running won't duplicate.
 *
 * Demo clinic credentials are read from env (with safe-ish defaults). Change
 * SEED_OWNER_PASSWORD before going live, and disable seeding (or run
 * `prisma migrate deploy` only) once you have real clinics.
 *
 * Run:
 *   npm run db:seed
 *   # or: tsx prisma/seed.ts
 */
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_SLUG = process.env.SEED_CLINIC_SLUG ?? 'demo';
const DEMO_NAME = process.env.SEED_CLINIC_NAME ?? 'Demo Clinic';
const OWNER_NAME = process.env.SEED_OWNER_NAME ?? 'Demo Owner';
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? 'owner@example.com';
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? 'change-me-please-soon';

async function main() {
  console.log(`Seeding clinic "${DEMO_SLUG}"…`);

  const existing = await prisma.clinic.findUnique({ where: { slug: DEMO_SLUG } });
  if (existing) {
    console.log(`  Clinic "${DEMO_SLUG}" already exists (id=${existing.id}). Skipping.`);
    console.log('  Login at /cms/login with:');
    console.log(`    Clinic: ${DEMO_SLUG}`);
    console.log(`    Email:  ${OWNER_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);

  const clinic = await prisma.$transaction(async (tx) => {
    const c = await tx.clinic.create({
      data: { slug: DEMO_SLUG, name: DEMO_NAME },
    });

    await tx.user.create({
      data: {
        clinicId: c.id,
        name: OWNER_NAME,
        email: OWNER_EMAIL,
        passwordHash,
        role: Role.OWNER,
      },
    });

    await tx.settings.create({
      data: {
        clinicId: c.id,
        clinicName: DEMO_NAME,
        tagline: 'Quality care, simplified.',
        about:
          'A demo clinic to show the platform. Replace this content via the CMS.',
        address: '123 Demo Street, Sample City',
        phone: '+1 555 000 0000',
        email: OWNER_EMAIL,
        timezone: 'Asia/Kolkata',
        heroHeadline: 'Welcome to ' + DEMO_NAME,
        heroSubheadline: 'Edit this from your CMS.',
      },
    });

    // One demo doctor + service so the public site has something to render.
    const doctor = await tx.doctor.create({
      data: {
        clinicId: c.id,
        name: 'Dr. Demo',
        slug: 'dr-demo',
        qualifications: 'MBBS, MD',
        bio: 'A placeholder doctor profile. Edit in CMS.',
        specialties: 'General Medicine',
        consultationDurationMin: 15,
        acceptingAppointments: true,
        displayOrder: 0,
      },
    });
    // Mon–Fri, 9–5
    for (let d = 1; d <= 5; d++) {
      await tx.doctorSchedule.create({
        data: {
          clinicId: c.id,
          doctorId: doctor.id,
          dayOfWeek: d,
          startTime: '09:00',
          endTime: '17:00',
        },
      });
    }

    await tx.service.create({
      data: {
        clinicId: c.id,
        name: 'General Consultation',
        description: 'Edit this in CMS.',
        durationMin: 15,
        displayOrder: 0,
      },
    });

    await tx.auditLog.create({
      data: {
        clinicId: c.id,
        action: 'clinic.seeded',
        entityType: 'Clinic',
        entityId: c.id,
      },
    });
    return c;
  });

  console.log(`  Created clinic id=${clinic.id} slug="${clinic.slug}"`);
  console.log('');
  console.log('  Public site:    /c/' + clinic.slug);
  console.log('  CMS login:      /cms/login');
  console.log('    Clinic slug:  ' + clinic.slug);
  console.log('    Email:        ' + OWNER_EMAIL);
  console.log('    Password:     ' + (process.env.SEED_OWNER_PASSWORD ? '(from SEED_OWNER_PASSWORD)' : OWNER_PASSWORD));
  console.log('');
  console.log('  Change the owner password from CMS settings on first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
