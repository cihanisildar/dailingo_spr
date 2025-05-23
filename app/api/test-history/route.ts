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

    // Get all test sessions for the user
    const testSessions = await prisma.testSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          include: {
            card: {
              select: {
                word: true,
                definition: true
              }
            }
          }
        }
      }
    });

    // Transform the data to match our interface
    const formattedSessions = testSessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      totalQuestions: session.results.length,
      correctAnswers: session.results.filter(r => r.isCorrect).length,
      incorrectAnswers: session.results.filter(r => !r.isCorrect).length,
      averageTime: Math.round(
        session.results.reduce((acc, r) => acc + r.timeSpent, 0) / session.results.length
      ),
      results: session.results.map(result => ({
        word: result.card.word,
        definition: result.card.definition,
        isCorrect: result.isCorrect,
        timeSpent: result.timeSpent
      }))
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching test history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test history' },
      { status: 500 }
    );
  }
} 