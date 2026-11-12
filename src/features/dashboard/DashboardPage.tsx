import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserPlus, UserCheck, CalendarClock, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowRight, Brain, Clock
} from 'lucide-react';
import { Card, Badge, PriorityBadge, LoadingSpinner } from '../../components/ui';
import { SimpleAreaChart, DonutChart } from '../../components/charts';
import { salesPerformanceData, dailySalesSummary } from '../../data/mockData';
import * as api from '../../services/mockService';
import { formatCurrency, formatRelativeTime } from '../../utils';
import type { DashboardMetrics, FollowUp, Activity } from '../../types';

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [statusDist, setStatusDist] = useState<{ status: string; count: number; color: string }[]>([]);
  const [sourceDist, setSourceDist] = useState<{ source: string; count: number; percentage: number }[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [recentActs, setRecentActs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [m, fups, acts] = await Promise.all([
        api.getDashboardMetrics(),
        api.getFollowUps(),
        api.getAllActivities(),
      ]);
      setMetrics(m);
      setFollowUps(fups);
      setRecentActs(acts.slice(0, 6));
      setStatusDist(api.getLeadStatusDistribution());
      setSourceDist(api.getLeadSourceDistribution());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!metrics) return null;

  const upcomingFollowUps = followUps
    .filter((f) => f.status === 'upcoming' || f.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Sales performance overview</p>
        </div>
        <div className="text-xs text-text-muted">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={<Users className="w-4 h-4" />} label="Total Leads" value={metrics.totalLeads.toString()} color="text-accent" />
        <MetricCard icon={<UserPlus className="w-4 h-4" />} label="New Leads" value={metrics.newLeads.toString()} color="text-blue-600" />
        <MetricCard icon={<UserCheck className="w-4 h-4" />} label="Converted" value={metrics.convertedCustomers.toString()} color="text-green-600" />
        <MetricCard icon={<CalendarClock className="w-4 h-4" />} label="Pending Follow-ups" value={metrics.pendingFollowUps.toString()} color="text-amber-600" />
        <MetricCard icon={<AlertTriangle className="w-4 h-4" />} label="Overdue" value={metrics.overdueFollowUps.toString()} color="text-red-600" alert />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Conversion Rate" value={`${metrics.conversionRate}%`} color="text-teal" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Performance — spans 2 cols */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Sales Performance</h2>
              <p className="text-xs text-text-muted mt-0.5">Leads and revenue over the last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Leads</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal" /> Revenue</span>
            </div>
          </div>
          <SimpleAreaChart
            data={salesPerformanceData}
            xKey="month"
            areas={[
              { key: 'leads', color: '#4263D8', name: 'Leads' },
              { key: 'revenue', color: '#0D9488', name: 'Revenue ($)' },
            ]}
            height={260}
          />
        </Card>

        {/* Lead Status Distribution */}
        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-1">Lead Status</h2>
          <p className="text-xs text-text-muted mb-2">Distribution across pipeline stages</p>
          <DonutChart
            data={statusDist.map((d) => ({ name: d.status, value: d.count, color: d.color }))}
            height={200}
          />
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Pipeline Value</span>
              <span className="font-semibold text-text-primary">{formatCurrency(metrics.totalDealValue)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lead Sources */}
        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Lead Sources</h2>
          <div className="space-y-2.5">
            {sourceDist.map((source) => (
              <div key={source.source} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-primary font-medium">{source.source}</span>
                    <span className="text-xs text-text-muted">{source.count}</span>
                  </div>
                  <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                    <div className="h-full bg-accent/70 rounded-full" style={{ width: `${source.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
            <Link to="/leads" className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActs.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full bg-bg-primary border border-border flex items-center justify-center">
                    <ActivityIcon type={activity.type} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{activity.title}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{activity.createdBy} · {formatRelativeTime(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Follow-ups */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Upcoming Follow-ups</h2>
            <Link to="/follow-ups" className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {upcomingFollowUps.map((fu) => (
              <div key={fu.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border-light hover:bg-bg-primary/50 transition-colors">
                <div className="shrink-0 mt-0.5">
                  <Clock className={`w-3.5 h-3.5 ${fu.status === 'overdue' ? 'text-danger' : 'text-text-muted'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{fu.title}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{fu.leadName} · {fu.company}</p>
                </div>
                <div className="shrink-0">
                  {fu.status === 'overdue' ? (
                    <Badge variant="danger">Overdue</Badge>
                  ) : (
                    <PriorityBadge priority={fu.priority} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Summary Section */}
      <Card className="border-l-2 border-l-accent">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Brain className="w-4.5 h-4.5 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-sm font-semibold text-text-primary">AI Daily Summary</h2>
              <Badge variant="info">Preview</Badge>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{dailySalesSummary}</p>
            <Link to="/ai" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent hover:underline">
              Open AI Workspace <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Sub-components ───

function MetricCard({ icon, label, value, color, change, alert }: {
  icon: React.ReactNode; label: string; value: string; color: string; change?: string; alert?: boolean;
}) {
  return (
    <div className={`bg-bg-surface border border-border rounded-xl p-4 ${alert && parseInt(value) > 0 ? 'border-l-2 border-l-danger' : ''}`}>
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
      {change && <p className="text-[11px] text-green-600 mt-1">{change}</p>}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconMap: Record<string, string> = {
    call: '📞',
    email: '✉️',
    meeting: '🤝',
    note: '📝',
    'status-change': '→',
    'deal-update': '$',
  };
  return <span className="text-xs">{iconMap[type] || '•'}</span>;
}
