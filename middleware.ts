import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if the route is protected
  // We'll protect all routes under /api except for auth routes
  if (request.nextUrl.pathname.startsWith('/api') && 
      !request.nextUrl.pathname.startsWith('/api/auth')) {
    
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configure which routes to protect
export const config = {
  matcher: [
    '/api/cards/:path*',
    '/api/review-schedule/:path*',
    // Add other protected API routes here
  ]
} 