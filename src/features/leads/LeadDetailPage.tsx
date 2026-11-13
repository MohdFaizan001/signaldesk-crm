import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Building2, Pencil, Trash2,
  Calendar, Clock, Brain, ChevronRight, ExternalLink, User, Plus,
  Video, StickyNote, Sparkles, Loader2, Send
} from 'lucide-react';
import {
  Button, Card, StatusBadge, PriorityBadge, Avatar, Badge, Tabs,
  Dialog, ConfirmDialog, LoadingSpinner, Input, Textarea, EmptyState
} from '../../components/ui';
import { LeadForm } from './LeadForm';
import {
  useActivities,
  useCreateActivity,
  useDeleteLead,
  useEmailDraft,
  useGenerateInsight,
  useLeadInsight,
  useLeadQuery,
  useProfiles,
  useSendEmail,
  useUpdateLead,
} from '../../hooks';
import { useAuth } from '../../auth/AuthProvider';
import { formatDate, formatRelativeTime, formatCurrency, sourceLabels } from '../../utils';
import { toast } from 'sonner';
import type { Activity, AIInsight } from '../../types';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: profiles = [] } = useProfiles();

  const { data: lead, isLoading, isError, error } = useLeadQuery(id);
  const { data: activities = [] } = useActivities(id);
  const { data: aiInsight = null } = useLeadInsight(id);

  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const generateInsight = useGenerateInsight(id ?? '');
  const createActivity = useCreateActivity(id ?? '');
  const emailDraft = useEmailDraft();
  const sendEmail = useSendEmail();

  const [activeTab, setActiveTab] = useState('activity');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [draft, setDraft] = useState<{ to: string; subject: string; body: string } | null>(null);

  if (isLoading) return <LoadingSpinner />;

  if (isError || !lead) {
    return (
      <EmptyState
        icon={<User className="w-5 h-5" />}
        title="Lead not found"
        description={error instanceof Error ? error.message : 'This lead does not exist or you do not have access to it.'}
        action={<Link to="/leads" className="text-accent text-sm">Back to Leads</Link>}
      />
    );
  }

  const openEmailDraft = async () => {
    setShowEmail(true);
    try {
      const result = await emailDraft.mutateAsync(lead.id);
      setDraft({ to: result.to, subject: result.subject, body: result.body });
    } catch {
      // toast handled by hook-less mutation; show inline error via draft null
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/leads" className="flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors">
          <ArrowLeft className="w-4 h-4" /> Leads
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-text-primary font-medium">{lead.fullName}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={lead.fullName} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{lead.fullName}</h1>
            <p className="text-sm text-text-secondary">{lead.jobTitle} at {lead.company}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              {lead.dealValue ? <Badge variant="default">{formatCurrency(lead.dealValue)}</Badge> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <Card>
            <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Contact Information</h3>
            <div className="space-y-3">
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone || '—'} />
              {lead.website && <InfoRow icon={<Globe className="w-4 h-4" />} label="Website" value={lead.website} />}
              {lead.location && <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={lead.location} />}
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Lead Details</h3>
            <div className="space-y-3">
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company" value={lead.company} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Assigned To" value={lead.assignedTo} />
              <InfoRow icon={<ExternalLink className="w-4 h-4" />} label="Source" value={sourceLabels[lead.source]} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Created" value={formatDate(lead.createdAt)} />
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Last Updated" value={formatRelativeTime(lead.updatedAt)} />
            </div>
          </Card>

          {lead.tags && lead.tags.length > 0 && (
            <Card>
              <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => <Badge key={tag} variant="default">{tag}</Badge>)}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 pt-1 gap-2 flex-wrap">
              <Tabs
                tabs={[
                  { id: 'activity', label: 'Activity', count: activities.length },
                  { id: 'ai', label: 'AI Intelligence' },
                  { id: 'notes', label: 'Notes' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              {activeTab === 'activity' && (
                <Button size="sm" variant="secondary" onClick={() => setShowAddActivity(true)}>
                  <Plus className="w-3.5 h-3.5" /> Log Activity
                </Button>
              )}
              {activeTab === 'ai' && (
                <Button size="sm" variant="secondary" onClick={() => generateInsight.mutate()} loading={generateInsight.isPending}>
                  <Sparkles className="w-3.5 h-3.5" /> {aiInsight ? 'Regenerate' : 'Generate'}
                </Button>
              )}
            </div>
            <div className="p-5">
              {activeTab === 'activity' && <ActivityTimeline activities={activities} />}
              {activeTab === 'ai' && (
                <AISection
                  insight={aiInsight}
                  loading={generateInsight.isPending}
                  onGenerate={() => generateInsight.mutate()}
                  onDraftEmail={openEmailDraft}
                />
              )}
              {activeTab === 'notes' && (
                <div className="text-sm text-text-secondary">
                  {lead.notes || <span className="text-text-muted italic">No notes added yet.</span>}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead" maxWidth="max-w-xl">
        <LeadForm
          lead={lead}
          profiles={profiles}
          currentUserId={profile?.id ?? ''}
          isAdmin={profile?.role === 'admin'}
          onSubmit={async (input) => {
            await updateLead.mutateAsync({ id: lead.id, input });
            setShowEdit(false);
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Dialog>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          await deleteLead.mutateAsync(lead.id);
          navigate('/leads');
        }}
        title="Delete Lead"
        message={`Delete ${lead.fullName}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLead.isPending}
      />

      <Dialog open={showAddActivity} onClose={() => setShowAddActivity(false)} title="Log Activity" maxWidth="max-w-md">
        <AddActivityForm
          onSubmit={async (input) => {
            await createActivity.mutateAsync(input);
            setShowAddActivity(false);
          }}
          onCancel={() => setShowAddActivity(false)}
        />
      </Dialog>

      <Dialog open={showEmail} onClose={() => { setShowEmail(false); setDraft(null); }} title="Email Draft" maxWidth="max-w-xl">
        {emailDraft.isPending || !draft ? (
          <div className="py-8 flex flex-col items-center gap-2 text-sm text-text-muted">
            {emailDraft.isError ? (
              <p className="text-danger">{emailDraft.error instanceof Error ? emailDraft.error.message : 'Could not generate draft'}</p>
            ) : (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating draft…
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>To: <span className="text-text-primary">{draft.to}</span></span>
              <Badge variant={emailDraft.data?.provider === 'gemini' ? 'info' : 'warning'}>
                {emailDraft.data?.provider === 'gemini' ? 'Gemini draft' : 'Demo draft'}
              </Badge>
            </div>
            <Input label="Subject" value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} />
            <Textarea label="Body" rows={10} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowEmail(false); setDraft(null); }}>Close</Button>
              <Button
                loading={sendEmail.isPending}
                onClick={async () => {
                  try {
                    await sendEmail.mutateAsync({ leadId: lead.id, subject: draft.subject, body: draft.body });
                    setShowEmail(false);
                    setDraft(null);
                  } catch {
                    // The API returns EMAIL_NOT_CONFIGURED; hook shows the message.
                  }
                }}
              >
                <Send className="w-3.5 h-3.5" /> Send email
              </Button>
            </div>
            <p className="text-[11px] text-text-muted">
              Sending requires RESEND_API_KEY and RESEND_FROM_EMAIL on the server. If unconfigured, the draft is still available to copy.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted">{icon}</span>
      <div>
        <p className="text-[11px] text-text-muted">{label}</p>
        <p className="text-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return <p className="text-sm text-text-muted italic">No activity recorded yet.</p>;

  const typeStyles: Record<string, string> = {
    call: 'bg-blue-100 text-blue-700',
    email: 'bg-amber-100 text-amber-700',
    meeting: 'bg-emerald-100 text-emerald-700',
    note: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-0">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3 relative">
          {index < activities.length - 1 && <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />}
          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium z-10 ${typeStyles[activity.type] || 'bg-slate-100 text-slate-600'}`}>
            {activity.type[0].toUpperCase()}
          </div>
          <div className="flex-1 pb-5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary">{activity.title}</p>
              <Badge variant="default">{activity.type}</Badge>
            </div>
            {activity.description && <p className="text-xs text-text-secondary mt-1 whitespace-pre-wrap">{activity.description}</p>}
            <p className="text-[11px] text-text-muted mt-1.5">{activity.createdBy} · {formatRelativeTime(activity.occurredAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AISection({
  insight,
  loading,
  onGenerate,
  onDraftEmail,
}: {
  insight: AIInsight | null;
  loading: boolean;
  onGenerate: () => void;
  onDraftEmail: () => void;
}) {
  if (!insight) {
    return (
      <div className="text-center py-8">
        <Brain className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-muted">No AI insight generated for this lead yet.</p>
        <Button className="mt-3" size="sm" variant="secondary" loading={loading} onClick={onGenerate}>
          <Sparkles className="w-3.5 h-3.5" /> Generate insight
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-6 p-4 bg-bg-primary rounded-lg border border-border-light">
        <div className="text-center">
          <div className="text-3xl font-bold text-accent">{insight.score}</div>
          <p className="text-[11px] text-text-muted mt-0.5">Lead Score</p>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="text-center">
          <div className="text-3xl font-bold text-teal">{insight.conversionProbability}%</div>
          <p className="text-[11px] text-text-muted mt-0.5">Est. Conversion</p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-text-secondary">{insight.scoreExplanation}</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Summary</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{insight.summary}</p>
      </div>

      <div className="p-4 bg-accent-light rounded-lg border border-blue-200">
        <h4 className="text-xs font-semibold text-accent mb-1.5">Recommended Next Action</h4>
        <p className="text-sm text-text-primary">{insight.nextBestAction}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider">Suggested Follow-up Message</h4>
          <Button size="sm" variant="ghost" onClick={onDraftEmail}>
            <Mail className="w-3.5 h-3.5" /> Draft email
          </Button>
        </div>
        <div className="p-4 bg-bg-primary rounded-lg border border-border-light text-sm text-text-secondary italic leading-relaxed whitespace-pre-wrap">
          {insight.followUpMessage}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Risk Factors</h4>
          <ul className="space-y-1.5">
            {insight.riskFactors.map((risk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Positive Signals</h4>
          <ul className="space-y-1.5">
            {insight.opportunities.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {insight.missingInformation.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Missing Information</h4>
          <ul className="space-y-1.5">
            {insight.missingInformation.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
        <Badge variant={insight.provider === 'gemini' ? 'info' : 'warning'}>
          {insight.provider === 'gemini' ? `Gemini · ${insight.model}` : 'Demo/mock output — not real AI'}
        </Badge>
        <span className="text-[11px] text-text-muted">
          Snapshot from {formatRelativeTime(insight.createdAt)} · never applied to CRM records automatically
        </span>
      </div>
    </div>
  );
}

const activityTypeOptions = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Video },
  { value: 'note', label: 'Note', icon: StickyNote },
] as const;

function AddActivityForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { type: Activity['type']; title: string; description: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<Activity['type']>('call');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!description.trim()) nextErrors.description = 'Description is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ type, title: title.trim(), description: description.trim() });
    } catch {
      toast.error('Could not record activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Activity Type</label>
        <div className="flex gap-2 flex-wrap">
          {activityTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                type === option.value
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-border text-text-secondary hover:bg-bg-primary'
              }`}
            >
              <option.icon className="w-3.5 h-3.5" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Discovery call completed"
        error={errors.title}
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        placeholder="What happened?"
        error={errors.description}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>Log Activity</Button>
      </div>
    </form>
  );
}
