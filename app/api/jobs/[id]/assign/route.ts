import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import Job from '@/lib/models/Job';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return unauthorizedError();
    }

    if (session.role !== 'builder' && session.role !== 'vendor' && session.role !== 'admin') {
      return errorResponse('Only builders, vendors, and admins can assign jobs', 403);
    }

    const { userId } = await request.json();
    const { id } = await params;

    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    // Verify the job exists and user has access
    let jobQuery: any = { _id: new mongoose.Types.ObjectId(id) };
    if (session.role === 'builder') {
      jobQuery.builderId = new mongoose.Types.ObjectId(session._id);
    } else if (session.role === 'vendor') {
      jobQuery.assignedVendors = new mongoose.Types.ObjectId(session._id);
    }
    // Admins can access any job

    const job = await Job.findOne(jobQuery);

    if (!job) {
      return errorResponse('Job not found or access denied', 404);
    }

    // Verify the user exists and is a vendor or worker
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findOne({
      _id: userObjectId,
      role: { $in: ['vendor', 'worker'] },
      verified: true,
      blocked: false
    });

    if (!user) {
      return errorResponse('User not found or not eligible for assignment', 404);
    }

    // Check if already assigned
    if (job.assignedVendors.some((id: any) => id.toString() === userId)) {
      return errorResponse('User is already assigned to this job', 400);
    }

    // Assign the user
    job.assignedVendors.push(userObjectId);
    if (job.status === 'open') {
      job.status = 'assigned';
    }
    await job.save();

    return successResponse({ message: 'Job assigned successfully', job });
  } catch (error: any) {
    console.error('Error assigning job:', error);
    return errorResponse('Failed to assign job', 500);
  }
}