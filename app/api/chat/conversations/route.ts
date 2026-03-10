import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError } from '@/lib/api-response';
import Chat from '@/lib/models/Chat';
import User from '@/lib/models/User';
import Job from '@/lib/models/Job';
import { Types } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    const session = JSON.parse(sessionCookie.value);

    // Get all conversations for the user
    // convert to ObjectId once to reuse in pipeline
    const userObjectId = new Types.ObjectId(session._id);

    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$message' },
          lastSender: { $first: '$senderId' },
          lastMessageTime: { $first: '$createdAt' },
          otherUser: {
            $first: {
              $cond: [
                { $eq: ['$senderId', userObjectId] },
                '$receiverId',
                '$senderId',
              ],
            },
          },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userObjectId] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Populate user details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await Chat.findOne({})
          .select('senderId receiverId')
          .populate({
            path: conv.lastSender === session._id ? 'receiverId' : 'senderId',
            select: 'firstName lastName profileImage email',
          });

        return {
          conversationId: conv._id,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount,
          otherUser: otherUser?.[conv.lastSender === session._id ? 'receiverId' : 'senderId'],
        };
      })
    );

    return successResponse(populatedConversations, 'Conversations retrieved successfully');
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return errorResponse(error.message || 'Failed to fetch conversations', 500);
  }
}
