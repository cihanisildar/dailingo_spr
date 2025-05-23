import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { wordId, isCorrect, timeSpent, isPublicCard } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (isPublicCard) {
      // Update progress for public card
      const updatedProgress = await prisma.cardProgress.upsert({
        where: {
          userId_originalCardId: {
            userId: user.id,
            originalCardId: wordId
          }
        },
        create: {
          userId: user.id,
          originalCardId: wordId,
          viewCount: 1,
          successCount: isCorrect ? 1 : 0,
          failureCount: !isCorrect ? 1 : 0,
          lastReviewed: new Date()
        },
        update: {
          viewCount: { increment: 1 },
          successCount: isCorrect ? { increment: 1 } : undefined,
          failureCount: !isCorrect ? { increment: 1 } : undefined,
          lastReviewed: new Date()
        }
      });

      // Update user's streak
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastTestDate: new Date()
        }
      });

      return NextResponse.json(updatedProgress);
    }

    // Verify card ownership for non-public cards
    const card = await prisma.card.findFirst({
      where: {
        id: wordId,
        userId: user.id
      }
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Update card statistics
    const updatedCard = await prisma.card.update({
      where: { id: wordId },
      data: {
        viewCount: { increment: 1 },
        successCount: isCorrect ? { increment: 1 } : undefined,
        failureCount: !isCorrect ? { increment: 1 } : undefined,
        lastReviewed: new Date()
      }
    });

    // Update user's streak
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastTestDate: new Date()
      }
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Error submitting word result:', error);
    return NextResponse.json(
      { error: 'Failed to submit word result' },
      { status: 500 }
    );
  }
} 