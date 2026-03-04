'use client';

import { useEffect, useState } from 'react';
import { WorkerLayout } from '@/components/dashboard/WorkerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  completedJobs: number;
  pendingPayments: number;
  receivedPayments: number;
  totalEarnings: number;
  platformFeesPaid: number;
  netEarnings: number;
}

export default function WorkerDashboard() {
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
      const completedJobs = jobs.filter((j: any) => j.status === 'completed').length;
      const totalBudget = jobs
        .filter((j: any) => j.status === 'completed')
        .reduce((sum: number, job: any) => sum + job.budget, 0);
      const platformFees = totalBudget * 0.05;
      const netEarnings = totalBudget - platformFees;

      setStats({
        completedJobs,
        pendingPayments: 0,
        receivedPayments: completedJobs,
        totalEarnings: totalBudget,
        platformFeesPaid: platformFees,
        netEarnings,
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
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </WorkerLayout>
    );
  }

  if (!stats) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Failed to load dashboard</p>
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to your worker dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Jobs</CardTitle>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fees (5%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-${stats.platformFeesPaid.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.netEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Your payment summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-muted-foreground mb-1">Pending Payments</p>
                <p className="text-3xl font-bold text-blue-600">${(stats.totalEarnings * 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">{stats.pendingPayments} payments pending</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-muted-foreground mb-1">Received Payments</p>
                <p className="text-3xl font-bold text-green-600">${stats.netEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">{stats.receivedPayments} payments received</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-muted-foreground mb-1">Available to Withdraw</p>
                <p className="text-3xl font-bold text-purple-600">${stats.netEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your work and payments</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/worker/jobs">
              <Button variant="outline" className="w-full bg-transparent">
                View Jobs
              </Button>
            </Link>
            <Link href="/dashboard/worker/earnings">
              <Button variant="outline" className="w-full bg-transparent">
                Earnings History
              </Button>
            </Link>
            <Link href="/dashboard/worker/messages">
              <Button variant="outline" className="w-full bg-transparent">
                Messages
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </WorkerLayout>
  );
}
