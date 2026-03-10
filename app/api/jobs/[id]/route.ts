import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError, notFoundError } from '@/lib/api-response';
import Job from '@/lib/models/Job';
import User from '@/lib/models/User';
import { Types } from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    if (!Types.ObjectId.isValid(id)) {
      return notFoundError('Job');
    }

    const job = await Job.findById(id).populate('builderId', 'firstName lastName email industry');

    if (!job) {
      return notFoundError('Job');
    }

    return successResponse(job, 'Job retrieved successfully');
  } catch (error: any) {
    console.error('Get job error:', error);
    return errorResponse(error.message || 'Failed to fetch job', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);

    if (!Types.ObjectId.isValid(id)) {
      return notFoundError('Job');
    }

    const job = await Job.findById(id);
    if (!job) {
      return notFoundError('Job');
    }

    const body = await request.json();

    // Builders (owner) and admins can update arbitrary fields
    if (session.role === 'builder' || session.role === 'admin') {
      if (session.role === 'builder' && job.builderId.toString() !== session._id) {
        return errorResponse('You can only update your own jobs', 403);
      }

      const { title, description, budget, deadline, status, priority } = body;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (budget !== undefined) updateData.budget = budget;
      if (deadline) updateData.deadline = new Date(deadline);
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;

      // runValidators ensures status values (and other enums) are checked
      const updatedJob = await Job.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(
        'builderId',
        'firstName lastName email'
      );

      return successResponse(updatedJob, 'Job updated successfully');
    }

    // Vendors/Workers: allow accept/reject actions
    if (session.role === 'vendor' || session.role === 'worker') {
      const { action } = body;
      if (!action) {
        return errorResponse('Action required', 400);
      }

      if (action === 'accept') {
        // add vendor/worker to assignedVendors (if not present) and set status to 'assigned'
        const already = job.assignedVendors.map(String).includes(session._id);
        if (!already) {
          job.assignedVendors.push(session._id);
        }
        job.status = 'assigned';
        await job.save();
        const updated = await Job.findById(id).populate('builderId', 'firstName lastName email');
        return successResponse(updated, 'Job accepted');
      }

      if (action === 'reject') {
        job.assignedVendors = job.assignedVendors.filter((v: any) => v.toString() !== session._id);
        await job.save();
        const updated = await Job.findById(id).populate('builderId', 'firstName lastName email');
        return successResponse(updated, 'Job rejected');
      }

      return errorResponse('Invalid action', 400);
    }

    return errorResponse('Unauthorized to update job', 403);
  } catch (error: any) {
    console.error('Update job error:', error);
    return errorResponse(error.message || 'Failed to update job', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);

    if (!Types.ObjectId.isValid(id)) {
      return notFoundError('Job');
    }

    const job = await Job.findById(id);
    if (!job) {
      return notFoundError('Job');
    }

    // Only builder who created it or admin can delete
    if (session.role === 'builder' && job.builderId.toString() !== session._id) {
      return errorResponse('You can only delete your own jobs', 403);
    }

    await Job.findByIdAndDelete(id);

    return successResponse(null, 'Job deleted successfully');
  } catch (error: any) {
    console.error('Delete job error:', error);
    return errorResponse(error.message || 'Failed to delete job', 500);
  }
}
