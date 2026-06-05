import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, 'login', RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const { email, password } = parsed.data;
  const ip = req.headers.get('x-forwarded-for') ?? undefined;

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !admin.isActive) {
    await auditLog({ action: 'LOGIN_FAILED', metadata: { reason: 'not_found' }, ip });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    await auditLog({ action: 'LOGIN_FAILED', actorAdminId: admin.id, metadata: { reason: 'wrong_password' }, ip });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const session = await getSession();
  session.adminId = admin.id;
  session.email   = admin.email;
  session.role    = admin.role;
  session.name    = admin.name;
  await session.save();

  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await auditLog({ action: 'LOGIN_SUCCESS', actorAdminId: admin.id, ip });

  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}
