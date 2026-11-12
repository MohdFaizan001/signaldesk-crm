import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, ArrowUpDown, X
} from 'lucide-react';
import {
  Button, Card, StatusBadge, PriorityBadge, Avatar, SearchInput,
  Dialog, ConfirmDialog, Dropdown, DropdownItem, LoadingSpinner, EmptyState
} from '../../components/ui';
import { LeadForm } from './LeadForm';
import { useLeads } from '../../hooks';
import { formatDate, formatCurrency, sourceLabels } from '../../utils';
import type { Lead, LeadStatus, LeadPriority, LeadSource } from '../../types';

const PAGE_SIZE = 8;

export function LeadsPage() {
  const { leads, loading, fetchLeads, addLead, editLead, removeLead } = useLeads();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('');
  const [sortField, setSortField] = useState<'fullName' | 'createdAt' | 'dealValue'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = useMemo(() => {
    let result = [...leads];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.fullName.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((l) => l.status === statusFilter);
    if (priorityFilter) result = result.filter((l) => l.priority === priorityFilter);
    if (sourceFilter) result = result.filter((l) => l.source === sourceFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fullName') cmp = a.fullName.localeCompare(b.fullName);
      else if (sortField === 'dealValue') cmp = (a.dealValue || 0) - (b.dealValue || 0);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [leads, search, statusFilter, priorityFilter, sourceFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = statusFilter || priorityFilter || sourceFilter;

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleAdd = async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addLead(data);
    setShowAddDialog(false);
  };

  const handleEdit = async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingLead) {
      await editLead(editingLead.id, data);
      setEditingLead(null);
    }
  };

  const handleDelete = async () => {
    if (deletingLead) {
      await removeLead(deletingLead.id);
      setDeletingLead(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Leads</h1>
          <p className="text-sm text-text-muted mt-0.5">{filtered.length} leads total</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      {/* Search & Filters Bar */}
      <Card padding={false} className="p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
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

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border-light">
            <FilterSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v as LeadStatus | ''); setPage(1); }}
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
              onChange={(v) => { setPriorityFilter(v as LeadPriority | ''); setPage(1); }}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <FilterSelect
              value={sourceFilter}
              onChange={(v) => { setSourceFilter(v as LeadSource | ''); setPage(1); }}
              options={[
                { value: '', label: 'All Sources' },
                ...Object.entries(sourceLabels).map(([v, l]) => ({ value: v, label: l })),
              ]}
            />
            {hasActiveFilters && (
              <button
                onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSourceFilter(''); setPage(1); }}
                className="text-xs text-text-muted hover:text-accent flex items-center gap-1 ml-2"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Table */}
      {paginated.length === 0 ? (
        <EmptyState
          icon={<Search className="w-5 h-5" />}
          title="No leads found"
          description="Try adjusting your search or filters."
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
                {paginated.map((lead) => (
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
                      <div onClick={(e) => e.stopPropagation()}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-text-muted">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-bg-primary text-text-muted disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-xs font-medium ${
                      p === page ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-primary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Dialogs */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} title="Add New Lead" maxWidth="max-w-xl">
        <LeadForm onSubmit={handleAdd} onCancel={() => setShowAddDialog(false)} />
      </Dialog>

      <Dialog open={!!editingLead} onClose={() => setEditingLead(null)} title="Edit Lead" maxWidth="max-w-xl">
        {editingLead && <LeadForm lead={editingLead} onSubmit={handleEdit} onCancel={() => setEditingLead(null)} />}
      </Dialog>

      <ConfirmDialog
        open={!!deletingLead}
        onClose={() => setDeletingLead(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete ${deletingLead?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

// ─── Filter Select ───
function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-border rounded-lg px-3 py-1.5 bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
