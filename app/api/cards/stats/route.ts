import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { startOfToday, endOfToday } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userEmail = await getCurrentUser();
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all cards for the user
    const cards = await prisma.card.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        successCount: true,
        failureCount: true,
        reviewStatus: true,
        nextReview: true,
        reviews: {
          where: {
            createdAt: {
              gte: startOfToday(),
              lte: endOfToday(),
            }
          }
        }
      }
    });

    // Calculate statistics
    const totalReviews = cards.reduce((sum, card) => sum + card.successCount + card.failureCount, 0);
    const totalSuccess = cards.reduce((sum, card) => sum + card.successCount, 0);
    const successRate = totalReviews > 0 ? Math.round((totalSuccess / totalReviews) * 100) : 0;

    // Count challenging cards (cards with more failures than successes)
    const challengingCards = cards.filter(card => 
      card.failureCount > card.successCount && card.reviewStatus === 'ACTIVE'
    ).length;

    // Count reviews completed today
    const reviewsToday = cards.reduce((sum, card) => sum + card.reviews.length, 0);

    return NextResponse.json({
      totalCards: cards.length,
      activeCards: cards.filter(card => card.reviewStatus === 'ACTIVE').length,
      completedCards: cards.filter(card => card.reviewStatus === 'COMPLETED').length,
      successRate,
      challengingCards,
      reviewsToday,
      totalReviews,
      totalSuccess,
      totalFailures: totalReviews - totalSuccess
    });
  } catch (error) {
    console.error('Error fetching card stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card stats' },
      { status: 500 }
    );
  }
} 