import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError, notFoundError } from '@/lib/api-response';
import Inventory from '@/lib/models/Inventory';
import { Types } from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return unauthorizedError();
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return notFoundError('Inventory item');
    }

    const inventory = await Inventory.findOne({
      _id: id,
      ...(session.role === 'vendor' && { vendorId: session._id }),
    });

    if (!inventory) {
      return notFoundError('Inventory item');
    }

    return successResponse(inventory, 'Inventory item retrieved successfully');
  } catch (error: any) {
    console.error('Get inventory error:', error);
    return errorResponse(error.message || 'Failed to fetch inventory item', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return unauthorizedError();
    }

    if (session.role !== 'vendor' && session.role !== 'admin') {
      return errorResponse('Only vendors and admins can update inventory', 403);
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return notFoundError('Inventory item');
    }

    const inventory = await Inventory.findOne({
      _id: id,
      ...(session.role === 'vendor' && { vendorId: session._id }),
    });

    if (!inventory) {
      return notFoundError('Inventory item');
    }

    const body = await request.json();
    const { materialName, category, quantity, unitPrice, unit, supplier, reorderLevel } = body;

    const updateData: any = {};
    if (materialName) updateData.materialName = materialName;
    if (category) updateData.category = category;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unitPrice !== undefined) updateData.unitPrice = unitPrice;
    if (unit) updateData.unit = unit;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (reorderLevel !== undefined) updateData.reorderLevel = reorderLevel;

    const updatedInventory = await Inventory.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    return successResponse(updatedInventory, 'Inventory item updated successfully');
  } catch (error: any) {
    console.error('Update inventory error:', error);
    return errorResponse(error.message || 'Failed to update inventory item', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return unauthorizedError();
    }

    if (session.role !== 'vendor') {
      return errorResponse('Only vendors can delete inventory', 403);
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return notFoundError('Inventory item');
    }

    const inventory = await Inventory.findOne({
      _id: id,
      vendorId: session._id,
    });

    if (!inventory) {
      return notFoundError('Inventory item');
    }

    await Inventory.findByIdAndDelete(id);

    return successResponse(null, 'Inventory item deleted successfully');
  } catch (error: any) {
    console.error('Delete inventory error:', error);
    return errorResponse(error.message || 'Failed to delete inventory item', 500);
  }
}
