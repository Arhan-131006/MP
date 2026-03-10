import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import Job from '@/lib/models/Job';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      console.error('Invalid session cookie:', error);
      return unauthorizedError();
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const jobId = searchParams.get('jobId');

    const skip = (page - 1) * limit;
    const query: any = {};

    // filter by specific jobId if passed (used when tracking a single job)
    if (jobId) {
      query._id = new mongoose.Types.ObjectId(jobId);
    }

    // Different roles see different jobs
    if (session.role === 'builder') {
      // Builders see their own jobs
      query.builderId = session._id;
    } else if (session.role === 'vendor') {
      // Vendors see jobs assigned to them
      query.assignedVendors = session._id;
    } else if (session.role === 'worker') {
      // Workers see jobs assigned to them
      query.assignedTo = session._id;
    }
    // Admins see all jobs

    // Filter by status if provided (still applies even when jobId given)
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('Scheduling GET - session:', session);
    console.log('Scheduling GET - query:', query, 'page:', page, 'limit:', limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('builderId', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email phone')
        .populate('assignedVendors', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Job.countDocuments(query),
    ]);

    // Transform jobs to scheduling format
    const schedules = jobs.map((job: any) => ({
      _id: job._id,
      jobId: job._id,
      jobTitle: job.title,
      jobCategory: job.category,
      jobStatus: job.status, // Include job status from database
      worker: job.assignedTo ? {
        _id: job.assignedTo._id,
        name: `${job.assignedTo.firstName} ${job.assignedTo.lastName}`,
        email: job.assignedTo.email,
        phone: job.assignedTo.phone || 'N/A',
      } : null,
      vendor: job.builderId ? {
        _id: job.builderId._id,
        name: `${job.builderId.firstName} ${job.builderId.lastName}`,
        email: job.builderId.email,
      } : null,
      vendors: job.assignedVendors?.map((v: any) => ({
        _id: v._id,
        name: `${v.firstName} ${v.lastName}`,
        email: v.email,
      })) || [],
      startDate: job.createdAt || new Date(),
      endDate: job.deadline,
      status: job.status === 'completed' ? 'completed' : job.status === 'in-progress' ? 'active' : 'pending',
      acceptedAt: job.createdAt,
      budget: job.budget,
      description: job.description,
      location: job.location || 'N/A',
      priority: job.priority,
    }));

    const totalPages = Math.ceil(total / limit);

    return successResponse(
      {
        schedules,
        pagination: { total, page, limit, totalPages },
      },
      'Schedules retrieved successfully'
    );
  } catch (error: any) {
    console.error('Get schedules error:', error);
    return errorResponse(error.message || 'Failed to fetch schedules', 500);
  }
}

// Update schedule status based on job
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const body = await request.json();
    const { status } = body;

    if (!jobId || !status) {
      return errorResponse('Job ID and status are required', 400);
    }

    // Map scheduling status to job status
    const statusMap: Record<string, string> = {
      pending: 'assigned',
      active: 'in-progress',
      completed: 'completed',
      cancelled: 'cancelled',
    };

    const jobStatus = statusMap[status] || status;

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { status: jobStatus },
      { new: true }
    ).populate('builderId', 'firstName lastName email');

    if (!updatedJob) {
      return errorResponse('Job not found', 404);
    }

    return successResponse(updatedJob, 'Schedule updated successfully');
  } catch (error: any) {
    console.error('Update schedule error:', error);
    return errorResponse(error.message || 'Failed to update schedule', 500);
  }
}
