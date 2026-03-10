'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BuilderLayout } from '@/components/dashboard/BuilderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface JobFormData {
  title: string;
  description: string;
  budget: string;
  category: string;
  deadline: string;
  status: string;
  priority: string;
}

export default function BuilderEditJobPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const jobId = params?.id;
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    budget: '',
    category: '',
    deadline: '',
    status: 'open',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.status === 404) {
          router.replace('/not-found');
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load job');
        const job = data.data;
        setFormData({
          title: job.title || '',
          description: job.description || '',
          budget: job.budget?.toString() || '',
          category: job.category || '',
          deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : '',
          status: job.status || 'open',
          priority: job.priority || 'medium',
        });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

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

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update job');
      }

      toast({ title: 'Success', description: 'Job updated successfully' });
      router.push('/dashboard/builder/jobs');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BuilderLayout>
        <div className="text-center mt-20">Loading job...</div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Job</CardTitle>
            <CardDescription>Modify the details and save changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* similar form fields as create page */}
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

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Update Job'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
