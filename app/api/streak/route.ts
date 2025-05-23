import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const userEmail = await getCurrentUser();
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastReviewDate: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching streak:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const userEmail = await getCurrentUser();
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const lastReview = user.lastReviewDate;
    let { currentStreak, longestStreak } = user;

    // Check if this is the first review or if the streak is broken
    if (!lastReview || daysBetween(lastReview, now) > 1) {
      currentStreak = 1;
    } else if (daysBetween(lastReview, now) === 1) {
      // Increment streak if review is on consecutive day
      currentStreak += 1;
    }
    // If review is on the same day, keep current streak

    // Update longest streak if current streak is longer
    longestStreak = Math.max(currentStreak, longestStreak);

    // Update user streak data
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        currentStreak,
        longestStreak,
        lastReviewDate: now,
        streakUpdatedAt: now
      },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastReviewDate: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    );
  }
}

// Helper function to calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
} 