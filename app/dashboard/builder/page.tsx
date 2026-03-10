'use client';

import { useEffect, useState } from 'react';
import { BuilderLayout } from '@/components/dashboard/BuilderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalBudget: number;
  jobsByStatus: Array<{ status: string; count: number }>;
}

interface AvailableJob {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  category: string;
  priority: string;
}

export default function BuilderDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'jobs:updated') {
        fetchStats();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/jobs?limit=100');
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load stats',
          variant: 'destructive',
        });
        return;
      }

      const jobs = data.data.jobs;
      const totalBudget = jobs.reduce((sum: number, job: any) => sum + job.budget, 0);
      const jobsByStatus = jobs.reduce((acc: any, job: any) => {
        const existing = acc.find((item: any) => item.status === job.status);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ status: job.status, count: 1 });
        }
        return acc;
      }, []);

      setStats({
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j: any) => j.status !== 'completed').length,
        completedJobs: jobs.filter((j: any) => j.status === 'completed').length,
        totalBudget,
        jobsByStatus,
      });

      // Fetch open jobs for the available jobs section
      const openJobsResponse = await fetch('/api/jobs?status=open&limit=50');
      const openJobsData = await openJobsResponse.json();
      if (openJobsResponse.ok) {
        setAvailableJobs(openJobsData.data.jobs || []);
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

  if (loading) {
    return (
      <BuilderLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </BuilderLayout>
    );
  }

  if (!stats) {
    return (
      <BuilderLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Failed to load dashboard</p>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome to your builder dashboard</p>
          </div>
          <Link href="/dashboard/builder/jobs/create">
            <Button>Create New Job</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalBudget.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {stats.jobsByStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Status</CardTitle>
              <CardDescription>Overview of your job statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.jobsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your jobs and communications</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/builder/jobs">
              <Button variant="outline" className="w-full bg-transparent">
                View All Jobs
              </Button>
            </Link>
            <Link href="/dashboard/builder/jobs/create">
              <Button variant="outline" className="w-full bg-transparent">
                Create Job
              </Button>
            </Link>
            <Link href="/dashboard/builder/assign">
              <Button variant="outline" className="w-full bg-transparent">
                Assign Jobs
              </Button>
            </Link>
            <Link href="/dashboard/builder/messages">
              <Button variant="outline" className="w-full bg-transparent">
                Messages
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Available Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Available Jobs</CardTitle>
            <CardDescription>Open jobs available for management and assignment</CardDescription>
          </CardHeader>
          <CardContent>
            {availableJobs.length > 0 ? (
              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <div
                    key={job._id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
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
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${job.budget}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(job.deadline).toLocaleDateString()}
                        </div>
                        <Link href={`/dashboard/builder/jobs/${job._id}`} className="mt-2 block">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No available jobs at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
