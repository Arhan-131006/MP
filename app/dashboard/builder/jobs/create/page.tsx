'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BuilderLayout } from '@/components/dashboard/BuilderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function BuilderCreateJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: '',
    deadline: '',
    status: 'open',
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
        status: formData.status,
        priority: formData.priority,
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      toast({ title: 'Success', description: 'Job created successfully' });
      router.push('/dashboard/builder/jobs');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BuilderLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Job</CardTitle>
            <CardDescription>Fill in the details to publish a new job.</CardDescription>
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

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="budget">Budget ($) *</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Creating...' : 'Create Job'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
