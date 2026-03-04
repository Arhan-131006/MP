import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    _id: string;
    email: string;
    role: 'admin' | 'builder' | 'vendor' | 'worker';
    firstName: string;
    lastName: string;
  };
}

export function withAuth(handler: Function, allowedRoles?: string[]) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Get session from cookie (simplified - use JWT in production)
      const sessionCookie = request.cookies.get('auth_session');

      if (!sessionCookie) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
            error: 'No session found',
            statusCode: 401,
          },
          { status: 401 }
        );
      }

      const user = JSON.parse(sessionCookie.value);

      // Check role if specified
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Forbidden',
            error: 'Insufficient permissions',
            statusCode: 403,
          },
          { status: 403 }
        );
      }

      // Add user to request
      (request as any).user = user;

      return handler(request, context);
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication error',
          error: error.message,
          statusCode: 401,
        },
        { status: 401 }
      );
    }
  };
}

// Middleware to protect API routes
export function middleware(request: NextRequest) {
  const publicPaths = ['/api/auth/login', '/api/auth/register'];
  const pathname = request.nextUrl.pathname;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Require auth for protected paths
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required',
          statusCode: 401,
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
