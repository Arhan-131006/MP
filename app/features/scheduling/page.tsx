'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, CheckCircle2, AlertCircle, MapPin, User } from 'lucide-react';
import { AdminLayout } from '@/components/dashboard/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Schedule {
  _id: string;
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  worker: { name: string; email: string; phone: string };
  vendor: { name: string; email: string };
  startDate: string;
  endDate: string;
  status: string;
  acceptedAt: string;
  budget: number;
  description: string;
  location: string;
}

interface ScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  completedSchedules: number;
  pendingSchedules: number;
  totalRevenue: number;
}

export default function Scheduling() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ScheduleStats>({
    totalSchedules: 0,
    activeSchedules: 0,
    completedSchedules: 0,
    pendingSchedules: 0,
    totalRevenue: 0,
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/scheduling');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load schedules');
      }

      const schedulesData = Array.isArray(data.data) ? data.data : [];
      setSchedules(schedulesData);
      calculateStats(schedulesData);
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

  const calculateStats = (schedulesData: Schedule[]) => {
    const stats = {
      totalSchedules: schedulesData.length,
      activeSchedules: schedulesData.filter((s) => s.status === 'active').length,
      completedSchedules: schedulesData.filter((s) => s.status === 'completed').length,
      pendingSchedules: schedulesData.filter((s) => s.status === 'pending').length,
      totalRevenue: schedulesData.reduce((sum, s) => sum + s.budget, 0),
    };
    setStats(stats);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleUpdateStatus = async (scheduleId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/scheduling/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update schedule');
      }

      toast({
        title: 'Success',
        description: `Schedule marked as ${newStatus}`,
      });

      fetchSchedules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    if (filterStatus === 'all') return true;
    return schedule.status === filterStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading schedules...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Job Scheduling</h1>
          <p className="text-muted-foreground mt-2">Track all accepted jobs and their schedules</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSchedules}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeSchedules}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedSchedules}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingSchedules}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs defaultValue="all" onValueChange={(value: any) => setFilterStatus(value)}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.totalSchedules})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.activeSchedules})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completedSchedules})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pendingSchedules})</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Jobs</CardTitle>
                <CardDescription>
                  {filterStatus === 'all'
                    ? 'All scheduled jobs'
                    : `Jobs with status: ${filterStatus}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Worker</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!Array.isArray(filteredSchedules) || filteredSchedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No schedules found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSchedules.map((schedule) => (
                          <TableRow key={schedule._id}>
                            <TableCell>
                              <div className="font-medium">{schedule.jobTitle}</div>
                              <div className="text-sm text-muted-foreground">{schedule.jobCategory}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {schedule.worker.name}
                                </span>
                                <span className="text-xs text-muted-foreground">{schedule.worker.phone}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{schedule.vendor.name}</div>
                                <div className="text-xs text-muted-foreground">{schedule.vendor.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {new Date(schedule.startDate).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {new Date(schedule.endDate).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">${schedule.budget.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(schedule.status)}
                                <Badge className={getStatusColor(schedule.status)}>
                                  {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {schedule.status === 'active' && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(schedule._id, 'completed')}
                                  >
                                    Complete
                                  </Button>
                                </div>
                              )}
                              {schedule.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(schedule._id, 'active')}
                                  >
                                    Start
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upcoming Jobs */}
        {stats.activeSchedules > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming This Week</CardTitle>
              <CardDescription>Jobs starting within the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules
                  .filter(
                    (s) =>
                      s.status === 'active' &&
                      new Date(s.startDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                  )
                  .slice(0, 5)
                  .filter(s => s)
                  .map((schedule: any) => (
                    <div key={schedule._id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{schedule.jobTitle}</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {schedule.worker.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(schedule.startDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">${schedule.budget}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
