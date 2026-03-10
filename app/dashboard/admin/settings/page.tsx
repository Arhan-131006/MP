'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/dashboard/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit2, Check, X } from 'lucide-react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [editingPassword, setEditingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }

      setProfile(data.data);
      setFormData({
        name: data.data.name,
        email: data.data.email,
        phone: data.data.phone,
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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditNameClick = () => {
    setTempName(formData.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, name: tempName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update name');
      }

      setProfile(data.data);
      setFormData((prev) => ({ ...prev, name: tempName }));
      setEditingName(false);
      toast({
        title: 'Success',
        description: 'Name updated successfully',
      });
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

  const handleCancelNameEdit = () => {
    setEditingName(false);
    setTempName('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    if (!passwordData.currentPassword) {
      toast({
        title: 'Error',
        description: 'Please enter current password',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordData.newPassword) {
      toast({
        title: 'Error',
        description: 'Please enter new password',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setEditingPassword(false);

      toast({
        title: 'Success',
        description: 'Password changed successfully. Redirecting to login...',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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

  const handleCancelPasswordEdit = () => {
    setEditingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile(data.data);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    {editingName ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          placeholder="Enter your full name"
                          disabled={saving}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveName}
                          disabled={saving}
                          className="w-10 p-0"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCancelNameEdit}
                          disabled={saving}
                          className="w-10 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-1 items-center">
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          disabled
                          className="mt-0 bg-muted"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleEditNameClick}
                          className="w-10 h-10 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleProfileChange}
                      placeholder="Enter your phone number"
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                {!editingPassword ? (
                  <Button type="button" onClick={() => setEditingPassword(true)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="button" 
                        disabled={saving} 
                        onClick={handleSavePassword}
                        className="flex-1"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={saving}
                        onClick={handleCancelPasswordEdit}
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
