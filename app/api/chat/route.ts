import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError, validationError } from '@/lib/api-response';
import Chat from '@/lib/models/Chat';
import User from '@/lib/models/User';
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
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) {
      return errorResponse('Conversation ID is required', 400);
    }

    const messages = await Chat.find({ conversationId })
      .populate('senderId', 'firstName lastName profileImage')
      .populate('receiverId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(limit);

    return successResponse(
      {
        conversationId,
        messages: messages.reverse(),
      },
      'Messages retrieved successfully'
    );
  } catch (error: any) {
    console.error('Get messages error:', error);
    return errorResponse(error.message || 'Failed to fetch messages', 500);
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
    const { receiverId, message, jobId, attachments } = body;

    const errors: Record<string, string> = {};

    if (!receiverId || receiverId.trim().length === 0) errors.receiverId = 'Receiver ID is required';
    if (!message || message.trim().length === 0) errors.message = 'Message is required';

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Create conversation ID from sorted user IDs
    const conversationId = [session._id, receiverId].sort().join('-');

    const chat = await Chat.create({
      conversationId,
      senderId: session._id,
      receiverId,
      jobId: jobId || null,
      message,
      attachments: attachments || [],
      read: false,
    });

    const populatedChat = await chat.populate([
      { path: 'senderId', select: 'firstName lastName profileImage' },
      { path: 'receiverId', select: 'firstName lastName profileImage' },
    ]);

    return successResponse(populatedChat, 'Message sent successfully', 201);
  } catch (error: any) {
    console.error('Send message error:', error);
    return errorResponse(error.message || 'Failed to send message', 500);
  }
}
