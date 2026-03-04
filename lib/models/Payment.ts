import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'paypal' | 'upi' | 'qr' | 'bank-transfer';
  transactionId?: string;
  invoiceId?: mongoose.Types.ObjectId;
  platformFee: number;
  netAmount: number;
  paymentDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'upi', 'qr', 'bank-transfer'],
      required: true,
    },
    transactionId: {
      type: String,
      default: '',
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Calculate net amount based on platform fee
PaymentSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('platformFee')) {
    this.netAmount = this.amount - this.platformFee;
  }
  next();
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
