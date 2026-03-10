import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check if user is authenticated and is a builder or vendor
    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return unauthorizedError();
    }

    if (session.role !== 'builder' && session.role !== 'vendor' && session.role !== 'admin' && session.role !== 'worker') {
      return errorResponse('Access denied', 403);
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'vendor' or 'worker' or both

    const query: any = {
      role: role ? role : { $in: ['vendor', 'worker'] },
      verified: true,
      blocked: false,
    };

    const users = await User.find(query)
      .select('firstName lastName email phone role companyName industry')
      .sort({ createdAt: -1 });

    return successResponse({ users });
  } catch (error: any) {
    console.error('Error fetching vendors/workers:', error);
    return errorResponse('Failed to fetch users', 500);
  }
}