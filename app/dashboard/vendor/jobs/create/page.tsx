'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VendorLayout } from '@/components/dashboard/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function VendorCreateJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: '',
    deadline: '',
    priority: 'medium',
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.budget || !formData.category || !formData.deadline) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        category: formData.category,
        deadline: formData.deadline,
        priority: formData.priority,
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job request');
      }

      toast({ title: 'Success', description: 'Job request created successfully' });
      router.push('/dashboard/vendor/jobs');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <VendorLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Job Request</CardTitle>
            <CardDescription>Create a new job request to assign to workers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Website Design, Mobile Development"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Design, Development, Marketing"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget ($) *</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(val) => handleSelectChange('priority', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the job requirements, scope, and expectations..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="px-8">
                  {saving ? 'Creating...' : 'Create Job Request'}
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
