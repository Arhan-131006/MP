import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  conversationId: string;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  message: string;
  attachments: string[];
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    attachments: [String],
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Create compound index for conversation queries
ChatSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
