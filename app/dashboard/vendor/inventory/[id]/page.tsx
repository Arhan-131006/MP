'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { VendorLayout } from '@/components/dashboard/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
}

export default function VendorEditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    materialName: '',
    category: '',
    quantity: '',
    unitPrice: '',
    unit: '',
    supplier: '',
    reorderLevel: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventoryItem();
  }, [id]);

  const fetchInventoryItem = async () => {
    try {
      const response = await fetch(`/api/inventory/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load inventory item');
      }

      const item = data.data;
      setFormData({
        materialName: item.materialName,
        category: item.category,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        unit: item.unit,
        supplier: item.supplier,
        reorderLevel: item.reorderLevel.toString(),
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      router.push('/dashboard/vendor/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.materialName || !formData.category || !formData.quantity || !formData.unitPrice || !formData.unit) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        materialName: formData.materialName,
        category: formData.category,
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        unit: formData.unit,
        supplier: formData.supplier,
        reorderLevel: Number(formData.reorderLevel) || 0,
      };

      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update inventory item');
      }

      toast({ title: 'Success', description: 'Inventory item updated successfully' });
      router.push('/dashboard/vendor/inventory');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Material</CardTitle>
            <CardDescription>Update the material details in your inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="materialName">Material Name *</Label>
                <Input
                  id="materialName"
                  name="materialName"
                  value={formData.materialName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(val) => handleSelectChange('unit', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="g">Gram (g)</SelectItem>
                      <SelectItem value="liter">Liter (L)</SelectItem>
                      <SelectItem value="ml">Milliliter (ml)</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                      <SelectItem value="meter">Meter (m)</SelectItem>
                      <SelectItem value="m2">Square Meter (m²)</SelectItem>
                      <SelectItem value="m3">Cubic Meter (m³)</SelectItem>
                      <SelectItem value="hour">Hour</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unitPrice">Unit Price ($) *</Label>
                  <Input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  name="reorderLevel"
                  type="number"
                  step="0.01"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving} className="px-8">
                  {saving ? 'Updating...' : 'Update Material'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
