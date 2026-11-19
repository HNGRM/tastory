import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sanitizePostItems, serializePost } from '@/lib/postSerializer';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true } },
      items: true,
      likes: currentUser
        ? { where: { userId: currentUser.id }, select: { userId: true } }
        : { where: { userId: '__none__' }, select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }

  return NextResponse.json({ post: serializePost(post, currentUser?.id || null) });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }
  if (existing.userId !== currentUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const items = sanitizePostItems(body.items);
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Archive must contain at least one item.' },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.archiveItem.deleteMany({ where: { postId: id } });
      return tx.post.update({
        where: { id },
        data: {
          title: String(body.title || existing.title).trim().slice(0, 80) || existing.title,
          caption:
            body.caption !== undefined
              ? body.caption
                ? String(body.caption).trim().slice(0, 280)
                : null
              : existing.caption,
          city: body.city ? String(body.city).trim().slice(0, 60) : existing.city,
          country: body.country ? String(body.country).trim().slice(0, 60) : existing.country,
          countryCode: body.countryCode !== undefined ? String(body.countryCode).trim().slice(0, 4).toUpperCase() : existing.countryCode,
          locationText: body.locationText ? String(body.locationText).trim().slice(0, 80) : existing.locationText,
          latitude: typeof body.latitude === 'number' ? body.latitude : existing.latitude,
          longitude: typeof body.longitude === 'number' ? body.longitude : existing.longitude,
          aspectRatio: ['4:5', '9:16', '1:1'].includes(body.aspectRatio)
            ? body.aspectRatio
            : existing.aspectRatio,
          fontStyle: ['sans', 'serif', 'mono'].includes(body.fontStyle)
            ? body.fontStyle
            : existing.fontStyle,
          bgColor:
            typeof body.bgColor === 'string' && /^#[0-9a-fA-F]{3,6}$/.test(body.bgColor)
              ? body.bgColor
              : existing.bgColor,
          textColor:
            body.textColor === null
              ? null
              : typeof body.textColor === 'string' && /^#[0-9a-fA-F]{3,6}$/.test(body.textColor)
                ? body.textColor
                : existing.textColor,
          showLabels:
            typeof body.showLabels === 'boolean' ? body.showLabels : existing.showLabels,
          items: { create: items },
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          items: true,
          likes: { where: { userId: currentUser.id }, select: { userId: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
    });

    return NextResponse.json({ post: serializePost(updated, currentUser.id) });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ error: 'Failed to update post.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }
  if (existing.userId !== currentUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
