import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { results } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create a new test session with results
    const testSession = await prisma.testSession.create({
      data: {
        userId: user.id,
        results: {
          create: results.map((result: any) => ({
            cardId: result.wordId,
            isCorrect: result.isCorrect,
            timeSpent: result.timeSpent
          }))
        }
      },
      include: {
        results: true
      }
    });

    return NextResponse.json(testSession);
  } catch (error) {
    console.error('Error saving test session:', error);
    return NextResponse.json(
      { error: 'Failed to save test session' },
      { status: 500 }
    );
  }
} 