import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { startOfDay } from 'date-fns';

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { cardId } = body;

    console.log('Adding card to review:', { cardId, userEmail });

    // Verify user owns the card
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { 
        user: { 
          select: { 
            email: true
          }
        }
      }
    });

    console.log('Found card:', card);

    if (!card || card.user.email !== userEmail) {
      console.log('Card not found or user mismatch:', { 
        cardExists: !!card, 
        cardUserEmail: card?.user?.email, 
        requestUserEmail: userEmail 
      });
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Set the next review to the start of today
    const now = startOfDay(new Date());
    console.log('Setting review date to:', now);
    
    // Update the card to be reviewed today
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        nextReview: now,
        reviewStatus: 'ACTIVE',
        reviewStep: 0, // Reset review step to start fresh
        // Reset review dates to ensure it shows up in today's review
        lastReviewed: null,
        // Clear any reviews from today to allow reviewing again
        reviews: {
          deleteMany: {
            createdAt: {
              gte: now,
              lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // end of today
            }
          }
        }
      }
    });

    console.log('Updated card:', updatedCard);

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Error adding to review:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to add to review' },
      { status: 500 }
    );
  }
} 