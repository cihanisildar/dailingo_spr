import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = await getCurrentUser();
    const { cardIds } = await request.json();

    if (!cardIds || !Array.isArray(cardIds)) {
      return NextResponse.json(
        { error: 'Invalid request: cardIds must be an array' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the list exists and belongs to the user
    const list = await prisma.wordList.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!list) {
      return NextResponse.json(
        { error: 'List not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update all selected cards to remove them from the list
    await prisma.card.updateMany({
      where: {
        id: {
          in: cardIds
        },
        userId: user.id,
        wordListId: params.id
      },
      data: {
        wordListId: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing cards from list:', error);
    return NextResponse.json(
      { error: 'Failed to remove cards from list' },
      { status: 500 }
    );
  }
} 