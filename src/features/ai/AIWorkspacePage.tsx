import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Sparkles, Send, ArrowUpRight, Zap, Search, AlertCircle
} from 'lucide-react';
import {
  Card, Button, Badge, Avatar, Tabs, LoadingSpinner, EmptyState
} from '../../components/ui';
import { chatMessage } from '../../services/api';
import { useAiChat, useAiInsights, useAiSearch, useAiStatus } from '../../hooks';
import { useAuth } from '../../auth/AuthProvider';
import type { AIInsight, ChatMessage } from '../../types';

const suggestedQuestions = [
  'Which leads are most likely to convert this month?',
  'Summarize the health of my pipeline.',
  'Which follow-ups are overdue and what should I do next?',
  'What are the biggest risks in my active deals?',
];

export function AIWorkspacePage() {
  const [activeTab, setActiveTab] = useState('insights');
  const { data: insights = [], isLoading, isError, error } = useAiInsights();
  const { data: status } = useAiStatus();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" /> AI Workspace
          </h1>
          <p className="text-sm text-text-muted mt-0.5">AI-powered intelligence for your sales pipeline</p>
        </div>
        <ProviderBadge status={status} />
      </div>

      {status && (
        <div className={`rounded-lg border px-4 py-2.5 text-xs ${
          status.mode === 'gemini'
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}>
          {status.message}
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'insights', label: 'Lead Intelligence' },
          { id: 'chat', label: 'CRM Assistant' },
          { id: 'search', label: 'Smart Search' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'insights' && (
        <InsightsView insights={insights} loading={isLoading} isError={isError} error={error} />
      )}

      {activeTab === 'chat' && <ChatView />}

      {activeTab === 'search' && <SearchView />}
    </div>
  );
}

function ProviderBadge({ status }: { status?: { mode: 'gemini' | 'mock'; model: string } }) {
  if (!status) return <Badge variant="muted">Checking AI…</Badge>;
  return status.mode === 'gemini' ? (
    <Badge variant="info">Gemini · {status.model}</Badge>
  ) : (
    <Badge variant="warning">Demo mode — not Gemini</Badge>
  );
}

function InsightsView({
  insights,
  loading,
  isError,
  error,
}: {
  insights: AIInsight[];
  loading: boolean;
  isError: boolean;
  error: unknown;
}) {
  if (loading) return <LoadingSpinner />;

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-5 h-5" />}
        title="Could not load AI insights"
        description={error instanceof Error ? error.message : 'The API request failed.'}
      />
    );
  }

  if (insights.length === 0) {
    return (
      <EmptyState
        icon={<Brain className="w-5 h-5" />}
        title="No AI insights yet"
        description="Open a lead and generate an insight from the AI Intelligence tab. Insights are snapshots and never change CRM records automatically."
      />
    );
  }

  const sorted = [...insights].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.slice(0, 3).map((insight) => (
          <Card key={insight.id} className="border-l-2 border-l-accent">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Link to={`/leads/${insight.leadId}`} className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">
                  {insight.leadName}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-accent">{insight.score}</span>
                  <span className="text-xs text-text-muted">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-teal">{insight.conversionProbability}%</p>
                <p className="text-[10px] text-text-muted">conversion</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary line-clamp-2 mb-3">{insight.summary}</p>
            <div className="p-2.5 bg-accent-light rounded-md">
              <p className="text-xs text-accent font-medium flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> {insight.nextBestAction}
              </p>
            </div>
            <div className="mt-3">
              <Badge variant={insight.provider === 'gemini' ? 'info' : 'warning'}>
                {insight.provider === 'gemini' ? `Gemini · ${insight.model}` : 'Demo output'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card padding={false}>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">All Lead Intelligence</h3>
          <span className="text-[11px] text-text-muted">Append-only snapshots · no automatic CRM writes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-primary/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted">Lead</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-muted">Score</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-muted">Conversion %</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted hidden md:table-cell">Next Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted hidden lg:table-cell">Risk Factors</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((insight) => (
                <tr key={insight.id} className="border-b border-border-light hover:bg-bg-primary/30">
                  <td className="px-4 py-3">
                    <Link to={`/leads/${insight.leadId}`} className="text-sm font-medium text-text-primary hover:text-accent">
                      {insight.leadName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreBadge score={insight.score} />
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-text-primary">
                    {insight.conversionProbability}%
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary hidden md:table-cell max-w-[250px] truncate">
                    {insight.nextBestAction}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {insight.riskFactors.slice(0, 2).map((risk, index) => (
                        <Badge key={index} variant="danger">{risk}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/leads/${insight.leadId}`} className="text-xs text-accent hover:underline flex items-center gap-1">
                      View <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ChatView() {
  const { profile } = useAuth();
  const chat = useAiChat();
  const [messages, setMessages] = useState<ChatMessage[]>([
    chatMessage(
      'assistant',
      "Hello! I'm your SignalDesk AI assistant. I can help you analyze your pipeline, identify high-priority leads, suggest follow-up strategies, and summarize sales activities. What would you like to know?"
    ),
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const displayName = profile?.fullName || profile?.email || 'You';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (question?: string) => {
    const text = (question ?? input).trim();
    if (!text || chat.isPending) return;

    setMessages((previous) => [...previous, chatMessage('user', text)]);
    setInput('');

    try {
      const result = await chat.mutateAsync(text);
      setMessages((previous) => [...previous, chatMessage('assistant', result.answer, result.provider)]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        chatMessage(
          'assistant',
          error instanceof Error ? error.message : 'The assistant could not answer that question.'
        ),
      ]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <Card padding={false} className="lg:col-span-3 flex flex-col" style={{ height: 'calc(100vh - 260px)' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-accent" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-bg-primary border border-border-light text-text-primary'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.provider && (
                  <div className="mt-2">
                    <Badge variant={message.provider === 'gemini' ? 'info' : 'warning'}>
                      {message.provider === 'gemini' ? 'Gemini' : 'Demo answer'}
                    </Badge>
                  </div>
                )}
              </div>
              {message.role === 'user' && <Avatar name={displayName} size="sm" />}
            </div>
          ))}
          {chat.isPending && (
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-accent" />
              </div>
              <div className="bg-bg-primary border border-border-light rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleSend()}
              placeholder="Ask about your pipeline, leads, or sales strategy..."
              maxLength={500}
              className="flex-1 rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <Button onClick={() => void handleSend()} disabled={!input.trim() || chat.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Card>
          <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Suggested Questions
          </h3>
          <div className="space-y-1.5">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                onClick={() => void handleSend(question)}
                disabled={chat.isPending}
                className="w-full text-left text-xs text-text-secondary hover:text-accent hover:bg-accent-light px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </Card>
        <Card className="border-l-2 border-l-amber-400">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="font-semibold text-text-secondary">Read-only assistant:</span> answers are generated from
            your CRM metrics and do not modify leads, activities, or follow-ups.
          </p>
        </Card>
      </div>
    </div>
  );
}

function SearchView() {
  const search = useAiSearch();
  const [query, setQuery] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (text && !search.isPending) search.mutate(text);
  };

  const filters = search.data?.filters ?? {};

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Natural-language lead search</h3>
        <p className="text-xs text-text-muted mb-3">
          Ask in plain English. The AI only produces approved filter fields — never SQL — and the backend applies them to your leads.
        </p>
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. high priority leads from LinkedIn created in the last 30 days"
            maxLength={300}
            className="flex-1 rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <Button type="submit" loading={search.isPending} disabled={!query.trim()}>
            <Search className="w-4 h-4" /> Search
          </Button>
        </form>

        {search.isError && (
          <p className="mt-3 text-xs text-danger">
            {search.error instanceof Error ? search.error.message : 'Search failed.'}
          </p>
        )}

        {search.data && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Interpreted filters:</span>
            {Object.keys(filters).length === 0 ? (
              <span className="text-xs text-text-muted italic">none</span>
            ) : (
              Object.entries(filters).map(([key, value]) => (
                <Badge key={key} variant="default">{key}: {String(value)}</Badge>
              ))
            )}
            <Badge variant={search.data.provider === 'gemini' ? 'info' : 'warning'}>
              {search.data.provider === 'gemini' ? `Gemini · ${search.data.model}` : 'Demo parse'}
            </Badge>
          </div>
        )}
      </Card>

      {search.data && (
        <Card padding={false}>
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">
              Results ({search.data.pagination.total})
            </h3>
          </div>
          {search.data.items.length === 0 ? (
            <p className="px-5 py-6 text-sm text-text-muted">No leads matched those filters.</p>
          ) : (
            <div className="divide-y divide-border-light">
              {search.data.items.map((lead) => (
                <Link
                  key={lead.id}
                  to={`/leads/${lead.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-bg-primary/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{lead.fullName}</p>
                    <p className="text-xs text-text-muted">{lead.company} · {lead.assignedTo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{lead.status}</Badge>
                    <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
  return <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-semibold ${color}`}>{score}</span>;
}
