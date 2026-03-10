'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkerLayout } from '@/components/dashboard/WorkerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChatWidget } from '@/components/chat/ChatWidget';

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  category: string;
  priority: string;
  builderId: { _id: string; firstName: string; lastName: string };
}

export default function WorkerJobConversationPage() {
  const params = useParams();
  const jobId = params?.jobId as string;
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState('');

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load job');
      }
      setJob(data.data);
      // compute conversation id between worker (current) and builder
      const trainer = data.data.builderId._id;
      // get user id from session cookie
      const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('auth_session='));
      if (cookie) {
        try {
          const session = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          const myId = session._id;
          const ids = [myId, trainer].sort();
          setConversationId(ids.join('-'));
        } catch {}
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !job) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription>
              With {job.builderId.firstName} {job.builderId.lastName} ({job.status})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{job.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Budget: ${job.budget} • Deadline: {new Date(job.deadline).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        {conversationId && (
          <ChatWidget
            conversationId={conversationId}
            otherUserId={job.builderId._id}
            otherUserName={`${job.builderId.firstName} ${job.builderId.lastName}`}
            jobId={job._id}
          />
        )}
      </div>
    </WorkerLayout>
  );
}
