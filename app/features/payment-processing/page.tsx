'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/dashboard/AdminLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Payment {
  _id: string;
  fromUser: { name: string; email: string };
  toUser: { name: string; email: string };
  jobId: string;
  amount: number;
  adminTax: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

const TAX_PERCENTAGE = 5;

export default function PaymentGateway() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    adminTax: 0,
    pendingAmount: 0,
  });
  const [formData, setFormData] = useState({
    fromUser: '',
    toUser: '',
    jobId: '',
    amount: '',
    paymentMethod: 'card',
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payments');
      }

      const paymentsData = data.data || [];
        const paymentsArray = Array.isArray(data.data) ? data.data : [];
        setPayments(paymentsArray);
      
      calculateStats(paymentsData);
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

  const calculateStats = (paymentsData: Payment[]) => {
    const stats = {
      totalPayments: paymentsData.length,
      totalAmount: 0,
      adminTax: 0,
      pendingAmount: 0,
    };

    paymentsData.forEach((payment) => {
      stats.totalAmount += payment.amount;
      stats.adminTax += payment.adminTax;
      if (payment.status === 'pending') {
        stats.pendingAmount += payment.amount;
      }
    });

    setStats(stats);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      fromUser: '',
      toUser: '',
      jobId: '',
      amount: '',
      paymentMethod: 'card',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromUser || !formData.toUser || !formData.jobId || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    const adminTax = (amount * TAX_PERCENTAGE) / 100;

    setSaving(true);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUser: formData.fromUser,
          toUser: formData.toUser,
          jobId: formData.jobId,
          amount,
          adminTax,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      toast({
        title: 'Success',
        description: 'Payment created successfully',
      });

      setOpenDialog(false);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment');
      }

      toast({
        title: 'Success',
        description: `Payment ${newStatus}`,
      });

      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payment Gateway</h1>
            <p className="text-muted-foreground mt-2">Manage payments and transactions</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Payment</DialogTitle>
                <DialogDescription>
                  Process a payment between two users (5% tax applied to admin)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fromUser">From User *</Label>
                  <Input
                    id="fromUser"
                    name="fromUser"
                    value={formData.fromUser}
                    onChange={handleInputChange}
                    placeholder="User ID/Email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="toUser">To User *</Label>
                  <Input
                    id="toUser"
                    name="toUser"
                    value={formData.toUser}
                    onChange={handleInputChange}
                    placeholder="User ID/Email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="jobId">Job ID *</Label>
                  <Input
                    id="jobId"
                    name="jobId"
                    value={formData.jobId}
                    onChange={handleInputChange}
                    placeholder="Job ID"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className="mt-1"
                  />
                  {formData.amount && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Admin Tax (5%): ${(parseFloat(formData.amount) * TAX_PERCENTAGE / 100).toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleSelectChange('paymentMethod', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? 'Processing...' : 'Create Payment'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admin Tax (5%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.adminTax.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${stats.pendingAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Transactions</CardTitle>
            <CardDescription>All payments processed through the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From User</TableHead>
                    <TableHead>To User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Admin Tax (5%)</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!Array.isArray(payments) || payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-medium">{payment.fromUser.name}</TableCell>
                        <TableCell>{payment.toUser.name}</TableCell>
                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">${payment.adminTax.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {payment.status === 'completed' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 font-semibold">Completed</span>
                              </>
                            ) : payment.status === 'pending' ? (
                              <>
                                <Clock className="w-4 h-4 text-orange-500" />
                                <span className="text-orange-600 font-semibold">Pending</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-600 font-semibold">Failed</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {payment.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(payment._id, 'completed')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(payment._id, 'failed')}
                              >
                                Reject
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
      </div>
    </AdminLayout>
  );
}
