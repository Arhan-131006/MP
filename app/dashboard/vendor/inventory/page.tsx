'use client';

import React, { useEffect, useState } from 'react';
import { VendorLayout } from '@/components/dashboard/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface InventoryItem {
  _id: string;
  materialName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  supplier: string;
  reorderLevel: number;
  totalValue: number;
  lastUpdated: string;
}

export default function VendorInventoryPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const categoryParam = categoryFilter !== 'all' ? `&category=${categoryFilter}` : '';
      const response = await fetch(`/api/inventory?limit=100${categoryParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load inventory');
      }

      setInventory(data.data.inventory || []);
      setTotalValue(data.data.totalInventoryValue || 0);

      // Extract unique categories
      const uniqueCategories = [...new Set(data.data.inventory?.map((item: any) => item.category) || [])];
      setCategories(uniqueCategories as string[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/inventory/${deleteId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      toast({ title: 'Success', description: 'Inventory item deleted' });
      setDeleteId(null);
      fetchInventory();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.materialName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter((item) => item.quantity <= item.reorderLevel);

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">Track your materials and supplies</p>
          </div>
          <Link href="/dashboard/vendor/inventory/add">
            <Button>Add Material</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">Low Stock Warning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <p key={item._id} className="text-sm text-orange-800">
                    <strong>{item.materialName}</strong> - {item.quantity} {item.unit} (reorder at {item.reorderLevel})
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-64"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List */}
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Loading inventory...
            </CardContent>
          </Card>
        ) : filteredInventory.length > 0 ? (
          <div className="space-y-4">
            {filteredInventory.map((item) => (
              <Card key={item._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.materialName}</h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {item.category}
                        </span>
                        {item.quantity <= item.reorderLevel && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Supplier: {item.supplier || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{item.quantity} {item.unit}</p>
                      <p className="text-sm text-muted-foreground">@ ${item.unitPrice.toFixed(2)}/{item.unit}</p>
                      <p className="font-semibold text-base mt-2">${item.totalValue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Last updated: {new Date(item.lastUpdated).toLocaleDateString()}</p>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/dashboard/vendor/inventory/${item._id}`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(item._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No inventory items found. Add materials to get started!
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </VendorLayout>
  );
}
