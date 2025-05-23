import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = await getCurrentUser();
    const listId = params.id;
    const body = await request.json();
    const { cardIds } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify list ownership
    const list = await prisma.wordList.findFirst({
      where: {
        id: listId,
        userId: user.id
      }
    });

    if (!list) {
      return NextResponse.json(
        { error: 'Word list not found or access denied' },
        { status: 404 }
      );
    }

    // Update cards to be part of this list
    const result = await prisma.card.updateMany({
      where: {
        id: { in: cardIds },
        userId: user.id
      },
      data: {
        wordListId: listId
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Error adding cards to list:', error);
    return NextResponse.json(
      { error: 'Failed to add cards to list' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = await getCurrentUser();
    const listId = params.id;
    const body = await request.json();
    const { cardIds } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify list ownership
    const list = await prisma.wordList.findFirst({
      where: {
        id: listId,
        userId: user.id
      }
    });

    if (!list) {
      return NextResponse.json(
        { error: 'Word list not found or access denied' },
        { status: 404 }
      );
    }

    // Remove cards from this list
    const result = await prisma.card.updateMany({
      where: {
        id: { in: cardIds },
        userId: user.id,
        wordListId: listId
      },
      data: {
        wordListId: null
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Error removing cards from list:', error);
    return NextResponse.json(
      { error: 'Failed to remove cards from list' },
      { status: 500 }
    );
  }
} 