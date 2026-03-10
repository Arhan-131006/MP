'use client';

import React, { useEffect, useState } from 'react';
import { WorkerLayout } from '@/components/dashboard/WorkerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  category: string;
  priority: string;
  builderId: { _id: string; firstName: string; lastName: string };
  assignedVendors: string[];
}

export default function WorkerMessagesPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs?limit=100');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load jobs');
      }
      setJobs(data.data.jobs || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // parse session cookie once on client
    const cookie = document.cookie
      .split('; ')
      .find((c) => c.startsWith('auth_session='));
    if (cookie) {
      try {
        const session = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        setUserId(session._id);
      } catch {}
    }
  }, []);

  const isAssignedToMe = (job: Job) => {
    return userId && job.assignedVendors.map(String).includes(userId);
  };

  const filteredJobs = jobs
    .filter((job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((job) => {
      // allow messaging on open jobs or those already assigned to me
      return job.status === 'open' || isAssignedToMe(job);
    });

  return (
    <WorkerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Conversations</h1>
            <p className="text-muted-foreground mt-1">
              Select a job to start or continue a conversation with the builder.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full"
            />
          </CardContent>
        </Card>

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
                <CardContent className="pt-6 flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.builderId.firstName} {job.builderId.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {job.status} • ${job.budget}
                    </p>
                  </div>
                  <Link href={`/dashboard/worker/messages/${job._id}`}> 
                    <Button size="sm">Discuss</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No jobs found.
            </CardContent>
          </Card>
        )}
      </div>
    </WorkerLayout>
  );
}
