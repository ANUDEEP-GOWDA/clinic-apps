import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (!id) return new NextResponse(null, { status: 404 });

  const media = await prisma.media.findUnique({
    where: { id },
    select: { bytes: true, mimeType: true, filename: true },
  });

  if (!media?.bytes) return new NextResponse(null, { status: 404 });

  return new NextResponse(media.bytes, {
    headers: {
      'Content-Type': media.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${media.filename}"`,
    },
  });
}
