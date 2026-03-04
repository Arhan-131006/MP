import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    console.log('Change password request for user:', session._id);

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters', 400);
    }

    // Find user with password field included
    const user = await User.findById(session._id).select('+password');
    if (!user) {
      console.error('User not found:', session._id);
      return unauthorizedError('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      console.warn('Invalid current password for user:', session._id);
      return errorResponse('Current password is incorrect', 400);
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    const updatedUser = await user.save();

    console.log('Password updated successfully for user:', session._id);

    return successResponse(
      { message: 'Password changed successfully, please login again' },
      'Password updated successfully'
    );
  } catch (error: any) {
    console.error('Change password error:', error);
    return errorResponse(error.message || 'Failed to change password', 500);
  }
}
