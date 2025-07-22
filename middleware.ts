import { NextRequest, NextResponse } from 'next/server';

// Middleware function to redirect '/' to '/dashboard'
export function middleware(request: NextRequest) {
  // If the request is exactly for the root URL
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  // For all other paths, continue as normal
  return NextResponse.next();
}
