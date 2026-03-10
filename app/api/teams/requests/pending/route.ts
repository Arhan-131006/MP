import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    await connectDB();

    // Get pending team join requests
    const requests = await Team.find({
      'members.email': session.email,
      'members.status': 'pending',
    })
      .populate('createdBy.userId', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}
