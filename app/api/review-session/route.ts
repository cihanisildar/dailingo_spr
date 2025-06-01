import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// Create a new review session
export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { mode, isRepeat, cards } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const session = await prisma.reviewSession.create({
      data: {
        userId: user.id,
        mode,
        isRepeat: !!isRepeat,
        cards,
      },
    });
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating review session:', error);
    return NextResponse.json({ error: 'Failed to create review session' }, { status: 500 });
  }
}

// Complete a review session (PATCH)
export async function PATCH(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { sessionId } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const session = await prisma.reviewSession.update({
      where: { id: sessionId, userId: user.id },
      data: { completedAt: new Date() },
    });
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error completing review session:', error);
    return NextResponse.json({ error: 'Failed to complete review session' }, { status: 500 });
  }
}

// List review sessions for the current user
export async function GET(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sessions = await prisma.reviewSession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching review sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch review sessions' }, { status: 500 });
  }
} 