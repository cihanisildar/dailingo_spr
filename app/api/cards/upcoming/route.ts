import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { addDays, format, isValid } from 'date-fns';

export async function GET(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7'); // Default to next 7 days

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { 
        id: true,
        reviewSchedule: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(startOfToday);
    endDate.setDate(endDate.getDate() + days);

    // Get all active cards
    const cards = await prisma.card.findMany({
      where: {
        userId: user.id,
        reviewStatus: 'ACTIVE',
      },
      select: {
        id: true,
        word: true,
        definition: true,
        createdAt: true,
        lastReviewed: true,
        nextReview: true,
        reviewStep: true,
        reviewStatus: true,
        failureCount: true,
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
              gte: startOfToday
            }
          },
          select: {
            id: true,
            isSuccess: true,
            createdAt: true
          }
        }
      }
    });

    console.log('Found active cards:', cards.length);

    // Get the review schedule intervals
    const intervals = user.reviewSchedule?.intervals || [1, 7, 30, 365];
    console.log('Review schedule intervals:', intervals);

    // Group cards by their review dates
    const groupedCards = cards.reduce((acc, card) => {
      // First add the next immediate review based on current step
      const baseDate = card.lastReviewed || card.createdAt;
      console.log('Processing card:', card.id, 'baseDate:', baseDate, 'reviewStep:', card.reviewStep);
      
      if (!isValid(new Date(baseDate))) {
        console.log('Invalid baseDate for card:', card.id, baseDate);
        return acc;
      }

      // Validate reviewStep and get current interval
      const currentInterval = card.reviewStep >= 0 && card.reviewStep < intervals.length 
        ? intervals[card.reviewStep] 
        : intervals[0]; // Default to first interval if reviewStep is invalid
      
      console.log('Current interval for card:', card.id, 'interval:', currentInterval);
      
      const immediateNextReview = addDays(new Date(baseDate), currentInterval);
      
      if (!isValid(immediateNextReview)) {
        console.log('Invalid immediateNextReview for card:', card.id, immediateNextReview);
        return acc;
      }

      const immediateNextReviewStr = format(immediateNextReview, 'yyyy-MM-dd');
      
      // Add immediate next review if it's within range
      if (immediateNextReview >= startOfToday && immediateNextReview < endDate) {
        if (!acc[immediateNextReviewStr]) {
          acc[immediateNextReviewStr] = {
            total: 0,
            reviewed: 0,
            notReviewed: 0,
            fromFailure: 0,
            cards: []
          };
        }

        const hasBeenReviewed = card.reviews.some(review => {
          const reviewDate = new Date(review.createdAt);
          if (!isValid(reviewDate)) {
            console.log('Invalid reviewDate for card:', card.id, review.createdAt);
            return false;
          }
          return format(reviewDate, 'yyyy-MM-dd') === immediateNextReviewStr;
        });

        acc[immediateNextReviewStr].cards.push({
          ...card,
          reviewStep: card.reviewStep,
          isFromFailure: card.failureCount > 0
        });
        acc[immediateNextReviewStr].total++;
        
        if (hasBeenReviewed) {
          acc[immediateNextReviewStr].reviewed++;
        } else {
          acc[immediateNextReviewStr].notReviewed++;
          if (card.failureCount > 0) {
            acc[immediateNextReviewStr].fromFailure++;
          }
        }
      }

      // Then add future potential reviews (shown differently in UI)
      intervals.forEach((interval, step) => {
        if (step > card.reviewStep) {  // Only future steps
          const futureReviewDate = addDays(new Date(baseDate), interval);
          
          if (!isValid(futureReviewDate)) {
            console.log('Invalid futureReviewDate for card:', card.id, futureReviewDate);
            return;
          }

          const futureDateStr = format(futureReviewDate, 'yyyy-MM-dd');
          
          if (futureReviewDate >= startOfToday && futureReviewDate < endDate) {
            if (!acc[futureDateStr]) {
              acc[futureDateStr] = {
                total: 0,
                reviewed: 0,
                notReviewed: 0,
                fromFailure: 0,
                cards: []
              };
            }

            acc[futureDateStr].cards.push({
              ...card,
              reviewStep: step,
              isFromFailure: false,
              isFutureReview: true  // Mark as future review
            });
            acc[futureDateStr].total++;
            acc[futureDateStr].notReviewed++;
          }
        }
      });
      
      return acc;
    }, {} as Record<string, {
      total: number;
      reviewed: number;
      notReviewed: number;
      fromFailure: number;
      cards: (typeof cards[0] & { isFromFailure: boolean; reviewStep: number; isFutureReview?: boolean })[];
    }>);

    return NextResponse.json({
      cards: groupedCards,
      total: Object.values(groupedCards).reduce((sum, group) => sum + group.total, 0),
      intervals
    });
  } catch (error) {
    console.error('Error fetching upcoming reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming reviews' },
      { status: 500 }
    );
  }
} 