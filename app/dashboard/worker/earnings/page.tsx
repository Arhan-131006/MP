'use client';

import { useEffect, useState } from 'react';
import { WorkerLayout } from '@/components/dashboard/WorkerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  _id: string;
  userId: { _id: string; firstName: string; lastName: string; email: string };
  jobId?: { _id: string; title: string; budget: number };
  amount: number;
  status: string;
  paymentMethod: string;
  platformFee: number;
  netAmount: number;
  transactionId: string;
  createdAt: string;
}

export default function WorkerEarningsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    platformFee: 0,
    completedPayments: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments?limit=100');
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load payments',
          variant: 'destructive',
        });
        return;
      }

      const paymentsList = data.data.payments;
      setPayments(paymentsList);

      // Calculate stats for completed payments
      const completed = paymentsList.filter((p: any) => p.status === 'completed');
      const totalAmount = completed.reduce((sum: number, p: any) => sum + p.amount, 0);
      const platformFee = completed.reduce((sum: number, p: any) => sum + p.platformFee, 0);

      setStats({
        totalAmount,
        platformFee,
        completedPayments: completed.length,
        pendingPayments: paymentsList.filter((p: any) => p.status === 'pending').length,
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <WorkerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Earnings</h1>
          <p className="text-muted-foreground">Track your payment history and status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${stats.platformFee.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your transaction records and status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payments found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-mono text-sm">{payment.transactionId}</TableCell>
                        <TableCell className="font-semibold">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">${payment.netAmount.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                        <TableCell className="text-red-600">${payment.platformFee.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(payment.status)}>{payment.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WorkerLayout>
  );
}
