import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

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

    // Get all cards for the user
    const cards = await prisma.card.findMany({
      where: {
        userId: user.id,
        AND: [
          { word: { not: "" } },
          { definition: { not: "" } }
        ]
      },
      select: {
        id: true,
        word: true,
        definition: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching all words:', error);
    return NextResponse.json(
      { error: 'Failed to fetch words' },
      { status: 500 }
    );
  }
} 