import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReviewStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const listId = params.id;

    const user = await prisma.user.findUnique({
      where: { email: await getCurrentUser() },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const list = await prisma.wordList.findUnique({
      where: {
        id: listId,
        OR: [
          { userId: user.id },
          { isPublic: true }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
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

    // If the list is private and user is not the owner, deny access
    if (!list.isPublic && (!session || list.userId !== session.user.id)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // If viewing someone else's list, remove user-specific data
    if (list.userId !== session?.user?.id) {
      list.cards = list.cards.map(card => ({
        ...card,
        successCount: 0,
        failureCount: 0,
        viewCount: 0,
        interval: 0,
        reviewStep: 0,
        lastReviewed: null,
        nextReview: new Date(),
        reviewStatus: ReviewStatus.PAUSED,
      }));
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
    const body = await request.json();
    const { deleteCards } = body;

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

    // Only delete cards if requested
    if (deleteCards) {
      await prisma.card.deleteMany({
        where: { wordListId: listId }
      });
    } else {
      // Unlink cards from the list
      await prisma.card.updateMany({
        where: { wordListId: listId },
        data: { wordListId: null }
      });
    }

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