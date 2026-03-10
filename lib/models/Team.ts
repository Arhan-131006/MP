import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description: string;
  createdBy: {
    userId?: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };
  members: Array<{
    userId?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'pending' | 'inactive';
    joinedAt?: Date;
  }>;
  teamSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  name: String,
  email: String,
  role: {
    type: String,
    default: 'member',
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'pending',
  },
  joinedAt: Date,
}, { _id: false });

const createdBySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  name: String,
  role: String,
}, { _id: false });

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Team description is required'],
      trim: true,
    },
    createdBy: {
      type: createdBySchema,
      required: false,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    teamSize: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
