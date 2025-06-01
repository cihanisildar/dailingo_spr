import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export async function GET(request: Request) {
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

    console.log('Fetching today\'s cards for user:', {
      userId: user.id,
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString()
    });

    // Get all active cards
    const cards = await prisma.card.findMany({
      where: {
        userId: user.id,
        reviewStatus: 'ACTIVE',
      },
      include: {
        wordDetails: true,
        wordList: {
          select: {
            name: true,
            id: true
          }
        },
        reviews: true // log all reviews for debug
      },
      orderBy: {
        nextReview: 'asc'
      }
    });

    // Cards that have been reviewed today
    const reviewedTodayCards = cards.filter(card =>
      card.reviews.some(review => {
        const created = new Date(review.createdAt);
        return created >= todayStart && created < todayEnd;
      })
    );

    // Only get cards that haven't been reviewed today (pending)
    const pendingCards = cards.filter(card =>
      !card.reviews.some(review => {
        const created = new Date(review.createdAt);
        return created >= todayStart && created < todayEnd;
      })
    );

    // Filter cards that are due today based on their last review date and review step
    const todaysCards = pendingCards.filter(card => {
      // If the card was just added to review (nextReview is today and lastReviewed is null)
      // OR if it's due for review based on the schedule
      const isJustAdded = card.nextReview && 
        startOfDay(new Date(card.nextReview)).getTime() <= todayStart.getTime() && 
        !card.lastReviewed;

      if (isJustAdded) {
        console.log('Card was just added to review:', {
          cardId: card.id,
          word: card.word,
          nextReview: card.nextReview,
          lastReviewed: card.lastReviewed
        });
        return true;
      }

      // If the card has a next review date and it's today or earlier, include it
      if (card.nextReview && startOfDay(new Date(card.nextReview)).getTime() <= todayStart.getTime()) {
        console.log('Card is due for review:', {
          cardId: card.id,
          word: card.word,
          nextReview: card.nextReview,
          lastReviewed: card.lastReviewed
        });
        return true;
      }

      console.log('Card filtered OUT:', {
        cardId: card.id,
        word: card.word,
        nextReview: card.nextReview,
        lastReviewed: card.lastReviewed
      });
      return false;
    });

    // --- Repeat session support ---
    // Parse repeat param
    const { searchParams } = new URL(request.url);
    const repeat = searchParams.get('repeat') === 'true';

    // If repeat, use all due today (pending + reviewed), else only pending
    let cardsToReturn = [];
    if (repeat) {
      // Combine and shuffle
      cardsToReturn = [...todaysCards, ...reviewedTodayCards];
      // Fisher-Yates shuffle
      for (let i = cardsToReturn.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardsToReturn[i], cardsToReturn[j]] = [cardsToReturn[j], cardsToReturn[i]];
      }
    } else {
      cardsToReturn = todaysCards;
    }

    console.log('Filtered today\'s cards:', {
      totalCards: cardsToReturn.length,
      cardIds: cardsToReturn.map(c => c.id),
      cardStatuses: cardsToReturn.map(c => ({
        id: c.id,
        word: c.word,
        reviewStatus: c.reviewStatus,
        nextReview: c.nextReview,
        lastReviewed: c.lastReviewed,
        reviewStep: c.reviewStep
      }))
    });

    // Group cards by their review step instead of interval
    const groupedCards = cardsToReturn.reduce((acc, card) => {
      const reviewStep = card.reviewStep < 0 ? 0 : card.reviewStep;
      if (!acc[reviewStep]) {
        acc[reviewStep] = [];
      }
      acc[reviewStep].push(card);
      return acc;
    }, {} as Record<number, typeof cardsToReturn>);

    // Group reviewed today cards by review step as well
    const groupedReviewedTodayCards = reviewedTodayCards.reduce((acc, card) => {
      const reviewStep = card.reviewStep < 0 ? 0 : card.reviewStep;
      if (!acc[reviewStep]) {
        acc[reviewStep] = [];
      }
      acc[reviewStep].push(card);
      return acc;
    }, {} as Record<number, typeof reviewedTodayCards>);

    return NextResponse.json({
      cards: groupedCards,
      total: cardsToReturn.length,
      reviewedTodayCards: groupedReviewedTodayCards,
      reviewedTodayTotal: reviewedTodayCards.length,
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