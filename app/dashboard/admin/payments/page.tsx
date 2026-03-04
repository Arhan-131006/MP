'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/dashboard/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Payment {
  _id: string;
  userId: { _id: string; firstName: string; lastName: string; email: string };
  amount: number;
  status: string;
  paymentMethod: string;
  platformFee: number;
  netAmount: number;
  transactionId: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    paymentMethod: 'card',
    description: '',
  });
  const [stats, setStats] = useState({
    totalAmount: 0,
    platformRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0,
  });

  const handleEditOpen = (payment: Payment) => {
    setEditingPayment(payment);
    setEditStatus(payment.status);
    setEditDialogOpen(true);
  };

  const handleEditPayment = async () => {
    if (!editingPayment || !editStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/payments/${editingPayment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: editStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update payment',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Payment updated successfully',
      });

      setEditDialogOpen(false);
      setEditingPayment(null);
      setEditStatus('');
      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOpen = (payment: Payment) => {
    setDeletingPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/payments/${deletingPayment._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete payment',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Payment deleted successfully',
      });

      setDeleteDialogOpen(false);
      setDeletingPayment(null);
      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchUsers();
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

      // Calculate stats
      const completed = paymentsList.filter((p: any) => p.status === 'completed');
      const totalAmount = completed.reduce((sum: number, p: any) => sum + p.amount, 0);
      const platformRevenue = completed.reduce((sum: number, p: any) => sum + p.platformFee, 0);

      setStats({
        totalAmount,
        platformRevenue,
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (response.ok && data.data) {
        setUsers(data.data.users || data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.amount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const paymentData = {
        userId: formData.userId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        description: formData.description,
      };

      console.log('Sending payment data:', paymentData);

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      console.log('Payment response:', data);

      if (!response.ok) {
        let errorMsg = 'Failed to create payment';
        
        try {
          // Try to parse validation errors
          if (data.error) {
            const parsedError = JSON.parse(data.error);
            // Get first error message
            errorMsg = Object.values(parsedError)[0] as string || data.message || 'Failed to create payment';
          } else {
            errorMsg = data.message || 'Failed to create payment';
          }
        } catch (e) {
          errorMsg = data.error || data.message || 'Failed to create payment';
        }

        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        return;
      }

      // Get the selected user info
      const selectedUser = users.find(u => u._id === formData.userId);

      toast({
        title: 'Success',
        description: `Payment created for ${selectedUser?.firstName} ${selectedUser?.lastName}`,
      });

      // Reset form and close dialog
      setFormData({
        userId: '',
        amount: '',
        paymentMethod: 'card',
        description: '',
      });
      setDialogOpen(false);

      // Refresh payments list
      fetchPayments();
    } catch (error: any) {
      console.error('Payment creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
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
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
            <p className="text-muted-foreground">Monitor and manage all platform payments</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Payment</DialogTitle>
                <DialogDescription>
                  Create a payment record for a user. Payment will be visible in their respective dashboard.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreatePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Select User</Label>
                  <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="qr">QR Code</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Payment description or notes"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Payment'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Payment Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Payment Status</DialogTitle>
              <DialogDescription>
                Update payment status to processed or completed
              </DialogDescription>
            </DialogHeader>

            {editingPayment && (
              <div className="space-y-4">
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Transaction:</span> {editingPayment.transactionId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">User:</span> {editingPayment.userId.firstName} {editingPayment.userId.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Amount:</span> ${editingPayment.amount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Payment Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" disabled={updating} onClick={handleEditPayment}>
                    {updating ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Payment Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment? This action cannot be undone.
                {deletingPayment && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-semibold">
                      {deletingPayment.transactionId} - ${deletingPayment.amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Keep Payment</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePayment}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Delete Payment'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fees (5%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.platformRevenue.toFixed(2)}</div>
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
            <CardTitle>All Payments</CardTitle>
            <CardDescription>Transaction history and status</CardDescription>
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
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-mono text-sm">{payment.transactionId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{`${payment.userId.firstName} ${payment.userId.lastName}`}</p>
                            <p className="text-xs text-muted-foreground">{payment.userId.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                        <TableCell className="text-green-600">${payment.platformFee.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(payment.status)}>{payment.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOpen(payment)}
                              className="w-8 h-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteOpen(payment)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
