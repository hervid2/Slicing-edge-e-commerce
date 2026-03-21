import { NextResponse, type NextRequest } from 'next/server';

export function proxy(_request: NextRequest) {
  // Auth protection is handled at the page/layout level via
  // server-side session checks, not in middleware/proxy.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
