import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const cardId = params.id;

    console.log('[CARD API] Session user:', session?.user?.email);
    console.log('[CARD API] Fetching card:', cardId);

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        wordList: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              }
            }
          }
        },
        wordDetails: true,
      },
    });

    // Add userEmail to wordList for frontend ownership checks
    if (card && card.wordList && card.wordList.user) {
      (card.wordList as any).userEmail = card.wordList.user.email;
    }

    console.log('[CARD API] Card data:', card);

    if (!card) {
      console.log('[CARD API] Card not found:', cardId);
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // If the card has a wordList, use the existing logic
    // If the card has no wordList (uncategorized), check if the session user is the card owner
    let isOwner = false;
    let isPublic = false;
    if (card.wordList) {
      isOwner = session?.user?.email === card.wordList.user?.email;
      isPublic = !!card.wordList.isPublic;
      console.log('[CARD API] Card has wordList. isOwner:', isOwner, 'isPublic:', isPublic);
    } else {
      // For uncategorized cards, fetch userId and compare to session user
      // Need to include userId in the card query
      const cardOwner = await prisma.user.findUnique({
        where: { id: card.userId },
        select: { email: true }
      });
      isOwner = session?.user?.email === cardOwner?.email;
      isPublic = false;
      console.log('[CARD API] Card has NO wordList. cardOwner:', cardOwner, 'isOwner:', isOwner);
    }

    if (!isOwner && !isPublic) {
      console.log('[CARD API] Access denied for user:', session?.user?.email, 'on card:', cardId);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only return full card details to the owner
    if (!isOwner) {
      console.log('[CARD API] Not owner, returning limited card data.');
      return NextResponse.json({
        ...card,
        successCount: 0,
        failureCount: 0,
        viewCount: 0,
        interval: 0,
        reviewStep: 0,
        lastReviewed: null,
        nextReview: null,
        reviewStatus: 'NOT_STARTED',
      });
    }

    console.log('[CARD API] Returning full card data to owner.');
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const cardId = params.id;
    const body = await request.json();

    // First check if the user owns the card
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        wordList: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Verify ownership (safe for uncategorized cards)
    let isOwner = false;
    if (card.wordList) {
      isOwner = card.wordList.user.email === session.user.email;
    } else {
      const cardOwner = await prisma.user.findUnique({
        where: { id: card.userId },
        select: { email: true }
      });
      isOwner = cardOwner?.email === session.user.email;
    }
    if (!session || !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        word: body.word,
        definition: body.definition,
        wordDetails: {
          upsert: {
            create: {
              synonyms: body.synonyms || [],
              antonyms: body.antonyms || [],
              examples: body.examples || [],
              notes: body.notes || '',
            },
            update: {
              synonyms: body.synonyms || [],
              antonyms: body.antonyms || [],
              examples: body.examples || [],
              notes: body.notes || '',
            },
          },
        },
      },
      include: {
        wordDetails: true,
        wordList: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
      },
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const cardId = params.id;

    // First check if the user owns the card
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        wordList: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Verify ownership (safe for uncategorized cards)
    let isOwner = false;
    if (card.wordList) {
      isOwner = card.wordList.user.email === session.user.email;
    } else {
      const cardOwner = await prisma.user.findUnique({
        where: { id: card.userId },
        select: { email: true }
      });
      isOwner = cardOwner?.email === session.user.email;
    }
    if (!session || !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the card's details first
    await prisma.wordDetails.deleteMany({
      where: { cardId },
    });

    // Then delete the card
    await prisma.card.delete({
      where: { id: cardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
} 