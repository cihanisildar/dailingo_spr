import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get('includePublic') === 'true';

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build where clause based on whether to include public lists
    const where = includePublic
      ? {
          OR: [
            { userId: user.id },
            { isPublic: true }
          ]
        }
      : { userId: user.id };

    const lists = await prisma.wordList.findMany({
      where,
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching word lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch word lists' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const body = await request.json();
    const { name, description, isPublic } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const list = await prisma.wordList.create({
      data: {
        name,
        description,
        isPublic: isPublic || false,
        userId: user.id
      },
      include: {
        _count: {
          select: { cards: true }
        }
      }
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error creating word list:', error);
    return NextResponse.json(
      { error: 'Failed to create word list' },
      { status: 500 }
    );
  }
} 