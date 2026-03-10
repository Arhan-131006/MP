'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VendorLayout } from '@/components/dashboard/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

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

interface Worker {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  industry: string;
}

function VendorAssignJobsContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (jobId) {
      fetchJobAndWorkers();
    }
  }, [jobId]);

  const fetchJobAndWorkers = async () => {
    setLoading(true);
    try {
      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      const jobData = await jobResponse.json();

      if (!jobResponse.ok) {
        throw new Error(jobData.error || 'Failed to load job');
      }

      setJob(jobData.data);

      // Fetch available workers
      const workersResponse = await fetch('/api/users/vendors-workers?role=worker');
      const workersData = await workersResponse.json();

      if (workersResponse.ok) {
        setWorkers(workersData.data.users || []);
      }
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

  const handleWorkerToggle = (workerId: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleAssignWorkers = async () => {
    if (selectedWorkers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one worker',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    try {
      // Assign each selected worker to the job
      const assignmentPromises = selectedWorkers.map((workerId) =>
        fetch(`/api/jobs/${jobId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: workerId }),
        })
      );

      const results = await Promise.all(assignmentPromises);
      const failedAssignments = results.filter((res) => !res.ok);

      if (failedAssignments.length > 0) {
        throw new Error(`Failed to assign ${failedAssignments.length} worker(s)`);
      }

      toast({
        title: 'Success',
        description: `Successfully assigned ${selectedWorkers.length} worker(s) to the job`,
      });

      // Reset and go back
      setSelectedWorkers([]);
      setTimeout(() => {
        window.history.back();
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const filteredWorkers = workers.filter((worker) =>
    `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assign Workers to Job</h1>
          <p className="text-muted-foreground mt-1">Select workers to assign to this job</p>
        </div>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription>{job.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-semibold">{job.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p className="font-semibold capitalize">{job.priority}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-semibold">${job.budget}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-semibold">{new Date(job.deadline).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workers Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Workers ({selectedWorkers.length})</CardTitle>
            <CardDescription>Search and select workers to assign to this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search workers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />

            {filteredWorkers.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                {filteredWorkers.map((worker) => (
                  <div key={worker._id} className="flex items-center space-x-3 p-3 border rounded hover:bg-accent transition-colors">
                    <Checkbox
                      id={worker._id}
                      checked={selectedWorkers.includes(worker._id)}
                      onCheckedChange={() => handleWorkerToggle(worker._id)}
                    />
                    <div className="flex-1 cursor-pointer" onClick={() => handleWorkerToggle(worker._id)}>
                      <p className="font-semibold">
                        {worker.firstName} {worker.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{worker.email}</p>
                      <p className="text-xs text-muted-foreground">{worker.phone} • {worker.industry}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                {searchTerm ? 'No workers found matching your search' : 'No workers available'}
              </div>
            )}

            {selectedWorkers.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Selected Workers:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWorkers.map((workerId) => {
                    const worker = workers.find((w) => w._id === workerId);
                    return (
                      <Badge key={workerId} variant="secondary">
                        {worker?.firstName} {worker?.lastName}
                        <button
                          onClick={() => handleWorkerToggle(workerId)}
                          className="ml-2 text-xs hover:text-red-500"
                        >
                          ✕
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleAssignWorkers}
                disabled={assigning || selectedWorkers.length === 0}
                className="px-8"
              >
                {assigning ? 'Assigning...' : `Assign ${selectedWorkers.length} Worker(s)`}
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
}

export default function VendorAssignJobsPage() {
  return (
    <VendorLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }>
        <VendorAssignJobsContent />
      </Suspense>
    </VendorLayout>
  );
}
