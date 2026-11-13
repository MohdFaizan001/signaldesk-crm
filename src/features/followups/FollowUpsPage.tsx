import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock, CheckCircle2, AlertTriangle, Clock, Phone, Mail,
  Video, FileText, Presentation, Check, Plus, AlertCircle
} from 'lucide-react';
import {
  Card, Button, Tabs, PriorityBadge, Badge, LoadingSpinner, EmptyState,
  ConfirmDialog, Dialog, Input, Select, Textarea
} from '../../components/ui';
import {
  useCompleteFollowUp,
  useCreateFollowUp,
  useFollowUpsQuery,
  useLeadsQuery,
  useProfiles,
} from '../../hooks';
import { useAuth } from '../../auth/AuthProvider';
import { formatDateTime, cn } from '../../utils';
import { toast } from 'sonner';
import type { FollowUp, FollowUpType, LeadPriority } from '../../types';

const typeConfig: Record<FollowUpType, { icon: React.ReactNode; label: string; color: string }> = {
  call: { icon: <Phone className="w-3.5 h-3.5" />, label: 'Call', color: 'bg-blue-100 text-blue-700' },
  email: { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', color: 'bg-amber-100 text-amber-700' },
  meeting: { icon: <Video className="w-3.5 h-3.5" />, label: 'Meeting', color: 'bg-emerald-100 text-emerald-700' },
  demo: { icon: <Presentation className="w-3.5 h-3.5" />, label: 'Demo', color: 'bg-purple-100 text-purple-700' },
  proposal: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Proposal', color: 'bg-teal-100 text-teal-700' },
};

export function FollowUpsPage() {
  const { data, isLoading, isError, error } = useFollowUpsQuery({ view: 'all', pageSize: 100 });
  const completeFollowUp = useCompleteFollowUp();
  const createFollowUp = useCreateFollowUp();

  const [activeTab, setActiveTab] = useState('overdue');
  const [completing, setCompleting] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const followUps = data?.items ?? [];
  const overdue = useMemo(() => followUps.filter((item) => item.status === 'overdue'), [followUps]);
  const upcoming = useMemo(() => followUps.filter((item) => item.status === 'upcoming'), [followUps]);
  const completed = useMemo(() => followUps.filter((item) => item.status === 'completed'), [followUps]);

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-5 h-5" />}
        title="Could not load follow-ups"
        description={error instanceof Error ? error.message : 'The API request failed.'}
      />
    );
  }

  const tabs = [
    { id: 'overdue', label: 'Overdue', count: overdue.length },
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'completed', label: 'Completed', count: completed.length },
  ];

  const currentList = activeTab === 'overdue' ? overdue : activeTab === 'upcoming' ? upcoming : completed;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Follow-ups</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {overdue.length > 0 && <span className="text-danger font-medium">{overdue.length} overdue</span>}
            {overdue.length > 0 && upcoming.length > 0 && ' · '}
            {upcoming.length > 0 && <span>{upcoming.length} upcoming</span>}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> New Follow-up
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard icon={<AlertTriangle className="w-4 h-4" />} label="Overdue" count={overdue.length} color="text-danger" bgColor="bg-danger-light border-red-200" />
        <SummaryCard icon={<Clock className="w-4 h-4" />} label="Upcoming" count={upcoming.length} color="text-amber-600" bgColor="bg-warning-light border-amber-200" />
        <SummaryCard icon={<CheckCircle2 className="w-4 h-4" />} label="Completed" count={completed.length} color="text-green-600" bgColor="bg-success-light border-green-200" />
      </div>

      <Card padding={false}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-5" />
        <div className="divide-y divide-border-light">
          {currentList.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="w-5 h-5" />}
              title={`No ${activeTab} follow-ups`}
              description={activeTab === 'overdue' ? 'Great work — nothing is overdue!' : 'No follow-ups in this category.'}
            />
          ) : (
            currentList.map((followUp) => (
              <FollowUpRow key={followUp.id} followUp={followUp} onComplete={() => setCompleting(followUp.id)} />
            ))
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!completing}
        onClose={() => setCompleting(null)}
        onConfirm={async () => {
          if (!completing) return;
          await completeFollowUp.mutateAsync(completing);
          setCompleting(null);
        }}
        title="Complete Follow-up"
        message="Mark this follow-up as completed?"
        confirmLabel="Complete"
        variant="primary"
        loading={completeFollowUp.isPending}
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Follow-up" maxWidth="max-w-xl">
        <CreateFollowUpForm
          isSubmitting={createFollowUp.isPending}
          onSubmit={async (input) => {
            await createFollowUp.mutateAsync(input);
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon, label, count, color, bgColor }: {
  icon: React.ReactNode; label: string; count: number; color: string; bgColor: string;
}) {
  return (
    <div className={`border rounded-xl p-4 ${bgColor}`}>
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-semibold text-text-primary">{count}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function FollowUpRow({ followUp, onComplete }: { followUp: FollowUp; onComplete: () => void }) {
  const config = typeConfig[followUp.type];
  const isOverdue = followUp.status === 'overdue';
  const isCompleted = followUp.status === 'completed';

  return (
    <div className={cn(
      'flex items-start gap-4 px-5 py-4 transition-colors hover:bg-bg-primary/30',
      isOverdue && 'bg-danger-light/30'
    )}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.color)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-text-primary">{followUp.title}</p>
          <Badge variant="default">{config.label}</Badge>
          <PriorityBadge priority={followUp.priority} />
        </div>
        {followUp.description && <p className="text-xs text-text-secondary mt-1">{followUp.description}</p>}
        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
          <Link to={`/leads/${followUp.leadId}`} className="hover:text-accent transition-colors">
            {followUp.leadName} · {followUp.company}
          </Link>
          <span>·</span>
          <span className={isOverdue ? 'text-danger font-medium' : ''}>
            {isOverdue ? 'Overdue: ' : isCompleted ? 'Completed: ' : 'Due: '}
            {formatDateTime(isCompleted && followUp.completedAt ? followUp.completedAt : followUp.dueDate)}
          </span>
          <span>·</span>
          <span>{followUp.assignedTo}</span>
        </div>
      </div>
      {!isCompleted ? (
        <Button variant="ghost" size="sm" onClick={onComplete} className="shrink-0">
          <Check className="w-3.5 h-3.5" /> Done
        </Button>
      ) : (
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
      )}
    </div>
  );
}

