import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: 'Please sign in to like posts.' },
      { status: 401 },
    );
  }

  const existing = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId: currentUser.id,
        postId: id,
      },
    },
  });

  let liked = false;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { userId: currentUser.id, postId: id },
    });
    liked = true;
  }

  const likeCount = await prisma.like.count({ where: { postId: id } });
  return NextResponse.json({ liked, likeCount });
}
