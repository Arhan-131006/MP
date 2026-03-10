'use client';

import React, { useEffect, useState } from 'react';
import { WorkerLayout } from '@/components/dashboard/WorkerLayout';
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
  assignedVendors: string[];
}

export default function WorkerJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // grab current user so we can filter "my jobs"
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      if (response.ok && data.data) {
        setUserId(data.data._id);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter && statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await fetch(`/api/jobs?limit=100${statusParam}`);
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

  const isAssignedToMe = (job: Job) => {
    return userId && job.assignedVendors.map(String).includes(userId);
  };

  const handleAccept = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept job');
      }
      toast({ title: 'Success', description: 'Job accepted' });
      // notify other tabs/components that jobs changed
      try {
        localStorage.setItem('jobs:updated', Date.now().toString());
      } catch {}
      fetchJobs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // when the user picks a non-open, non-all status we only want to show jobs that are assigned to them
  const filteredJobs = jobs
    .filter((job) => job.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((job) => {
      if (statusFilter && statusFilter !== 'all' && statusFilter !== 'open') {
        // only show jobs matching the selected status that involve this worker
        return job.status === statusFilter && isAssignedToMe(job);
      }
      return true;
    });

  return (
    <WorkerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Jobs</h1>
            <p className="text-muted-foreground mt-1">Accept work assigned by admins, builders or vendors</p>
          </div>
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
            {filteredJobs.map((job) => {
              const assignedToMe = isAssignedToMe(job);
              return (
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
                            className={`text-xs px-2 py-1 rounded ${
                              job.priority === 'urgent'
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
                          {assignedToMe && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              You&apos;re assigned
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${job.budget}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(job.deadline).toLocaleDateString()}
                        </div>
                        {!assignedToMe && job.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => handleAccept(job._id)}
                          >
                            Accept Job
                          </Button>
                        )}
                        {assignedToMe && (
                          <>
                            <Link href={`/features/scheduling?jobId=${job._id}`} className="mt-3 block">
                              <Button size="sm" variant="outline">
                                Track Job
                              </Button>
                            </Link>
                            <Link href={`/dashboard/worker/messages/${job._id}`} className="mt-2 block">
                              <Button size="sm" variant="ghost" className="text-blue-600">
                                Message Builder
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No jobs found. Check back later or change your filters.
            </CardContent>
          </Card>
        )}
      </div>
    </WorkerLayout>
  );
}
