'use client';

import { useEffect, useState } from 'react';
import { VendorLayout } from '@/components/dashboard/VendorLayout';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface PaymentStats {
  totalEarnings: number;
  totalPending: number;
  totalFailed: number;
  totalRefunded: number;
}

export default function VendorPaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [paymentsByStatus, setPaymentsByStatus] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    platformFee: 0,
    completedPayments: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await fetch(`/api/payments?limit=100${statusParam}`);
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

      // Use the summary data if available
      if (data.data.summary) {
        setPaymentStats(data.data.summary);
      }

      if (data.data.paymentsByStatus) {
        setPaymentsByStatus(data.data.paymentsByStatus);
      }

      // Calculate stats for completed payments
      const completed = paymentsList.filter((p: any) => p.status === 'completed');
      const totalAmount = completed.reduce((sum: number, p: any) => sum + p.amount, 0);
      const platformFee = completed.reduce((sum: number, p: any) => sum + p.platformFee, 0);
      const netEarnings = completed.reduce((sum: number, p: any) => sum + p.netAmount, 0);

      setStats({
        totalAmount,
        platformFee,
        completedPayments: completed.length,
        pendingPayments: paymentsList.filter((p: any) => p.status === 'pending' || p.status === 'processing').length,
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
    <VendorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Tracking</h1>
          <p className="text-muted-foreground">Monitor your earnings and pending payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${payments
                  .filter((p) => p.status === 'pending' || p.status === 'processing')
                  .reduce((sum, p) => sum + p.netAmount, 0)
                  .toFixed(2)}
              </div>
              <p className="text-xs text-yellow-700 mt-1">{stats.pendingPayments} transactions</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-900">Platform Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${stats.platformFee.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedPayments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {paymentsByStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payments Overview</CardTitle>
              <CardDescription>Distribution of your payment transactions by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Count" />
                  <Bar dataKey="amount" fill="#10b981" name="Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

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
                        <TableCell className="text-green-600 font-semibold">${payment.netAmount.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod.replace('-', ' ')}</TableCell>
                        <TableCell className="text-red-600">${payment.platformFee.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
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
    </VendorLayout>
  );
}
