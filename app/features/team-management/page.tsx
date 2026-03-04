'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, CheckCircle2, Clock, Loader2, Users } from 'lucide-react';
import { AdminLayout } from '@/components/dashboard/AdminLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Team {
  _id: string;
  name: string;
  description: string;
  createdBy: { name: string; role: string };
  members: { userId: string; name: string; role: string; status: string }[];
  teamSize: number;
  createdAt: string;
}

interface TeamRequest {
  _id: string;
  teamId: string;
  teamName: string;
  userId: string;
  userName: string;
  userRole: string;
  status: string;
  createdAt: string;
}

export default function TeamManagement() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'teams' | 'requests'>('teams');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: '',
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const [teamsRes, requestsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/teams/requests/pending'),
      ]);

      const teamsData = await teamsRes.json();
      const requestsData = await requestsRes.json();

      if (!teamsRes.ok) {
        throw new Error(teamsData.error || 'Failed to load teams');
      }

      setTeams(Array.isArray(teamsData.data) ? teamsData.data : []);
      setRequests(Array.isArray(requestsData.data) ? requestsData.data : []);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      members: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.members) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    const membersList = formData.members
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m);

    if (membersList.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter at least one member email/ID',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          membersList,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      toast({
        title: 'Success',
        description: 'Team created successfully. Invitations sent to members!',
      });

      setOpenDialog(false);
      resetForm();
      fetchTeams();
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

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete team');
      }

      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });

      fetchTeams();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/teams/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} request`);
      }

      toast({
        title: 'Success',
        description: `Request ${action}ed successfully`,
      });

      fetchTeams();
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
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground mt-2">Create and manage teams in bulk</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a team and send bulk invitations to workers or vendors
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter team name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the team purpose"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="members">Member Emails/IDs (comma-separated) *</Label>
                  <Textarea
                    id="members"
                    name="members"
                    value={formData.members}
                    onChange={handleInputChange}
                    placeholder="user1@example.com, user2@example.com, user3@example.com"
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter member emails or IDs separated by commas
                  </p>
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? 'Creating...' : 'Create Team'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('teams')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'teams'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Teams ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'requests'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Invitations ({requests.length})
          </button>
        </div>

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!Array.isArray(teams) || teams.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <p className="text-muted-foreground">No teams created yet</p>
                </CardContent>
              </Card>
            ) : (
              teams.map((team) => (
                <Card key={team._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          {team.name}
                        </CardTitle>
                        <CardDescription className="mt-2">{team.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Team Size</p>
                        <p className="text-lg font-bold">{team.teamSize} members</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Created By</p>
                        <p className="text-sm">{team.createdBy.name} ({team.createdBy.role})</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Members</p>
                        <div className="space-y-1">
                          {team.members.slice(0, 3).map((member, idx) => (
                            <div key={idx} className="text-xs flex justify-between">
                              <span>{member.name}</span>
                              <span className={member.status === 'accepted' ? 'text-green-600' : 'text-orange-600'}>
                                {member.status}
                              </span>
                            </div>
                          ))}
                          {team.members.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{team.members.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDeleteTeam(team._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Team
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'requests' && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Team invitations awaiting response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!Array.isArray(requests) || requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No pending invitations
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell className="font-medium">{request.userName}</TableCell>
                          <TableCell>{request.teamName}</TableCell>
                          <TableCell className="capitalize">{request.userRole}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span className="text-orange-600 font-semibold">Pending</span>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                                onClick={() => handleRequestResponse(request._id, 'accept')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleRequestResponse(request._id, 'reject')}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
