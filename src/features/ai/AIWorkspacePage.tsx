import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Sparkles, Send, ArrowUpRight, Zap
} from 'lucide-react';
import {
  Card, Button, Badge, Avatar, Tabs, LoadingSpinner
} from '../../components/ui';
import * as api from '../../services/mockService';
import { sampleAIQuestions } from '../../data/mockData';
import type { AIInsight, ChatMessage } from '../../types';

export function AIWorkspacePage() {
  const [activeTab, setActiveTab] = useState('insights');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hello! I\'m your SignalDesk AI assistant. I can help you analyze your pipeline, identify high-priority leads, suggest follow-up strategies, and summarize sales activities. What would you like to know?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [responding, setResponding] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAllAIInsights().then((data) => {
      setInsights(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || responding) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setResponding(true);

    try {
      const response = await api.askAI(q);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" /> AI Workspace
          </h1>
          <p className="text-sm text-text-muted mt-0.5">AI-powered intelligence for your sales pipeline</p>
        </div>
        <Badge variant="info">Preview Mode</Badge>
      </div>

      <Tabs
        tabs={[
          { id: 'insights', label: 'Lead Intelligence' },
          { id: 'chat', label: 'CRM Assistant' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'insights' && (
        <InsightsView insights={insights} loading={loading} />
      )}

      {activeTab === 'chat' && (
        <ChatView
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          responding={responding}
          chatEndRef={chatEndRef}
        />
      )}
    </div>
  );
}

function InsightsView({ insights, loading }: { insights: AIInsight[]; loading: boolean }) {
  if (loading) return <LoadingSpinner />;

  const sorted = [...insights].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      {/* Top Scores Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.slice(0, 3).map((insight) => (
          <Card key={insight.leadId} className="border-l-2 border-l-accent">
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
          </Card>
        ))}
      </div>

      {/* Full Insights Table */}
      <Card padding={false}>
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">All Lead Intelligence</h3>
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
                <tr key={insight.leadId} className="border-b border-border-light hover:bg-bg-primary/30">
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
                      {insight.riskFactors.slice(0, 2).map((r, i) => (
                        <Badge key={i} variant="danger">{r}</Badge>
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

function ChatView({ messages, input, onInputChange, onSend, responding, chatEndRef }: {
  messages: ChatMessage[]; input: string; onInputChange: (v: string) => void;
  onSend: (q?: string) => void; responding: boolean; chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Chat Area */}
      <Card padding={false} className="lg:col-span-3 flex flex-col" style={{ height: 'calc(100vh - 260px)' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-accent" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-bg-primary border border-border-light text-text-primary'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === 'user' && <Avatar name="Sarah Mitchell" size="sm" />}
            </div>
          ))}
          {responding && (
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

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder="Ask about your pipeline, leads, or sales strategy..."
              className="flex-1 rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <Button onClick={() => onSend()} disabled={!input.trim() || responding}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Suggested Questions */}
      <div className="space-y-3">
        <Card>
          <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Suggested Questions
          </h3>
          <div className="space-y-1.5">
            {sampleAIQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSend(q)}
                className="w-full text-left text-xs text-text-secondary hover:text-accent hover:bg-accent-light px-3 py-2 rounded-lg transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>
        <Card className="border-l-2 border-l-amber-400">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="font-semibold text-text-secondary">Preview mode:</span> AI responses use sample data. Real AI integration will be connected in Phase B.
          </p>
        </Card>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
  return <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-semibold ${color}`}>{score}</span>;
}
