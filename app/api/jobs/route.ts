import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError, validationError } from '@/lib/api-response';
import Job from '@/lib/models/Job';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(request.url);
    const builderId = searchParams.get('builderId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;
    const query: any = {};

    // Only builders can see their own jobs, vendors see jobs assigned to them
    if (session.role === 'builder' && builderId) {
      query.builderId = builderId;
    } else if (session.role === 'vendor') {
      query.assignedVendors = session._id;
    } else if (session.role === 'admin') {
      // Admins can see all jobs
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('builderId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Job.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return successResponse(
      {
        jobs,
        pagination: { total, page, limit, totalPages },
      },
      'Jobs retrieved successfully'
    );
  } catch (error: any) {
    console.error('Get jobs error:', error);
    return errorResponse(error.message || 'Failed to fetch jobs', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);

    // Only builders or admins can create jobs
    if (session.role !== 'builder' && session.role !== 'admin') {
      return errorResponse('Only builders or admins can create jobs', 403);
    }

    const body = await request.json();
    const { title, description, budget, deadline, category, priority, location, documents } = body;

    const errors: Record<string, string> = {};

    if (!title || title.trim().length === 0) errors.title = 'Title is required';
    if (!description || description.trim().length === 0) errors.description = 'Description is required';
    if (!budget || budget < 0) errors.budget = 'Valid budget is required';
    if (!deadline) errors.deadline = 'Deadline is required';
    if (!category || category.trim().length === 0) errors.category = 'Category is required';

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const newJob = await Job.create({
      builderId: session._id,
      title,
      description,
      budget,
      deadline: new Date(deadline),
      category,
      priority: priority || 'medium',
      location: location || '',
      documents: documents || [],
      status: 'open',
      assignedVendors: [],
    });

    return successResponse(newJob, 'Job created successfully', 201);
  } catch (error: any) {
    console.error('Create job error:', error);
    return errorResponse(error.message || 'Failed to create job', 500);
  }
}
