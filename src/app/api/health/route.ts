import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    publicDeploy: process.env.PUBLIC_DEPLOY === '1',
    time: new Date().toISOString(),
  });
}
