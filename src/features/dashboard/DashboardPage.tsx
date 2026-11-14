import { Link } from 'react-router-dom';
import {
  Users, UserPlus, UserCheck, CalendarClock, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowRight, Brain, Clock, AlertCircle
} from 'lucide-react';
import { Card, Badge, PriorityBadge, EmptyState } from '../../components/ui';
import { SimpleAreaChart, DonutChart, CHART_COLORS } from '../../components/charts';
import {
  useDailySummary,
  useDashboardActivity,
  useDashboardPipeline,
  useDashboardSources,
  useDashboardSummary,
} from '../../hooks';
import { formatCurrency, formatRelativeTime, formatDate, sourceLabels } from '../../utils';

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const activityQuery = useDashboardActivity();
  const sourcesQuery = useDashboardSources();
  const pipelineQuery = useDashboardPipeline();
  const dailySummaryQuery = useDailySummary();

  const summary = summaryQuery.data;
  const activity = activityQuery.data ?? [];
  const sources = sourcesQuery.data ?? [];
  const pipeline = pipelineQuery.data ?? [];

  if (summaryQuery.isLoading) {
    return <div className="p-8 text-center text-sm text-text-muted">Loading dashboard…</div>;
  }

  if (summaryQuery.isError || !summary) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-5 h-5" />}
        title="Could not load dashboard"
        description={summaryQuery.error instanceof Error ? summaryQuery.error.message : 'The API request failed.'}
      />
    );
  }

  const statusDist = pipeline.map((point, index) => ({
    name: point.label,
    value: point.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Sales performance overview</p>
        </div>
        <div className="text-xs text-text-muted">
          Last updated: {formatDate(new Date().toISOString())}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={<Users className="w-4 h-4" />} label="Total Leads" value={summary.totalLeads.toString()} color="text-accent" />
        <MetricCard icon={<UserPlus className="w-4 h-4" />} label="New Leads" value={summary.newLeads.toString()} color="text-blue-600" />
        <MetricCard icon={<UserCheck className="w-4 h-4" />} label="Converted" value={summary.convertedCustomers.toString()} color="text-green-600" />
        <MetricCard icon={<CalendarClock className="w-4 h-4" />} label="Pending Follow-ups" value={summary.pendingFollowUps.toString()} color="text-amber-600" />
        <MetricCard icon={<AlertTriangle className="w-4 h-4" />} label="Overdue" value={summary.overdueFollowUps.toString()} color="text-red-600" alert />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Conversion Rate" value={`${summary.conversionRate}%`} color="text-teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
            data={activity as unknown as Record<string, unknown>[]}
            xKey="month"
            areas={[
              { key: 'leads', color: '#4263D8', name: 'Leads' },
              { key: 'revenue', color: '#0D9488', name: 'Revenue ($)' },
            ]}
            height={260}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-1">Lead Status</h2>
          <p className="text-xs text-text-muted mb-2">Distribution across pipeline stages</p>
          {statusDist.some((item) => item.value > 0) ? (
            <DonutChart data={statusDist} height={200} />
          ) : (
            <p className="py-10 text-center text-xs text-text-muted">No leads yet.</p>
          )}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Pipeline Value</span>
              <span className="font-semibold text-text-primary">{formatCurrency(summary.totalDealValue)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Lead Sources</h2>
          {sources.length === 0 ? (
            <p className="text-xs text-text-muted italic">No lead sources recorded.</p>
          ) : (
            <div className="space-y-2.5">
              {sources.map((source) => (
                <div key={source.source} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-primary font-medium">{sourceLabels[source.source] || source.source}</span>
                      <span className="text-xs text-text-muted">{source.count}</span>
                    </div>
                    <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                      <div className="h-full bg-accent/70 rounded-full" style={{ width: `${source.percentage}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
            <Link to="/leads" className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {summary.recentActivities.length === 0 ? (
            <p className="text-xs text-text-muted italic">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.recentActivities.slice(0, 5).map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-7 h-7 rounded-full bg-bg-primary border border-border flex items-center justify-center">
                      <ActivityIcon type={item.type} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{item.title}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{item.createdBy} · {formatRelativeTime(item.occurredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Upcoming Follow-ups</h2>
            <Link to="/follow-ups" className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {summary.upcomingFollowUps.length === 0 ? (
            <p className="text-xs text-text-muted italic">No open follow-ups.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.upcomingFollowUps.slice(0, 5).map((followUp) => (
                <div key={followUp.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border-light hover:bg-bg-primary/50 transition-colors">
                  <div className="shrink-0 mt-0.5">
                    <Clock className={`w-3.5 h-3.5 ${followUp.status === 'overdue' ? 'text-danger' : 'text-text-muted'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{followUp.title}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{followUp.leadName} · {followUp.company}</p>
                  </div>
                  <div className="shrink-0">
                    {followUp.status === 'overdue' ? <Badge variant="danger">Overdue</Badge> : <PriorityBadge priority={followUp.priority} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="border-l-2 border-l-accent">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Brain className="w-4.5 h-4.5 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-sm font-semibold text-text-primary">AI Daily Summary</h2>
              {dailySummaryQuery.data ? (
                <Badge variant={dailySummaryQuery.data.provider === 'gemini' ? 'info' : 'warning'}>
                  {dailySummaryQuery.data.provider === 'gemini' ? `Gemini · ${dailySummaryQuery.data.model}` : 'Demo output — not Gemini'}
                </Badge>
              ) : (
                <Badge variant="muted">Unavailable</Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {dailySummaryQuery.isLoading
                ? 'Generating daily summary…'
                : dailySummaryQuery.data?.summary ||
                  (dailySummaryQuery.error instanceof Error
                    ? dailySummaryQuery.error.message
                    : 'Daily summary is unavailable right now.')}
            </p>
            {dailySummaryQuery.data && (
              <p className="text-[11px] text-text-muted mt-2">
                Generated {formatRelativeTime(dailySummaryQuery.data.generatedAt)} from live CRM metrics.
              </p>
            )}
            <Link to="/ai" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent hover:underline">
              Open AI Workspace <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

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
  };
  return <span className="text-xs">{iconMap[type] || '•'}</span>;
}
