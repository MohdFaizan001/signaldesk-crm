import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock, CheckCircle2, AlertTriangle, Clock, Phone, Mail,
  Video, FileText, Presentation, Check, Plus
} from 'lucide-react';
import {
  Card, Button, Tabs, PriorityBadge, Badge, LoadingSpinner, EmptyState,
  ConfirmDialog, Dialog, Input, Select, Textarea
} from '../../components/ui';
import { useFollowUps } from '../../hooks';
import { formatDate, cn } from '../../utils';
import { teamMembers } from '../../data/mockData';
import * as api from '../../services/mockService';
import { toast } from 'sonner';
import type { FollowUp, FollowUpType, Lead } from '../../types';

const typeConfig: Record<FollowUpType, { icon: React.ReactNode; label: string; color: string }> = {
  call: { icon: <Phone className="w-3.5 h-3.5" />, label: 'Call', color: 'bg-blue-100 text-blue-700' },
  email: { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', color: 'bg-amber-100 text-amber-700' },
  meeting: { icon: <Video className="w-3.5 h-3.5" />, label: 'Meeting', color: 'bg-emerald-100 text-emerald-700' },
  demo: { icon: <Presentation className="w-3.5 h-3.5" />, label: 'Demo', color: 'bg-purple-100 text-purple-700' },
  proposal: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Proposal', color: 'bg-teal-100 text-teal-700' },
};

export function FollowUpsPage() {
  const { followUps, loading, fetchFollowUps, addFollowUp, complete } = useFollowUps();
  const [activeTab, setActiveTab] = useState('overdue');
  const [completing, setCompleting] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  const overdue = useMemo(() => followUps.filter((f) => f.status === 'overdue'), [followUps]);
  const upcoming = useMemo(() => followUps.filter((f) => f.status === 'upcoming'), [followUps]);
  const completed = useMemo(() => followUps.filter((f) => f.status === 'completed'), [followUps]);

  const handleComplete = async () => {
    if (completing) {
      await complete(completing);
      setCompleting(null);
    }
  };

  const handleCreate = async (data: Omit<FollowUp, 'id'>) => {
    await addFollowUp(data);
    setShowCreate(false);
  };

  if (loading) return <LoadingSpinner />;

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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Overdue"
          count={overdue.length}
          color="text-danger"
          bgColor="bg-danger-light border-red-200"
        />
        <SummaryCard
          icon={<Clock className="w-4 h-4" />}
          label="Upcoming"
          count={upcoming.length}
          color="text-amber-600"
          bgColor="bg-warning-light border-amber-200"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Completed"
          count={completed.length}
          color="text-green-600"
          bgColor="bg-success-light border-green-200"
        />
      </div>

      {/* Tabs & List */}
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
            currentList.map((fu) => (
              <FollowUpRow
                key={fu.id}
                followUp={fu}
                onComplete={() => setCompleting(fu.id)}
              />
            ))
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!completing}
        onClose={() => setCompleting(null)}
        onConfirm={handleComplete}
        title="Complete Follow-up"
        message="Mark this follow-up as completed?"
        confirmLabel="Complete"
        variant="primary"
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Follow-up" maxWidth="max-w-xl">
        <CreateFollowUpForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
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
  const tc = typeConfig[followUp.type];
  const isOverdue = followUp.status === 'overdue';
  const isCompleted = followUp.status === 'completed';

  return (
    <div className={cn(
      'flex items-start gap-4 px-5 py-4 transition-colors hover:bg-bg-primary/30',
      isOverdue && 'bg-danger-light/30'
    )}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', tc.color)}>
        {tc.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-text-primary">{followUp.title}</p>
          <Badge variant="default">{tc.label}</Badge>
          <PriorityBadge priority={followUp.priority} />
        </div>
        <p className="text-xs text-text-secondary mt-1">{followUp.description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          <Link to={`/leads/${followUp.leadId}`} className="hover:text-accent transition-colors">
            {followUp.leadName} · {followUp.company}
          </Link>
          <span>·</span>
          <span className={isOverdue ? 'text-danger font-medium' : ''}>
            {isOverdue ? 'Overdue: ' : isCompleted ? 'Completed: ' : 'Due: '}
            {formatDate(isCompleted && followUp.completedAt ? followUp.completedAt : followUp.dueDate)}
          </span>
          <span>·</span>
          <span>{followUp.assignedTo}</span>
        </div>
      </div>
      {!isCompleted && (
        <Button variant="ghost" size="sm" onClick={onComplete} className="shrink-0">
          <Check className="w-3.5 h-3.5" /> Done
        </Button>
      )}
      {isCompleted && (
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
      )}
    </div>
  );
}

// ─── Create Follow-up Form ───

function CreateFollowUpForm({ onSubmit, onCancel }: {
  onSubmit: (data: Omit<FollowUp, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [leadId, setLeadId] = useState('');
  const [type, setType] = useState<FollowUpType>('call');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [assignedTo, setAssignedTo] = useState(teamMembers[0].name);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getLeads().then((data) => {
      setLeads(data);
      if (data.length > 0) setLeadId(data[0].id);
      setLoading(false);
    });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!leadId) errs.leadId = 'Select a lead';
    if (!title.trim()) errs.title = 'Title is required';
    if (!dueDate) errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead) { toast.error('Selected lead not found'); return; }

    setSubmitting(true);
    try {
      const dueDateISO = new Date(dueDate).toISOString();
      const now = new Date();
      const status = new Date(dueDate) < now ? 'overdue' : 'upcoming';

      await onSubmit({
        leadId,
        leadName: lead.fullName,
        company: lead.company,
        type,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDateISO,
        status,
        priority,
        assignedTo,
      });
    } catch {
      toast.error('Failed to create follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Lead"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          options={leads.map((l) => ({ value: l.id, label: `${l.fullName} — ${l.company}` }))}
          error={errors.leadId}
        />
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as FollowUpType)}
          options={[
            { value: 'call', label: 'Call' },
            { value: 'email', label: 'Email' },
            { value: 'meeting', label: 'Meeting' },
            { value: 'demo', label: 'Demo' },
            { value: 'proposal', label: 'Proposal' },
          ]}
        />
        <div className="sm:col-span-2">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Follow-up title"
            error={errors.title}
          />
        </div>
        <Input
          label="Due Date"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={errors.dueDate}
        />
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as typeof priority)}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]}
        />
        <div className="sm:col-span-2">
          <Select
            label="Assigned To"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            options={teamMembers.map((m) => ({ value: m.name, label: m.name }))}
          />
        </div>
      </div>
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Details about this follow-up..."
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>Create Follow-up</Button>
      </div>
    </form>
  );
}
