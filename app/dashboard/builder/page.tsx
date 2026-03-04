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

export default function BuilderDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Link href="/dashboard/builder/messages">
              <Button variant="outline" className="w-full bg-transparent">
                Messages
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
}
