import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Building2, Pencil, Trash2,
  Calendar, Clock, Brain, ChevronRight, ExternalLink, User, Plus,
  Video, StickyNote
} from 'lucide-react';
import {
  Button, Card, StatusBadge, PriorityBadge, Avatar, Badge, Tabs,
  Dialog, ConfirmDialog, LoadingSpinner, Input, Textarea
} from '../../components/ui';
import { LeadForm } from './LeadForm';
import { useLeads } from '../../hooks';
import * as api from '../../services/mockService';
import { formatDate, formatRelativeTime, formatCurrency, sourceLabels } from '../../utils';
import { currentUser } from '../../data/mockData';
import { toast } from 'sonner';
import type { Lead, Activity, AIInsight } from '../../types';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchLeads, editLead, removeLead } = useLeads();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchLeads();
      if (id) {
        const [leadData, acts, insight] = await Promise.all([
          api.getLeadById(id),
          api.getActivitiesByLead(id),
          api.getAIInsight(id),
        ]);
        if (leadData) setLead(leadData);
        setActivities(acts);
        if (insight) setAiInsight(insight);
      }
      setLoading(false);
    }
    load();
  }, [id, fetchLeads]);

  if (loading) return <LoadingSpinner />;
  if (!lead) return (
    <div className="text-center py-20">
      <p className="text-text-muted">Lead not found</p>
      <Link to="/leads" className="text-accent text-sm mt-2 inline-block">Back to Leads</Link>
    </div>
  );

  const handleEdit = async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    await editLead(lead.id, data);
    setLead({ ...lead, ...data, updatedAt: new Date().toISOString() });
    setShowEdit(false);
  };

  const handleDelete = async () => {
    await removeLead(lead.id);
    navigate('/leads');
  };

  const handleAddActivity = async (data: Omit<Activity, 'id'>) => {
    const created = await api.createActivity(data);
    setActivities((prev) => [created, ...prev]);
    setShowAddActivity(false);
    toast.success('Activity recorded');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/leads" className="flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors">
          <ArrowLeft className="w-4 h-4" /> Leads
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-text-primary font-medium">{lead.fullName}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={lead.fullName} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{lead.fullName}</h1>
            <p className="text-sm text-text-secondary">{lead.jobTitle} at {lead.company}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              {lead.dealValue && <Badge variant="default">{formatCurrency(lead.dealValue)}</Badge>}
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column — Info */}
        <div className="space-y-5">
          <Card>
            <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Contact Information</h3>
            <div className="space-y-3">
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone} />
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

        {/* Right Column — Activity & AI */}
        <div className="lg:col-span-2 space-y-5">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 pt-1">
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
            </div>
            <div className="p-5">
              {activeTab === 'activity' && <ActivityTimeline activities={activities} />}
              {activeTab === 'ai' && <AISection insight={aiInsight} />}
              {activeTab === 'notes' && (
                <div className="text-sm text-text-secondary">
                  {lead.notes || <span className="text-text-muted italic">No notes added yet.</span>}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead" maxWidth="max-w-xl">
        <LeadForm lead={lead} onSubmit={handleEdit} onCancel={() => setShowEdit(false)} />
      </Dialog>
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Delete ${lead.fullName}? This cannot be undone.`}
        confirmLabel="Delete"
      />
      <Dialog open={showAddActivity} onClose={() => setShowAddActivity(false)} title="Log Activity" maxWidth="max-w-md">
        <AddActivityForm leadId={lead.id} onSubmit={handleAddActivity} onCancel={() => setShowAddActivity(false)} />
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
    'status-change': 'bg-purple-100 text-purple-700',
    'deal-update': 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="space-y-0">
      {activities.map((a, i) => (
        <div key={a.id} className="flex gap-3 relative">
          {i < activities.length - 1 && (
            <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />
          )}
          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium z-10 ${typeStyles[a.type] || 'bg-slate-100 text-slate-600'}`}>
            {a.type[0].toUpperCase()}
          </div>
          <div className="flex-1 pb-5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary">{a.title}</p>
              <Badge variant="default">{a.type}</Badge>
            </div>
            <p className="text-xs text-text-secondary mt-1">{a.description}</p>
            <p className="text-[11px] text-text-muted mt-1.5">{a.createdBy} · {formatRelativeTime(a.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AISection({ insight }: { insight: AIInsight | null }) {
  if (!insight) return (
    <div className="text-center py-8">
      <Brain className="w-8 h-8 text-text-muted mx-auto mb-2" />
      <p className="text-sm text-text-muted">AI insights are not available for this lead yet.</p>
      <p className="text-xs text-text-muted mt-1">Insights are generated for leads with sufficient engagement data.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className="flex items-center gap-6 p-4 bg-bg-primary rounded-lg border border-border-light">
        <div className="text-center">
          <div className="text-3xl font-bold text-accent">{insight.score}</div>
          <p className="text-[11px] text-text-muted mt-0.5">Lead Score</p>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="text-center">
          <div className="text-3xl font-bold text-teal">{insight.conversionProbability}%</div>
          <p className="text-[11px] text-text-muted mt-0.5">Conversion Probability</p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-text-secondary">{insight.scoreExplanation}</p>
        </div>
      </div>

      {/* Summary */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Summary</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{insight.summary}</p>
      </div>

      {/* Next Action */}
      <div className="p-4 bg-accent-light rounded-lg border border-blue-200">
        <h4 className="text-xs font-semibold text-accent mb-1.5">Recommended Next Action</h4>
        <p className="text-sm text-text-primary">{insight.nextBestAction}</p>
      </div>

      {/* Follow-up Message */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Suggested Follow-up Message</h4>
        <div className="p-4 bg-bg-primary rounded-lg border border-border-light text-sm text-text-secondary italic leading-relaxed">
          {insight.followUpMessage}
        </div>
      </div>

      {/* Risk & Opportunities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Risk Factors</h4>
          <ul className="space-y-1.5">
            {insight.riskFactors.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Opportunities</h4>
          <ul className="space-y-1.5">
            {insight.opportunities.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <Badge variant="info">AI-generated preview — backend integration pending</Badge>
      </div>
    </div>
  );
}

// ─── Add Activity Form ───

const activityTypeOptions = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Video },
  { value: 'note', label: 'Note', icon: StickyNote },
];

function AddActivityForm({ leadId, onSubmit, onCancel }: {
  leadId: string;
  onSubmit: (data: Omit<Activity, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<Activity['type']>('call');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        leadId,
        type,
        title: title.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
      });
    } catch {
      // handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector buttons */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Activity Type</label>
        <div className="flex gap-2">
          {activityTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value as Activity['type'])}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                type === opt.value
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-border text-text-secondary hover:bg-bg-primary'
              }`}
            >
              <opt.icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Discovery call completed"
        error={errors.title}
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
