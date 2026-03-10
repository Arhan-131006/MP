import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError, notFoundError, validationError } from '@/lib/api-response';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);

    // Only admins can update payments
    if (session.role !== 'admin') {
      return unauthorizedError('Only admins can update payments');
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    const errors: Record<string, string> = {};

    if (!status || !['pending', 'processing', 'completed', 'failed', 'refunded'].includes(status)) {
      errors.status = 'Valid status is required (pending, processing, completed, failed, refunded)';
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return notFoundError('Payment not found');
    }

    payment.status = status;
    await payment.save();

    const populatedPayment = await payment.populate('userId', 'firstName lastName email');

    return successResponse(populatedPayment, 'Payment updated successfully');
  } catch (error: any) {
    console.error('Update payment error:', error);
    return errorResponse(error.message || 'Failed to update payment', 500);
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);

    // Only admins can delete payments
    if (session.role !== 'admin') {
      return unauthorizedError('Only admins can delete payments');
    }

    const { id } = params;

    const payment = await Payment.findByIdAndDelete(id);

    if (!payment) {
      return notFoundError('Payment not found');
    }

    return successResponse(null, 'Payment deleted successfully');
  } catch (error: any) {
    console.error('Delete payment error:', error);
    return errorResponse(error.message || 'Failed to delete payment', 500);
  }
}
