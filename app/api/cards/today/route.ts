import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export async function GET() {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        reviewSchedule: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Get all active cards
    const cards = await prisma.card.findMany({
      where: {
        userId: user.id,
        reviewStatus: 'ACTIVE',
        // Only get cards that haven't been reviewed today
        NOT: {
          reviews: {
            some: {
              createdAt: {
                gte: todayStart,
                lt: todayEnd
              }
            }
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
        },
        reviews: {
          where: {
            createdAt: {
              gte: todayStart
            }
          },
          select: {
            id: true,
            isSuccess: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        nextReview: 'asc'
      }
    });

    // Get the review schedule intervals
    const intervals = user.reviewSchedule?.intervals || [1, 7, 30, 365];

    // Filter cards that are due today based on their last review date and review step
    const todaysCards = cards.filter(card => {
      const baseDate = card.lastReviewed || card.createdAt;
      // If reviewStep is -1 or invalid, treat as new card (step 0)
      const reviewStep = card.reviewStep < 0 ? 0 : card.reviewStep;
      const nextInterval = intervals[reviewStep];
      
      try {
        const nextReviewDate = addDays(new Date(baseDate), nextInterval);
        
        console.log('Card review calculation:', {
          cardId: card.id,
          word: card.word,
          baseDate: baseDate.toISOString(),
          reviewStep: reviewStep,
          nextInterval,
          nextReviewDate: nextReviewDate.toISOString(),
          isDueToday: nextReviewDate >= todayStart && nextReviewDate < todayEnd
        });

        return nextReviewDate >= todayStart && nextReviewDate < todayEnd;
      } catch (error) {
        console.error('Error calculating review date for card:', card.id, error);
        // If there's an error, include the card for today's review
        return true;
      }
    });

    console.log('Found cards:', {
      totalActive: cards.length,
      dueToday: todaysCards.length,
      dateRange: {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString()
      }
    });

    // Group cards by their review step instead of interval
    const groupedCards = todaysCards.reduce((acc, card) => {
      const reviewStep = card.reviewStep < 0 ? 0 : card.reviewStep;
      if (!acc[reviewStep]) {
        acc[reviewStep] = [];
      }
      acc[reviewStep].push(card);
      return acc;
    }, {} as Record<number, typeof todaysCards>);

    return NextResponse.json({
      cards: groupedCards,
      total: todaysCards.length,
      schedule: user.reviewSchedule
    });

  } catch (error) {
    console.error('Error fetching today\'s cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s cards' },
      { status: 500 }
    );
  }
} 