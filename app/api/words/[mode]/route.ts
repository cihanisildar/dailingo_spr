import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: { mode: string } }
) {
  try {
    const userEmail = await getCurrentUser();
    const mode = params.mode;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Build query based on mode
    const where = {
      userId: user.id,
      ...(mode === 'today' ? {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      } : {})
    };

    const cards = await prisma.card.findMany({
      where: {
        ...where,
        AND: [
          { word: { not: "" } },
          { definition: { not: "" } }
        ]
      },
      select: {
        id: true,
        word: true,
        definition: true,
        wordList: {
          select: {
            id: true,
            name: true
          }
        },
        wordDetails: {
          select: {
            synonyms: true,
            antonyms: true,
            examples: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match our Word interface
    const words = cards.map(card => ({
      id: card.id,
      word: card.word,
      definition: card.definition,
      wordList: card.wordList
    }));

    return NextResponse.json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json(
      { error: 'Failed to fetch words' },
      { status: 500 }
    );
  }
} 