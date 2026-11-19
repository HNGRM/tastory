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
      { error: 'Please sign in to remix this story.' },
      { status: 401 },
    );
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { remixCount: { increment: 1 } },
    select: { id: true, remixCount: true },
  });

  return NextResponse.json(updated);
}
