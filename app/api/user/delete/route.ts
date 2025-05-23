import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function DELETE() {
  try {
    const userEmail = await getCurrentUser();
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all user data
    await prisma.user.delete({
      where: { id: user.id }
    });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 