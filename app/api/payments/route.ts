import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError, validationError } from '@/lib/api-response';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import Job from '@/lib/models/Job';
import { v4 as uuidv4 } from 'uuid';

const PLATFORM_COMMISSION = 0.05; // 5%

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;
    const query: any = {};

    // Users see their own payments, admins see all
    if (session.role !== 'admin') {
      query.userId = session._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'firstName lastName email')
        .populate('jobId', 'title budget')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Payment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Calculate summary statistics
    const allPayments = await Payment.find(query);
    const totalEarnings = allPayments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.netAmount, 0);
    const totalPending = allPayments
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.netAmount, 0);
    const totalFailed = allPayments
      .filter((p) => p.status === 'failed')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = allPayments
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amount, 0);

    // Group by status for charting
    const paymentsByStatus = allPayments.reduce((acc: any, payment) => {
      const existing = acc.find((item: any) => item.status === payment.status);
      if (existing) {
        existing.count += 1;
        existing.amount += payment.status === 'completed' ? payment.netAmount : payment.amount;
      } else {
        acc.push({
          status: payment.status,
          count: 1,
          amount: payment.status === 'completed' ? payment.netAmount : payment.amount,
        });
      }
      return acc;
    }, []);

    return successResponse(
      {
        payments,
        pagination: { total, page, limit, totalPages },
        summary: {
          totalEarnings,
          totalPending,
          totalFailed,
          totalRefunded,
        },
        paymentsByStatus,
      },
      'Payments retrieved successfully'
    );
  } catch (error: any) {
    console.error('Get payments error:', error);
    return errorResponse(error.message || 'Failed to fetch payments', 500);
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
    const body = await request.json();
    const { userId, amount, paymentMethod, description } = body;

    const errors: Record<string, string> = {};

    if (!amount || amount <= 0) errors.amount = 'Valid amount is required';
    if (!paymentMethod || !['card', 'paypal', 'upi', 'qr', 'bank-transfer'].includes(paymentMethod)) {
      errors.paymentMethod = 'Valid payment method is required';
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Determine which user to create payment for
    // If userId is provided and user is admin, use it. Otherwise use session user
    let targetUserId = session._id;
    if (userId && session.role === 'admin') {
      targetUserId = userId;
    }

    // Calculate platform fee
    const platformFee = amount * PLATFORM_COMMISSION;
    const netAmount = amount - platformFee;

    // Create payment record
    const payment = await Payment.create({
      userId: targetUserId,
      amount,
      paymentMethod,
      status: 'pending',
      platformFee,
      netAmount,
      transactionId: `TXN-${uuidv4()}`,
      notes: description || '',
    });

    // In production, integrate with actual payment gateway
    // For now, return payment object with pending status
    const populatedPayment = await payment.populate('userId', 'firstName lastName email');

    return successResponse(populatedPayment, 'Payment initiated successfully', 201);
  } catch (error: any) {
    console.error('Create payment error:', error);
    return errorResponse(error.message || 'Failed to create payment', 500);
  }
}
