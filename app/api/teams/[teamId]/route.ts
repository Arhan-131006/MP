import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Team from '@/lib/models/Team';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { teamId } = await params;
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID not provided' }, { status: 400 });
    }

    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // only allow creator or admin to delete
    const allowed =
      session.role === 'admin' ||
      (team.createdBy && team.createdBy.userId && team.createdBy.userId.toString() === session._id);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Team.findByIdAndDelete(teamId);

    return NextResponse.json({ success: true, message: 'Team deleted' });
  } catch (error: any) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete team' },
      { status: 500 }
    );
  }
}