function CreateFollowUpForm({ onSubmit, onCancel, isSubmitting }: {
  onSubmit: (data: {
    leadId: string;
    title: string;
    description?: string;
    type: FollowUpType;
    dueAt: string;
    priority: LeadPriority;
    assignedToId?: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { profile } = useAuth();
  const { data: leadsData, isLoading } = useLeadsQuery({ pageSize: 100, sortBy: 'full_name', sortDir: 'asc' });
  const { data: profiles = [] } = useProfiles();
  const leads = leadsData?.items ?? [];
  const assignableProfiles = profile?.role === 'admin' ? profiles : profiles.filter((item) => item.id === profile?.id);

  const [leadId, setLeadId] = useState('');
  const [type, setType] = useState<FollowUpType>('call');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState<LeadPriority>('medium');
  const [assignedToId, setAssignedToId] = useState(profile?.id ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const resolvedLeadId = leadId || leads[0]?.id || '';
  const resolvedAssignee = assignedToId || profile?.id || '';

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!resolvedLeadId) nextErrors.leadId = 'Select a lead';
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!dueAt) nextErrors.dueAt = 'Due date is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        leadId: resolvedLeadId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        dueAt: new Date(dueAt).toISOString(),
        priority,
        assignedToId: resolvedAssignee,
      });
    } catch {
      toast.error('Failed to create follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock className="w-5 h-5" />}
        title="No leads available"
        description="Create a lead before scheduling a follow-up."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Lead"
          value={resolvedLeadId}
          onChange={(event) => setLeadId(event.target.value)}
          options={leads.map((lead) => ({ value: lead.id, label: `${lead.fullName} — ${lead.company}` }))}
          error={errors.leadId}
        />
        <Select
          label="Type"
          value={type}
          onChange={(event) => setType(event.target.value as FollowUpType)}
          options={[
            { value: 'call', label: 'Call' },
            { value: 'email', label: 'Email' },
            { value: 'meeting', label: 'Meeting' },
            { value: 'demo', label: 'Demo' },
            { value: 'proposal', label: 'Proposal' },
          ]}
        />
        <div className="sm:col-span-2">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Follow-up title" error={errors.title} />
        </div>
        <Input label="Due Date & Time" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} error={errors.dueAt} />
        <Select
          label="Priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as LeadPriority)}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
        <div className="sm:col-span-2">
          <Select
            label="Assigned To"
            value={resolvedAssignee}
            onChange={(event) => setAssignedToId(event.target.value)}
            disabled={profile?.role !== 'admin'}
            options={assignableProfiles.map((item) => ({ value: item.id, label: item.fullName || item.email }))}
          />
        </div>
      </div>
      <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Details about this follow-up..." />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting || isSubmitting}>Create Follow-up</Button>
      </div>
    </form>
  );
}
