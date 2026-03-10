import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  builderId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  // include both 'cancelled' and the older 'closed' for backwards compatibility
  status: 'open' | 'assigned' | 'in-progress' | 'completed' | 'cancelled' | 'closed';
  assignedTo?: mongoose.Types.ObjectId;
  assignedVendors: mongoose.Types.ObjectId[];
  documents: string[];
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    builderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: 0,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in-progress', 'completed', 'cancelled', 'closed'],
      default: 'open',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedVendors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    documents: [String],
    category: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    location: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
