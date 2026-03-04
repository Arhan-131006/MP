import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import Invoice from '@/lib/models/Invoice';
import Job from '@/lib/models/Job';
import User from '@/lib/models/User';

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

    // Users see their own invoices, admins see all
    if (session.role !== 'admin') {
      query.userId = session._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('userId', 'firstName lastName email')
        .populate('jobId', 'title budget')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Invoice.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return successResponse(
      {
        invoices,
        pagination: { total, page, limit, totalPages },
      },
      'Invoices retrieved successfully'
    );
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return errorResponse(error.message || 'Failed to fetch invoices', 500);
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

    // Only admins and builders can create invoices
    if (!['admin', 'builder'].includes(session.role)) {
      return errorResponse('Only admins and builders can create invoices', 403);
    }

    const body = await request.json();
    const { userId, jobId, amount, dueDate, notes } = body;

    if (!userId || !jobId || !amount || !dueDate) {
      return errorResponse('Missing required fields', 400);
    }

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse('Job not found', 404);
    }

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      userId,
      jobId,
      amount,
      dueDate: new Date(dueDate),
      notes: notes || '',
      status: 'sent',
    });

    const populatedInvoice = await invoice.populate('userId jobId');

    return successResponse(populatedInvoice, 'Invoice created successfully', 201);
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return errorResponse(error.message || 'Failed to create invoice', 500);
  }
}
