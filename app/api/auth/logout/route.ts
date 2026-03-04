import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const response = successResponse(null, 'Logout successful', 200);

    // Clear session cookie
    response.cookies.set('auth_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
