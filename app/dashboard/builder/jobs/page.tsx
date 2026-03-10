'use client';

import { useEffect, useState } from 'react';
import { BuilderLayout } from '@/components/dashboard/BuilderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  priority: string;
  deadline: string;
  assignedVendors: any[];
  createdAt: string;
}

export default function BuilderJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // request all jobs, not just those created by this builder
      const response = await fetch('/api/jobs?all=true');
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load jobs',
          variant: 'destructive',
        });
        return;
      }

      setJobs(data.data.jobs);
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

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete job',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority] || '';
  };

  return (
    <BuilderLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Jobs Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage your construction jobs</p>
          </div>
          <Link href="/dashboard/builder/jobs/create">
            <Button>
              <Plus size={16} className="mr-2" />
              Create Job
            </Button>
          </Link>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Loading jobs...
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No jobs created yet</p>
                  <Link href="/dashboard/builder/jobs/create">
                    <Button>Create Your First Job</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                        <Badge variant="outline" className={getPriorityColor(job.priority)}>
                          {job.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3 line-clamp-2">{job.description}</p>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Budget: </span>
                          <span className="font-semibold">${job.budget.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deadline: </span>
                          <span className="font-semibold">{new Date(job.deadline).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Assigned To: </span>
                          <span className="font-semibold">{job.assignedVendors.length} vendor(s)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/builder/jobs/${job._id}`}>
                        <Button variant="outline" size="sm" title="Edit job">
                          <Edit2 size={16} />
                        </Button>
                      </Link>
                      <Link href={`/features/scheduling?jobId=${job._id}`}>
                        <Button variant="outline" size="sm" title="Track job">
                          <MapPin size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(job._id)}
                        className="hover:bg-red-50"
                        title="Delete job"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </BuilderLayout>
  );
}
