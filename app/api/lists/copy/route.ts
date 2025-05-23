import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const { sourceListId } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the source list with its cards
    const sourceList = await prisma.wordList.findFirst({
      where: {
        id: sourceListId,
        isPublic: true, // Ensure we can only copy public lists
      },
      include: {
        cards: {
          include: {
            wordDetails: true
          }
        }
      }
    });

    if (!sourceList) {
      return NextResponse.json({ error: 'Source list not found or not public' }, { status: 404 });
    }

    // Check if user has already copied this list
    const existingCopy = await prisma.wordList.findFirst({
      where: {
        userId: user.id,
        name: {
          startsWith: `${sourceList.name} (Copy`
        }
      }
    });

    if (existingCopy) {
      return NextResponse.json(
        { error: 'You have already copied this list' },
        { status: 400 }
      );
    }

    // Create new list with copied data
    const newList = await prisma.wordList.create({
      data: {
        name: `${sourceList.name} (Copy)`,
        description: sourceList.description,
        isPublic: false, // Make the copy private by default
        userId: user.id,
        cards: {
          create: sourceList.cards.map(card => ({
            word: card.word,
            definition: card.definition,
            userId: user.id,
            wordDetails: card.wordDetails ? {
              create: {
                synonyms: card.wordDetails.synonyms,
                antonyms: card.wordDetails.antonyms,
                examples: card.wordDetails.examples,
                notes: card.wordDetails.notes
              }
            } : undefined
          }))
        }
      }
    });

    return NextResponse.json(newList);
  } catch (error) {
    console.error('Error copying list:', error);
    return NextResponse.json(
      { error: 'Failed to copy list' },
      { status: 500 }
    );
  }
} 