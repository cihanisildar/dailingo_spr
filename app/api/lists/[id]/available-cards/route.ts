import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = await getCurrentUser();
    const listId = params.id;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all cards that belong to the user but are not in this list
    const availableCards = await prisma.card.findMany({
      where: {
        userId: user.id,
        OR: [
          { wordListId: null }, // Include cards not in any list
          { wordListId: { not: listId } } // Include cards in other lists
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(availableCards);
  } catch (error) {
    console.error('Error fetching available cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available cards' },
      { status: 500 }
    );
  }
} 