import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, validationError } from '@/lib/api-response';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, role } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.email = 'Valid email is required';
    }
    if (!password || password.length === 0) {
      errors.password = 'Password is required';
    }
    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Check if user is blocked
    if (user.blocked) {
      return errorResponse('Your account has been blocked', 403);
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate simple token (in production, use JWT)
    // For now, we'll return user data with session-like info
    // if role provided by client, ensure it matches user's role
    if (role && user.role.toLowerCase() !== role.toLowerCase()) {
      return errorResponse('Incorrect role selected', 401);
    }

    const userData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      industry: user.industry,
      verified: user.verified,
      theme: user.theme,
    };

    // In production, create JWT token and set secure cookie
    const response = successResponse(userData, 'Login successful', 200);

    // Set secure session cookie (simplified - use iron-session in production)
    response.cookies.set('auth_session', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse(error.message || 'Login failed', 500, 'Internal Server Error');
  }
}
