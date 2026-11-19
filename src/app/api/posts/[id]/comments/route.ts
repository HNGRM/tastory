import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    })),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: 'Please sign in to leave a comment.' },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const content = String(body.content || '').trim().slice(0, 300);
  if (!content) {
    return NextResponse.json(
      { error: 'Comment cannot be empty.' },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.create({
    data: {
      userId: currentUser.id,
      postId: id,
      content,
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(
    {
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user,
      },
    },
    { status: 201 },
  );
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await context.params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const commentId = request.nextUrl.searchParams.get('commentId');
  if (!commentId) {
    return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.postId !== postId) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }
  if (comment.userId !== currentUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
