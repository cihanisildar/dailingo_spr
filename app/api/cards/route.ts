import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const wordListId = searchParams.get('wordListId');
    const status = searchParams.get('status');
    const createdAfter = searchParams.get('createdAfter');
    const createdBefore = searchParams.get('createdBefore');

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build where clause based on filters
    const where: Prisma.CardWhereInput = {
      userId: user.id
    };

    if (wordListId) where.wordListId = wordListId;
    if (status) where.reviewStatus = status as any; // We know this matches our enum
    if (createdAfter) where.createdAt = { gte: new Date(createdAfter) };
    if (createdBefore) where.createdAt = { ...where.createdAt as any, lte: new Date(createdBefore) };

    const cards = await prisma.card.findMany({
      where,
      include: {
        wordDetails: true,
        wordList: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(cards);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { word, definition, wordListId, synonyms, antonyms, examples, notes } = body;

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

    // Check if a card with the same name already exists for this user
    const existingCard = await prisma.card.findFirst({
      where: {
        word: word,
        userId: user.id
      }
    });

    if (existingCard) {
      return NextResponse.json(
        { error: 'A card with this word already exists' },
        { status: 400 }
      );
    }

    const card = await prisma.card.create({
      data: {
        word,
        definition,
        userId: user.id,
        wordListId,
        nextReview: new Date(), // Default to now
        wordDetails: {
          create: {
            synonyms: synonyms || [],
            antonyms: antonyms || [],
            examples: examples || [],
            notes: notes || null
          }
        }
      },
      include: {
        wordDetails: true,
        wordList: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });

    return NextResponse.json(card);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Handle Prisma unique constraint violation
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError' && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A card with this word already exists' },
        { status: 400 }
      );
    }

    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
} 