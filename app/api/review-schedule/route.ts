import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

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

    // Get or create default review schedule
    const schedule = await prisma.reviewSchedule.upsert({
      where: {
        userId: user.id
      },
      update: {},
      create: {
        userId: user.id,
        intervals: [1, 2, 7, 30, 365],
        name: 'Default Schedule',
        description: 'Default spaced repetition schedule',
        isDefault: true
      }
    });

    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching review schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { intervals, name, description } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or update review schedule
    const schedule = await prisma.reviewSchedule.upsert({
      where: {
        userId: user.id
      },
      update: {
        intervals,
        name,
        description,
        isDefault: false
      },
      create: {
        userId: user.id,
        intervals: intervals || [1, 2, 7, 30, 365],
        name: name || 'Custom Schedule',
        description,
        isDefault: false
      }
    });

    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating review schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update review schedule' },
      { status: 500 }
    );
  }
} 