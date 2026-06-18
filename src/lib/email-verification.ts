import crypto from 'node:crypto';
import { prisma } from './db';
import { sendEmail } from './email';
import { env } from './env';
import { log } from './log';

const TOKEN_TTL_HOURS = 24;

export async function createAndSendVerificationEmail(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { clinic: true },
  });
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60_000);

  await prisma.emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } });

  const r = await sendVerificationEmail({ user, rawToken });
  if (!r.ok) log.error('email_verification.send_failed', { userId, err: r.error });
}

export async function sendVerificationEmail(opts: {
  user: { id: number; name: string; email: string; clinic: { name: string } };
  rawToken: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { user, rawToken } = opts;
  const link = `${env.APP_URL.replace(/\/$/, '')}/api/public/verify-email?token=${rawToken}`;
  const subj = `Verify your email — ${user.clinic.name}`;
  const html = `
    <p>Hi ${user.name},</p>
    <p>Thanks for signing up for <b>${user.clinic.name}</b> on our platform.</p>
    <p>Please verify your email address to keep your account secure:</p>
    <p>
      <a href="${link}" style="display:inline-block;padding:10px 16px;background:#0f172a;color:white;border-radius:8px;text-decoration:none">
        Verify email address
      </a>
    </p>
    <p>This link expires in ${TOKEN_TTL_HOURS} hours. If you didn't create this account, you can safely ignore this email.</p>
  `;
  return sendEmail({ to: user.email, subject: subj, html });
}
