import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { cardId, isSuccess } = body;

    // Verify user owns the card and get their review schedule
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { 
        user: { 
          select: { 
            email: true,
            reviewSchedule: true
          }
        },
        wordDetails: true
      }
    });

    if (!card || card.user.email !== userEmail) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Get the review schedule intervals
    const intervals = card.user.reviewSchedule?.intervals || [1, 7, 30, 365];
    
    // Find the next interval based on the current reviewStep
    let nextInterval = intervals[card.reviewStep];
    let newReviewStep = card.reviewStep;
    
    // If successful, move to next interval. If failed, stay at current interval
    if (isSuccess && newReviewStep < intervals.length - 1) {
      newReviewStep++;
      nextInterval = intervals[newReviewStep];
    }

    // Update review statistics
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + nextInterval);

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        lastReviewed: now,
        nextReview,
        reviewStep: newReviewStep,
        viewCount: { increment: 1 },
        successCount: isSuccess ? { increment: 1 } : undefined,
        failureCount: !isSuccess ? { increment: 1 } : undefined,
        // Mark as completed if we've reached the final interval and succeeded
        reviewStatus: isSuccess && newReviewStep === intervals.length - 1 ? 'COMPLETED' : undefined,
        // Create a review record
        reviews: {
          create: {
            isSuccess
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
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
} 