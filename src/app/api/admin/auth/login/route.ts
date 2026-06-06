import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
  }

  const { email, password } = parsed.data;

  let admin;
  try {
    admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });
  } catch {
    return NextResponse.json({ error: 'Gagal terhubung ke database' }, { status: 503 });
  }

  if (!admin || !admin.isActive) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const session = await getSession();
  session.adminId = admin.id;
  session.email = admin.email;
  session.role = admin.role;
  session.name = admin.name;
  await session.save();

  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}
