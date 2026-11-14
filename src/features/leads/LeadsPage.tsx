import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, ArrowUpDown, X, AlertCircle
} from 'lucide-react';
import {
  Button, Card, StatusBadge, PriorityBadge, Avatar, SearchInput,
  Dialog, ConfirmDialog, Dropdown, DropdownItem, LoadingSpinner, EmptyState
} from '../../components/ui';
import { LeadForm } from './LeadForm';
import {
  useCreateLead,
  useDebounce,
  useDeleteLead,
  useLeadsQuery,
  useProfiles,
  useUpdateLead,
} from '../../hooks';
import { useAuth } from '../../auth/AuthProvider';
import { formatDate, formatCurrency, sourceLabels } from '../../utils';
import type { Lead, LeadStatus, LeadPriority, LeadSource } from '../../types';
import type { LeadListParams } from '../../services/api';

const PAGE_SIZE = 8;
type SortField = 'fullName' | 'createdAt' | 'dealValue';
const sortMap: Record<SortField, NonNullable<LeadListParams['sortBy']>> = {
  fullName: 'full_name',
  createdAt: 'created_at',
  dealValue: 'deal_value',
};

export function LeadsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: profiles = [] } = useProfiles();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const params: LeadListParams = {
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    source: sourceFilter || undefined,
    page,
    pageSize: PAGE_SIZE,
    sortBy: sortMap[sortField],
    sortDir,
  };

  const { data, isLoading, isError, error, isFetching } = useLeadsQuery(params);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const leads = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasActiveFilters = Boolean(statusFilter || priorityFilter || sourceFilter);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSourceFilter('');
    setPage(1);
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-5 h-5" />}
        title="Could not load leads"
        description={error instanceof Error ? error.message : 'The API request failed.'}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Leads</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {total} lead{total === 1 ? '' : 's'} total
            {isFetching && <span className="ml-2 text-xs text-text-muted">updating…</span>}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      <Card padding={false} className="p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
            placeholder="Search leads by name, company, or email..."
            className="flex-1 min-w-[200px]"
          />
          <Button
            variant={hasActiveFilters ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && <span className="ml-1 w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
              {[statusFilter, priorityFilter, sourceFilter].filter(Boolean).length}
            </span>}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border-light">
            <FilterSelect
              value={statusFilter}
              onChange={(value) => { setStatusFilter(value as LeadStatus | ''); setPage(1); }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'interested', label: 'Interested' },
                { value: 'negotiation', label: 'Negotiation' },
                { value: 'converted', label: 'Converted' },
                { value: 'lost', label: 'Lost' },
              ]}
            />
            <FilterSelect
              value={priorityFilter}
              onChange={(value) => { setPriorityFilter(value as LeadPriority | ''); setPage(1); }}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <FilterSelect
              value={sourceFilter}
              onChange={(value) => { setSourceFilter(value as LeadSource | ''); setPage(1); }}
              options={[
                { value: '', label: 'All Sources' },
                ...Object.entries(sourceLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-xs text-text-muted hover:text-accent flex items-center gap-1 ml-2">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
        )}
      </Card>

      {leads.length === 0 ? (
        <EmptyState
          icon={<Search className="w-5 h-5" />}
          title="No leads found"
          description={total === 0 ? 'Create your first lead to get started.' : 'Try adjusting your search or filters.'}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-primary/50">
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs">
                    <button onClick={() => toggleSort('fullName')} className="flex items-center gap-1 hover:text-text-primary">
                      Name & Company <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs hidden sm:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs hidden lg:table-cell">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs hidden lg:table-cell">
                    <button onClick={() => toggleSort('dealValue')} className="flex items-center gap-1 hover:text-text-primary">
                      Deal Value <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs hidden xl:table-cell">Assigned</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs hidden xl:table-cell">
                    <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-text-primary">
                      Created <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border-light hover:bg-bg-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.fullName} size="sm" />
                        <div>
                          <p className="font-medium text-text-primary text-sm">{lead.fullName}</p>
                          <p className="text-xs text-text-muted">{lead.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-text-secondary">{lead.email}</p>
                      <p className="text-xs text-text-muted">{lead.phone}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><PriorityBadge priority={lead.priority} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-text-secondary">{sourceLabels[lead.source]}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-text-primary">
                      {lead.dealValue ? formatCurrency(lead.dealValue) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-text-secondary">{lead.assignedTo}</td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-text-muted">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div onClick={(event) => event.stopPropagation()}>
                        <Dropdown
                          trigger={
                            <button className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-text-primary">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          }
                        >
                          <DropdownItem onClick={() => navigate(`/leads/${lead.id}`)} icon={<Eye className="w-3.5 h-3.5" />}>View</DropdownItem>
                          <DropdownItem onClick={() => setEditingLead(lead)} icon={<Pencil className="w-3.5 h-3.5" />}>Edit</DropdownItem>
                          <DropdownItem onClick={() => setDeletingLead(lead)} variant="danger" icon={<Trash2 className="w-3.5 h-3.5" />}>Delete</DropdownItem>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-text-muted">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-bg-primary text-text-muted disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
                  const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                  return start + index;
                }).map((value) => (
                  <button
                    key={value}
                    onClick={() => setPage(value)}
                    className={`w-8 h-8 rounded text-xs font-medium ${
                      value === page ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-primary'
                    }`}
                  >
                    {value}
                  </button>
                ))}
                <button
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-bg-primary text-text-muted disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} title="Add New Lead" maxWidth="max-w-xl">
        <LeadForm
          profiles={profiles}
          currentUserId={profile?.id ?? ''}
          isAdmin={profile?.role === 'admin'}
          onSubmit={async (input) => {
            await createLead.mutateAsync(input);
            setShowAddDialog(false);
          }}
          onCancel={() => setShowAddDialog(false)}
        />
      </Dialog>

      <Dialog open={!!editingLead} onClose={() => setEditingLead(null)} title="Edit Lead" maxWidth="max-w-xl">
        {editingLead && (
          <LeadForm
            lead={editingLead}
            profiles={profiles}
            currentUserId={profile?.id ?? ''}
            isAdmin={profile?.role === 'admin'}
            onSubmit={async (input) => {
              await updateLead.mutateAsync({ id: editingLead.id, input });
              setEditingLead(null);
            }}
            onCancel={() => setEditingLead(null)}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deletingLead}
        onClose={() => setDeletingLead(null)}
        onConfirm={async () => {
          if (!deletingLead) return;
          await deleteLead.mutateAsync(deletingLead.id);
          setDeletingLead(null);
        }}
        title="Delete Lead"
        message={`Are you sure you want to delete ${deletingLead?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLead.isPending}
      />
    </div>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="text-xs border border-border rounded-lg px-3 py-1.5 bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}
