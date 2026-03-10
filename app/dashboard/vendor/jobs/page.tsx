'use client';

import React, { useEffect, useState } from 'react';
import { VendorLayout } from '@/components/dashboard/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  category: string;
  priority: string;
}

export default function VendorJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await fetch(`/api/jobs?limit=100&all=true${statusParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load jobs');
      }

      setJobs(data.data.jobs || []);
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

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Jobs</h1>
            <p className="text-muted-foreground mt-1">Manage and create job requests</p>
          </div>
          <Link href="/dashboard/vendor/jobs/create">
            <Button>Create Job Request</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Loading jobs...
            </CardContent>
          </Card>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {job.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${job.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : job.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : job.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                        >
                          {job.priority}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${job.budget}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(job.deadline).toLocaleDateString()}
                      </div>
                      {job.status !== 'completed' && job.status !== 'cancelled' && (
                        <Link href={`/dashboard/vendor/jobs/assign?jobId=${job._id}`} className="mt-3 block">
                          <Button size="sm" variant="outline">
                            Assign Workers
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No jobs found. Create a new job request to get started!
            </CardContent>
          </Card>
        )}
      </div>
    </VendorLayout>
  );
}
