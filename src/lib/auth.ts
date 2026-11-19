import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { UserProfile } from '@/types/archive';

const SESSION_COOKIE_NAME = 'tastory_session';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export const GUEST_USER = {
  email: 'guest@tastory.local',
  defaultName: 'Guest Curator',
};

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    'tastory-local-dev-secret-change-in-production'
  );
}

interface SessionPayload {
  userId: string;
  exp: number;
}

export function signSessionToken(userId: string): string {
  const payload: SessionPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;

    const expectedSig = crypto
      .createHmac('sha256', getSecret())
      .update(encoded)
      .digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as SessionPayload;

    if (!payload.userId || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const token = signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getOrCreateGuestUser(name?: string): Promise<UserProfile> {
  const cleanName = (name || '').trim().slice(0, 32);
  const user = await prisma.user.upsert({
    where: { email: GUEST_USER.email },
    update: cleanName ? { name: cleanName } : {},
    create: {
      email: GUEST_USER.email,
      name: cleanName || GUEST_USER.defaultName,
      provider: 'guest',
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      provider: true,
    },
  });
  return user;
}

export async function getCurrentUser(): Promise<UserProfile> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifySessionToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            provider: true,
          },
        });
        if (user) return user;
      }
    }
  } catch {
    // Fall back to default guest user
  }
  return getOrCreateGuestUser();
}
