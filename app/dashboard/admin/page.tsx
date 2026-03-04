'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/dashboard/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, Calendar } from 'lucide-react';


interface Analytics {
  summary: {
    totalUsers: number;
    totalJobs: number;
    totalPayments: number;
    totalRevenue: number;
    platformRevenue: number;
  };
  usersByRole: Array<{ role: string; count: number }>;
  jobsByStatus: Array<{ status: string; count: number }>;
  paymentsByMethod: Array<{ method: string; count: number; total: number }>;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  // user list and payment dialog state removed since gateway tool is deleted


  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load analytics',
          variant: 'destructive',
        });
        return;
      }

      setAnalytics(data.data);
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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Failed to load analytics</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.totalPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.summary.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Fee (5%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.summary.platformRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>Distribution of users across different roles</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.usersByRole}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobs by Status</CardTitle>
              <CardDescription>Overview of job statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.jobsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payments by Method</CardTitle>
            <CardDescription>Revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.paymentsByMethod.map((method) => (
                <div key={method.method} className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground capitalize">{method.method}</p>
                  <p className="text-xl font-bold mt-2">${method.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{method.count} transactions</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Management Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Job Management */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">Job Management</CardTitle>
                </div>
                <CardDescription>Manage all jobs and assignments</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-4">Create, edit, and monitor all job postings and assignments</p>
                <Link href="/features/job-management">
                  <Button className="w-full" variant="default">
                    Manage Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>



            {/* Team Management */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <CardTitle className="text-lg">Team Management</CardTitle>
                </div>
                <CardDescription>Manage teams and roles</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-4">Organize teams, assign roles, and manage permissions</p>
                <Link href="/features/team-management">
                  <Button className="w-full" variant="default">
                    Manage Teams
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-lg">Scheduling</CardTitle>
                </div>
                <CardDescription>Schedule jobs and resources</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-4">Plan and schedule work assignments efficiently</p>
                <Link href="/features/scheduling">
                  <Button className="w-full" variant="default">
                    Schedule
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
