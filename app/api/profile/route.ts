import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);

    const user = await User.findById(session._id).select('-password');
    if (!user) {
      return unauthorizedError('User not found');
    }

    const profileData = {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
    };

    return successResponse(profileData, 'Profile retrieved successfully');
  } catch (error: any) {
    console.error('Get profile error:', error);
    return errorResponse(error.message || 'Failed to get profile', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);
    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !email || !phone) {
      return errorResponse('Name, email, and phone are required', 400);
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = await User.findByIdAndUpdate(
      session._id,
      {
        firstName,
        lastName,
        email,
        phone,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return unauthorizedError('User not found');
    }

    const profileData = {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
    };

    return successResponse(profileData, 'Profile updated successfully');
  } catch (error: any) {
    console.error('Update profile error:', error);
    return errorResponse(error.message || 'Failed to update profile', 500);
  }
}
