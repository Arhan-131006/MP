'use client';

import { useEffect, useState } from 'react';
import { BuilderLayout } from '@/components/dashboard/BuilderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, CheckCircle } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'vendor' | 'worker';
  companyName?: string;
  industry: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  priority: string;
  deadline: string;
  assignedVendors: string[];
}

export default function AssignPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // include all jobs so builders see every job in the database (API respects all=true for builders)
      const [usersRes, jobsRes] = await Promise.all([
        fetch('/api/users/vendors-workers'),
        fetch('/api/jobs?all=true')
      ]);

      // log statuses for debugging
      console.debug('usersRes status', usersRes.status);
      console.debug('jobsRes status', jobsRes.status);

      const usersData = await usersRes.json();
      const jobsData = await jobsRes.json();
      console.debug('usersData', usersData);
      console.debug('jobsData', jobsData);

      if (!usersRes.ok || !jobsRes.ok) {
        const errMsg = usersData.error || jobsData.error || 'Failed to load data';
        toast({
          title: 'Error',
          description: errMsg,
          variant: 'destructive',
        });
        console.error('fetchData error', usersData, jobsData);
        return;
      }

      setUsers(usersData.data.users);
      setJobs(jobsData.data.jobs);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      console.error('fetchData exception', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (userId: string, jobId: string) => {
    setAssigning(`${userId}-${jobId}`);
    try {
      const response = await fetch(`/api/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to assign job',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Job assigned successfully',
      });

      // Update local state
      setJobs(jobs.map(job =>
        job._id === jobId
          ? { ...job, assignedVendors: [...job.assignedVendors, userId] }
          : job
      ));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAssigning(null);
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

  if (loading) {
    return (
      <BuilderLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Assign Jobs</h1>
            <p className="text-muted-foreground mt-1">Assign jobs to vendors and workers</p>
          </div>
        </div>

        {/* Users Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors & Workers</CardTitle>
            <CardDescription>All available vendors and workers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <Card key={user._id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      </div>
                      <Badge variant="outline" className={user.role === 'vendor' ? 'bg-blue-50' : 'bg-green-50'}>
                        {user.role}
                      </Badge>
                    </div>
                    {user.companyName && (
                      <p className="text-sm text-muted-foreground">{user.companyName}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{user.industry}</p>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Jobs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Available Jobs</CardTitle>
            <CardDescription>Jobs that can be assigned to vendors/workers</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No jobs available yet.</p>
                <p>
                  <a href="/dashboard/builder/jobs/create" className="text-blue-600 underline">
                    Create a new job
                  </a>{' '}
                  to start assigning.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs
                  .filter((job) => job.status !== 'completed' && job.status !== 'cancelled')
                  .map((job) => (
                    <Card key={job._id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                            <Badge variant="outline" className={getPriorityColor(job.priority)}>
                              {job.priority}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{job.description}</p>
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
                              <span className="text-muted-foreground">Assigned: </span>
                              <span className="font-semibold">{job.assignedVendors.length} user(s)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Assign Section */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Assign to:</h4>
                        <div className="flex flex-wrap gap-2">
                          {users.map((user) => {
                            const isAssigned = job.assignedVendors.includes(user._id);
                            const isAssigning = assigning === `${user._id}-${job._id}`;

                            return (
                              <Button
                                key={user._id}
                                variant={isAssigned ? "default" : "outline"}
                                size="sm"
                                onClick={() => !isAssigned && handleAssign(user._id, job._id)}
                                disabled={isAssigning || isAssigned}
                                className="flex items-center gap-1"
                              >
                                {isAssigned ? (
                                  <>
                                    <CheckCircle size={14} />
                                    {user.firstName} {user.lastName}
                                  </>
                                ) : isAssigning ? (
                                  'Assigning...'
                                ) : (
                                  <>
                                    <UserPlus size={14} />
                                    {user.firstName} {user.lastName}
                                  </>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}