import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import User from '@/lib/models/User';
import Job from '@/lib/models/Job';
import Payment from '@/lib/models/Payment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authorization
    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.role !== 'admin') {
      return errorResponse('Only admins can access this', 403);
    }

    // Get analytics data
    const [
      totalUsers,
      totalJobs,
      totalPayments,
      totalRevenue,
      usersByRole,
      jobsByStatus,
      paymentsByMethod,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Payment.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Job.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const platformFee = revenue * 0.05;

    const analytics = {
      summary: {
        totalUsers,
        totalJobs,
        totalPayments,
        totalRevenue: revenue,
        platformRevenue: platformFee,
      },
      usersByRole: usersByRole.map((item: any) => ({
        role: item._id,
        count: item.count,
      })),
      jobsByStatus: jobsByStatus.map((item: any) => ({
        status: item._id,
        count: item.count,
      })),
      paymentsByMethod: paymentsByMethod.map((item: any) => ({
        method: item._id,
        count: item.count,
        total: item.total,
      })),
    };

    return successResponse(analytics, 'Analytics retrieved successfully');
  } catch (error: any) {
    console.error('Analytics error:', error);
    return errorResponse(error.message || 'Failed to fetch analytics', 500);
  }
}
