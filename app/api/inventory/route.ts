import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, unauthorizedError, validationError } from '@/lib/api-response';
import Inventory from '@/lib/models/Inventory';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch (error) {
      return unauthorizedError();
    }

    // Only vendors and admins can view inventory
    if (session.role !== 'vendor' && session.role !== 'admin') {
      return errorResponse('Only vendors and admins can access inventory', 403);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (session.role === 'vendor') {
      query.vendorId = session._id;
    }
    // Admins can see all inventory
    if (category) {
      query.category = category;
    }

    const [inventory, total] = await Promise.all([
      Inventory.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Inventory.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);

    return successResponse(
      {
        inventory,
        pagination: { total, page, limit, totalPages },
        totalInventoryValue: totalValue,
      },
      'Inventory retrieved successfully'
    );
  } catch (error: any) {
    console.error('Get inventory error:', error);
    return errorResponse(error.message || 'Failed to fetch inventory', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const sessionCookie = request.cookies.get('auth_session');
    if (!sessionCookie) {
      return unauthorizedError();
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch (error) {
      return unauthorizedError();
    }

    // Only vendors and admins can create inventory items
    if (session.role !== 'vendor' && session.role !== 'admin') {
      return errorResponse('Only vendors and admins can create inventory items', 403);
    }

    const body = await request.json();
    const { materialName, category, quantity, unitPrice, unit, supplier, reorderLevel } = body;

    const errors: Record<string, string> = {};

    if (!materialName || materialName.trim().length === 0) errors.materialName = 'Material name is required';
    if (!category || category.trim().length === 0) errors.category = 'Category is required';
    if (quantity === undefined || quantity < 0) errors.quantity = 'Valid quantity is required';
    if (!unitPrice || unitPrice < 0) errors.unitPrice = 'Valid unit price is required';
    if (!unit || unit.trim().length === 0) errors.unit = 'Unit is required';

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const newInventory = await Inventory.create({
      vendorId: session._id,
      materialName,
      category,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      unit,
      supplier: supplier || '',
      reorderLevel: reorderLevel || 0,
    });

    return successResponse(newInventory, 'Inventory item created successfully', 201);
  } catch (error: any) {
    console.error('Create inventory error:', error);
    return errorResponse(error.message || 'Failed to create inventory item', 500);
  }
}
