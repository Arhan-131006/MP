import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  vendorId: mongoose.Types.ObjectId;
  materialName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unit: string; // e.g., kg, liter, piece, etc.
  supplier?: string;
  reorderLevel: number;
  totalValue: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    materialName: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
      default: 0,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: 0,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      enum: ['kg', 'g', 'liter', 'ml', 'piece', 'box', 'pack', 'meter', 'm2', 'm3', 'hour', 'day', 'month'],
    },
    supplier: {
      type: String,
      trim: true,
      default: '',
    },
    reorderLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Calculate total value before saving
InventorySchema.pre('save', function (next) {
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalValue = this.quantity * this.unitPrice;
    this.lastUpdated = new Date();
  }
  next();
});

export default mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
