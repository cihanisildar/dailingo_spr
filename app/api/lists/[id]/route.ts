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

    const list = await prisma.wordList.findFirst({
      where: {
        id: listId,
        OR: [
          { userId: user.id },
          { isPublic: true }
        ]
      },
      include: {
        cards: {
          include: {
            wordDetails: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: { cards: true }
        }
      }
    });

    if (!list) {
      return NextResponse.json({ error: 'Word list not found' }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching word list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch word list' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userEmail = await getCurrentUser();
    const listId = params.id;
    const body = await request.json();
    const { name, description, isPublic } = body;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the list belongs to the user
    const existingList = await prisma.wordList.findFirst({
      where: {
        id: listId,
        userId: user.id
      }
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'Word list not found or unauthorized' },
        { status: 404 }
      );
    }

    const updatedList = await prisma.wordList.update({
      where: { id: listId },
      data: {
        name,
        description,
        isPublic,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: { cards: true }
        }
      }
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Error updating word list:', error);
    return NextResponse.json(
      { error: 'Failed to update word list' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if the list belongs to the user
    const existingList = await prisma.wordList.findFirst({
      where: {
        id: listId,
        userId: user.id
      }
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'Word list not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete all cards in the list first
    await prisma.card.deleteMany({
      where: { wordListId: listId }
    });

    // Then delete the list
    await prisma.wordList.delete({
      where: { id: listId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting word list:', error);
    return NextResponse.json(
      { error: 'Failed to delete word list' },
      { status: 500 }
    );
  }
} 