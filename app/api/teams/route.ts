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

    const teams = await Team.find()
      .populate('createdBy.userId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      data: teams,
    });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, membersList } = body;

    if (!name || !description || !membersList || membersList.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, and membersList' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create team with members
    const newTeam = new Team({
      name: name.trim(),
      description: description.trim(),
      createdBy: {
        userId: session._id || session.userId || null,
        name: session.firstName ? `${session.firstName} ${session.lastName || ''}`.trim() : 'Admin',
        role: session.role || 'admin',
      },
      members: membersList.map((member: string) => ({
        email: member.trim(),
        name: member.trim(),
        role: 'member',
        status: 'pending',
      })),
      teamSize: membersList.length,
    });

    const savedTeam = await newTeam.save();
    const populatedTeam = await savedTeam.populate('createdBy.userId members.userId');

    return NextResponse.json({
      success: true,
      data: populatedTeam,
      message: 'Team created successfully',
    });
  } catch (error: any) {
    console.error('Full error details:', JSON.stringify(error, null, 2));
    const errorMessage = error.errors 
      ? Object.values(error.errors).map((e: any) => e.message).join(', ')
      : error.message || 'Failed to create team';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
