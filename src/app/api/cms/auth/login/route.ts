import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { check, clientKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!check(clientKey(req, 'login'), { capacity: 10, refillPerMinute: 5 })) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }
  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const result = await loginUser({ email: body.email, password: body.password });
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
