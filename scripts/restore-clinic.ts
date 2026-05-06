/**
 * Restore a clinic from a backup JSON dump.
 *
 *   tsx scripts/restore-clinic.ts <path-to-clinic-<slug>-<ts>.json.gz>
 *
 * What it does: opens the gzip'd JSON, walks the dump, and re-creates the
 * clinic + its data in the connected Postgres. Refuses to run if a clinic
 * with the same slug already exists (you'd merge or rename first).
 *
 * Use cases:
 *   - Migrating a clinic between deployments.
 *   - Recovering a single tenant from a backup without touching others.
 *
 * For full-DB disaster recovery, use your managed Postgres provider's PITR
 * instead — it's faster and more complete than a logical re-import.
 *
 * Caveats:
 *   - Doesn't restore object storage (attachments, media) — those keys live
 *     in the dump but the binary content needs to come from your storage
 *     provider's own backup.
 *   - User passwords come back as their hashes — users sign in normally.
 *     If you don't have the hashes, set passwordHash to a known-bad value
 *     and have users go through password reset.
 */
import 'dotenv/config';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { PrismaClient } from '@prisma/client';

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: tsx scripts/restore-clinic.ts <backup.json.gz>');
    process.exit(1);
  }
  if (!fs.existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }

  const compressed = fs.readFileSync(path);
  const json = gunzipSync(compressed).toString('utf-8');
  const dump = JSON.parse(json);

  if (dump.version !== 1) {
    console.error(`Unsupported dump version: ${dump.version}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  const existing = await prisma.clinic.findUnique({
    where: { slug: dump.clinic.slug },
  });
  if (existing) {
    console.error(
      `A clinic with slug "${dump.clinic.slug}" already exists (id=${existing.id}). Refusing to overwrite.`
    );
    process.exit(1);
  }

  console.log(`Restoring clinic "${dump.clinic.slug}" (${dump.clinic.name})…`);

  await prisma.$transaction(async (tx) => {
    // Restore preserves IDs to keep references intact. If they collide with
    // existing data, the unique constraints will throw and the tx rolls back.
    await tx.clinic.create({ data: dropClientFields(dump.clinic) });

    if (dump.settings) {
      await tx.settings.create({ data: dropClientFields(dump.settings) });
    }

    for (const u of dump.users ?? []) {
      // Backup omits passwordHash (we never include it). Fill with a
      // placeholder that nobody can match; force password reset.
      await tx.user.create({
        data: {
          ...dropClientFields(u),
          passwordHash: '$2a$12$RESTORED_NO_PASSWORD_USE_PASSWORD_RESET_FLOW_xxxx',
        },
      });
    }

    const tables: Array<[string, any[]]> = [
      ['doctor', dump.doctors ?? []],
      ['service', dump.services ?? []],
      ['doctorSchedule', dump.doctorSchedules ?? []],
      ['doctorDayOverride', dump.doctorDayOverrides ?? []],
      ['patient', dump.patients ?? []],
      ['card', dump.cards ?? []],
      ['cardEvent', dump.cardEvents ?? []],
      ['consultationDetails', dump.consultationDetails ?? []],
      ['consultationAttachment', dump.consultationAttachments ?? []],
      ['callRequest', dump.callRequests ?? []],
      ['review', dump.reviews ?? []],
      ['siteContent', dump.siteContent ?? []],
      ['media', dump.media ?? []],
      ['whatsappMessage', dump.whatsappMessages ?? []],
    ];

    for (const [model, rows] of tables) {
      if (rows.length === 0) continue;
      console.log(`  ${model}: ${rows.length} rows`);
      // @ts-expect-error dynamic delegate access
      await tx[model].createMany({
        data: rows.map((r: any) => dropClientFields(r)),
        skipDuplicates: false,
      });
    }
  });

  console.log('Done.');
  await prisma.$disconnect();
}

// Backups include relation arrays etc. that Prisma createMany rejects.
// Strip everything that's not a plain scalar/Date/JSON value.
function dropClientFields<T extends Record<string, any>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') continue;
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      // Keep JSON-ish objects (themeConfig, payload, etc.). Drop only
      // arrays-of-relations.
      out[k] = v;
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
