import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userEmail = await getCurrentUser();
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 