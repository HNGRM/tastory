import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { serializePost, sanitizePostItems } from '@/lib/postSerializer';
import { prisma } from '@/lib/prisma';
import { ensureSeeded } from '@/lib/seed';

export async function GET(request: NextRequest) {
  const [, currentUser] = await Promise.all([
    ensureSeeded(),
    getCurrentUser(),
  ]);

  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location')?.trim() || '';
  const sort = searchParams.get('sort') || 'latest';
  const userId = searchParams.get('userId')?.trim() || '';
  const likedByMe = searchParams.get('likedByMe') === 'true';
  const query = searchParams.get('q')?.trim() || '';
  const limitParam = Number(searchParams.get('limit') || '0');
  const offsetParam = Number(searchParams.get('offset') || '0');
  const take =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : undefined;
  const skip =
    Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : undefined;

  const where: Record<string, unknown> = {};
  if (location && location !== 'all') {
    where.locationText = location;
  }
  if (userId) {
    where.userId = userId;
  }
  if (likedByMe && currentUser) {
    where.likes = { some: { userId: currentUser.id } };
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { caption: { contains: query, mode: 'insensitive' } },
      { locationText: { contains: query, mode: 'insensitive' } },
      { user: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  const [posts, totalCount, locationGroups] = await Promise.all([
    prisma.post.findMany({
      where,
      take,
      skip,
      include: {
        user: { select: { id: true, name: true, image: true } },
        items: true,
        likes: currentUser
          ? { where: { userId: currentUser.id }, select: { userId: true } }
          : { where: { userId: '__none__' }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
        comments: {
          take: 10,
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
      orderBy:
        sort === 'popular'
          ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }],
    }),
    prisma.post.count({ where }),
    prisma.post.groupBy({
      by: ['locationText', 'city', 'countryCode'],
      _count: { id: true },
      _avg: { latitude: true, longitude: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => serializePost(p, currentUser?.id || null)),
    totalCount,
    hasMore:
      take !== undefined ? (skip || 0) + posts.length < totalCount : false,
    locations: locationGroups.map((g) => ({
      locationText: g.locationText,
      city: g.city,
      countryCode: g.countryCode,
      count: g._count.id,
      latitude: g._avg.latitude,
      longitude: g._avg.longitude,
    })),
  });
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: 'Please sign in to publish your taste story.' },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const items = sanitizePostItems(body.items);
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Please add at least one item to your story before publishing.' },
        { status: 400 },
      );
    }

    const title = String(body.title || 'MY 5-YEAR TASTORY').trim().slice(0, 80) || 'MY 5-YEAR TASTORY';
    const caption = body.caption ? String(body.caption).trim().slice(0, 280) : null;
    const city = String(body.city || 'Seoul').trim().slice(0, 60) || 'Seoul';
    const country = String(body.country || 'South Korea').trim().slice(0, 60) || 'South Korea';
    const countryCode = String(body.countryCode || '').trim().slice(0, 4).toUpperCase();
    const locationText =
      String(body.locationText || '').trim().slice(0, 80) ||
      (countryCode ? `${city}, ${countryCode}` : `${city}, ${country}`);

    const aspectRatio = ['4:5', '9:16', '1:1'].includes(body.aspectRatio)
      ? body.aspectRatio
      : '4:5';
    const fontStyle = ['sans', 'serif', 'mono'].includes(body.fontStyle)
      ? body.fontStyle
      : 'sans';
    const bgColor = typeof body.bgColor === 'string' && /^#[0-9a-fA-F]{3,6}$/.test(body.bgColor)
      ? body.bgColor
      : '#0a0a0a';
    const textColor =
      typeof body.textColor === 'string' && /^#[0-9a-fA-F]{3,6}$/.test(body.textColor)
        ? body.textColor
        : null;
    const showLabels = body.showLabels !== false;
    const latitude = typeof body.latitude === 'number' ? body.latitude : null;
    const longitude = typeof body.longitude === 'number' ? body.longitude : null;
    const remixFromId =
      typeof body.remixFromId === 'string' ? body.remixFromId.trim() : null;

    if (remixFromId) {
      await prisma.post
        .update({
          where: { id: remixFromId },
          data: { remixCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    const created = await prisma.post.create({
      data: {
        userId: currentUser.id,
        title,
        caption,
        city,
        country,
        countryCode,
        locationText,
        latitude,
        longitude,
        aspectRatio,
        bgColor,
        textColor,
        fontStyle,
        showLabels,
        items: { create: items },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        items: true,
        likes: { where: { userId: currentUser.id }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json(
      { post: serializePost(created, currentUser.id) },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to publish story.' },
      { status: 500 },
    );
  }
}
