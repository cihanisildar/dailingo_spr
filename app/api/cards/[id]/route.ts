import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = await getCurrentUser();
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: {
        wordDetails: true,
        wordList: {
          select: {
            name: true,
            id: true,
            isPublic: true,
            userId: true
          }
        },
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Check if user has access to this card
    if (card.user.email !== userEmail && !card.wordList?.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If it's a public card and not owned by the user, get or create user's progress
    let userProgress = null;
    if (card.wordList?.isPublic && card.user.email !== userEmail) {
      userProgress = await prisma.cardProgress.findFirst({
        where: {
          userId: user.id,
          originalCardId: card.id
        }
      });

      if (!userProgress) {
        userProgress = await prisma.cardProgress.create({
          data: {
            userId: user.id,
            originalCardId: card.id,
            viewCount: 0,
            successCount: 0,
            failureCount: 0
          }
        });
      }

      // Return card with user's progress
      return NextResponse.json({
        ...card,
        viewCount: userProgress.viewCount,
        successCount: userProgress.successCount,
        failureCount: userProgress.failureCount,
        lastReviewed: userProgress.lastReviewed,
        isPublicCard: true
      });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { word, definition, wordListId, synonyms, antonyms, examples, notes, reviewStatus } = body;

    // Verify user owns the card
    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true } } }
    });

    if (!card || card.user.email !== userEmail) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Update card and its details
    const updatedCard = await prisma.card.update({
      where: { id: params.id },
      data: {
        word,
        definition,
        wordListId,
        reviewStatus,
        wordDetails: {
          update: {
            synonyms,
            antonyms,
            examples,
            notes
          }
        }
      },
      include: {
        wordDetails: true,
        wordList: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
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

    // Verify user owns the card
    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true } } }
    });

    if (!card || card.user.email !== userEmail) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Delete card (this will cascade delete wordDetails due to our schema)
    await prisma.card.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Card deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
} 