import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only protect authenticated routes
  if (request.nextUrl.pathname.startsWith('/(authenticated)')) {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to protect
export const config = {
  matcher: [
    '/(authenticated)/:path*',
  ]
} 