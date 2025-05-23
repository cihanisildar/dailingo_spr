import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  return session.user;
}

export async function getCurrentUser(): Promise<string> {
  const user = await getAuthenticatedUser();
  if (!user.email) {
    throw new Error('User email not found');
  }
  return user.email;
} 