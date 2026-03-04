import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authorization (simplified - implement proper session check)
    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.role !== 'admin') {
      return errorResponse('Only admins can access this', 403, 'Forbidden');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const verified = searchParams.get('verified');

    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (verified === 'true') {
      query.verified = true;
    } else if (verified === 'false') {
      query.verified = false;
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return successResponse(
      {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      'Users retrieved successfully'
    );
  } catch (error: any) {
    console.error('Get users error:', error);
    return errorResponse(error.message || 'Failed to fetch users', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authorization
    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.role !== 'admin') {
      return errorResponse('Only admins can perform this action', 403);
    }

    const body = await request.json();
    const { userId, action, data } = body;

    if (!userId || !action) {
      return errorResponse('Missing required fields', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    let updateData = {};

    switch (action) {
      case 'verify':
        updateData = { verified: true };
        break;
      case 'unverify':
        updateData = { verified: false };
        break;
      case 'block':
        updateData = { blocked: true };
        break;
      case 'unblock':
        updateData = { blocked: false };
        break;
      case 'updateRole':
        if (!data?.role || !['builder', 'vendor', 'worker'].includes(data.role)) {
          return errorResponse('Invalid role', 400);
        }
        updateData = { role: data.role };
        break;
      default:
        return errorResponse('Invalid action', 400);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select(
      '-password'
    );

    return successResponse(updatedUser, `User ${action}ed successfully`);
  } catch (error: any) {
    console.error('Update user error:', error);
    return errorResponse(error.message || 'Failed to update user', 500);
  }
}
