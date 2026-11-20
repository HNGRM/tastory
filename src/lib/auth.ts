import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { UserProfile } from '@/types/archive';

const SESSION_COOKIE_NAME = 'tastory_session';
const DEVICE_COOKIE_NAME = 'tastory_device_id';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
const DEVICE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

export const GUEST_USER = {
  emailPrefix: 'guest-',
  emailDomain: '@tastory.local',
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

export async function getOrCreateDeviceGuestUser(
  name?: string,
): Promise<UserProfile> {
  const cleanName = (name || '').trim().slice(0, 32);

  // 1. If already signed in via active session, update/return that exact user
  const existingSessionUser = await getCurrentUser();
  if (existingSessionUser) {
    if (cleanName && cleanName !== existingSessionUser.name) {
      return prisma.user.update({
        where: { id: existingSessionUser.id },
        data: { name: cleanName },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          provider: true,
        },
      });
    }
    return existingSessionUser;
  }

  // 2. Otherwise identify this browser/device via persistent device cookie
  const cookieStore = await cookies();
  let deviceId = cookieStore.get(DEVICE_COOKIE_NAME)?.value?.trim();
  if (!deviceId || !/^[a-zA-Z0-9_-]{6,32}$/.test(deviceId)) {
    deviceId = crypto.randomBytes(6).toString('hex');
    cookieStore.set(DEVICE_COOKIE_NAME, deviceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DEVICE_MAX_AGE_SEC,
    });
  }

  const deviceEmail = `${GUEST_USER.emailPrefix}${deviceId}${GUEST_USER.emailDomain}`;
  const user = await prisma.user.upsert({
    where: { email: deviceEmail },
    update: cleanName ? { name: cleanName } : {},
    create: {
      email: deviceEmail,
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

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload) return null;

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
    return user;
  } catch {
    return null;
  }
}
