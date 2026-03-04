'use client';

import { useEffect, useState } from 'react';
import { VendorLayout } from '@/components/dashboard/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  assignedJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  totalEarnings: number;
  jobsByStatus: Array<{ status: string; count: number }>;
}

export default function VendorDashboard() {
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
      const totalEarnings = jobs
        .filter((j: any) => j.status === 'completed')
        .reduce((sum: number, job: any) => sum + job.budget * 0.9, 0);
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
        assignedJobs: jobs.length,
        inProgressJobs: jobs.filter((j: any) => j.status === 'in-progress').length,
        completedJobs: jobs.filter((j: any) => j.status === 'completed').length,
        totalEarnings,
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
      <VendorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </VendorLayout>
    );
  }

  if (!stats) {
    return (
      <VendorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Failed to load dashboard</p>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to your vendor dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignedJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressJobs}</div>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {stats.jobsByStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Status</CardTitle>
              <CardDescription>Overview of assigned jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.jobsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage assigned jobs and communications</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/vendor/jobs">
              <Button variant="outline" className="w-full bg-transparent">
                View Assigned Jobs
              </Button>
            </Link>
            <Link href="/dashboard/vendor/messages">
              <Button variant="outline" className="w-full bg-transparent">
                Messages
              </Button>
            </Link>
            <Link href="/dashboard/vendor/profile">
              <Button variant="outline" className="w-full bg-transparent">
                My Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
