import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, validationError } from '@/lib/api-response';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, firstName, lastName, phone, role, industry, companyName } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.email = 'Valid email is required';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!firstName || firstName.trim().length === 0) {
      errors.firstName = 'First name is required';
    }
    if (!lastName || lastName.trim().length === 0) {
      errors.lastName = 'Last name is required';
    }
    if (!phone || phone.trim().length === 0) {
      errors.phone = 'Phone number is required';
    }
    if (!role || !['admin', 'builder', 'vendor', 'worker'].includes(role)) {
      errors.role = 'Valid role is required';
    }
    if (!industry || industry.trim().length === 0) {
      errors.industry = 'Industry is required';
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse('Email already registered', 409);
    }

    // Create new user
    const newUser = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      role,
      industry,
      companyName: companyName || '',
      verified: false,
      blocked: false,
      theme: 'light',
    });

    // Return user data (without password)
    const userData = {
      _id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      industry: newUser.industry,
    };

    return successResponse(userData, 'User registered successfully', 201);
  } catch (error: any) {
    console.error('Registration error:', error);
    return errorResponse(error.message || 'Registration failed', 500, 'Internal Server Error');
  }
}
