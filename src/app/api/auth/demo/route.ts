import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDeviceGuestUser, setSessionCookie } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name : undefined;

    const user = await getOrCreateDeviceGuestUser(name);
    await setSessionCookie(user.id);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Guest login error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize guest profile.' },
      { status: 500 },
    );
  }
}
