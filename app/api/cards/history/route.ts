import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '30');

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get date range
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        lastReviewed: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter = {
        lastReviewed: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    // Get review history
    const cards = await prisma.card.findMany({
      where: {
        userId: user.id,
        ...dateFilter,
      },
      select: {
        id: true,
        word: true,
        lastReviewed: true,
        nextReview: true,
        successCount: true,
        failureCount: true,
        reviewStatus: true,
        wordList: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        lastReviewed: 'desc',
      },
    });

    // Calculate statistics
    const totalReviews = cards.reduce((sum, card) => sum + card.successCount + card.failureCount, 0);
    const totalSuccess = cards.reduce((sum, card) => sum + card.successCount, 0);
    const totalFailures = cards.reduce((sum, card) => sum + card.failureCount, 0);
    const averageSuccessRate = totalReviews > 0 
      ? (totalSuccess / totalReviews) * 100 
      : 0;

    // Group reviews by date
    const reviewsByDate = cards.reduce((acc, card) => {
      if (!card.lastReviewed) return acc;
      const date = new Date(card.lastReviewed).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(card);
      return acc;
    }, {} as Record<string, typeof cards>);

    return NextResponse.json({
      cards,
      statistics: {
        totalReviews,
        totalSuccess,
        totalFailures,
        averageSuccessRate,
      },
      reviewsByDate,
    });
  } catch (error) {
    console.error('Error fetching review history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review history' },
      { status: 500 }
    );
  }
} 