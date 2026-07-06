import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if HTTPS is required globally
    const requireHttps = process.env.REQUIRE_HTTPS === 'true';

    // If HTTPS is required and the request is HTTP, redirect to HTTPS
    if (
        requireHttps &&
        request.nextUrl.protocol === 'http:' &&
        !request.headers.get('host')?.includes('localhost')
    ) {
        const url = request.nextUrl.clone();
        url.protocol = 'https:';
        return NextResponse.redirect(url, 301);
    }

    return NextResponse.next();
}

export const config = {
    // Run on all routes except API, Next.js internals, static files, and images
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
