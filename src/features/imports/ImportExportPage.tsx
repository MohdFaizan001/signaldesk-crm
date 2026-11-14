import { useCallback, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, ArrowRight, X, FileUp, AlertCircle
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge, Tabs, Input, Select, LoadingSpinner } from '../../components/ui';
import { api, ApiError, type LeadInput } from '../../services/api';
import { sourceLabels } from '../../utils';
import { toast } from 'sonner';
import type { LeadPriority, LeadSource, LeadStatus } from '../../types';

type RawRow = Record<string, string>;

interface RowError {
  row: number;
  field: string;
  message: string;
}

interface ParsedRow {
  row: number;
  values: string[];
  data?: LeadInput;
  errors: RowError[];
}

const HEADER_MAP: Record<string, string> = {
  name: 'fullName',
  'full name': 'fullName',
  fullname: 'fullName',
  email: 'email',
  'e-mail': 'email',
  phone: 'phone',
  company: 'company',
  'job title': 'jobTitle',
  jobtitle: 'jobTitle',
  title: 'jobTitle',
  source: 'source',
  status: 'status',
  priority: 'priority',
  'deal value': 'dealValue',
  dealvalue: 'dealValue',
  value: 'dealValue',
  notes: 'notes',
  note: 'notes',
};

const SOURCE_VALUES: Record<string, LeadSource> = {
  website: 'website',
  referral: 'referral',
  linkedin: 'linkedin',
  'cold call': 'cold-call',
  'cold-call': 'cold-call',
  'email campaign': 'email-campaign',
  'email-campaign': 'email-campaign',
  'trade show': 'trade-show',
  'trade-show': 'trade-show',
  partner: 'partner',
};

const STATUS_VALUES: Record<string, LeadStatus> = {
  new: 'new',
  contacted: 'contacted',
  interested: 'interested',
  negotiation: 'negotiation',
  converted: 'converted',
  lost: 'lost',
};

const PRIORITY_VALUES: Record<string, LeadPriority> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ImportExportPage() {
  const [activeTab, setActiveTab] = useState('import');

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Import / Export</h1>
        <p className="text-sm text-text-muted mt-0.5">Import leads from CSV or export your data</p>
      </div>

      <Tabs
        tabs={[
          { id: 'import', label: 'Import' },
          { id: 'export', label: 'Export' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'import' && <ImportSection />}
      {activeTab === 'export' && <ExportSection />}
    </div>
  );
}

function ImportSection() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headerErrors, setHeaderErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.leads.importRows>> | null>(null);

  const validRows = useMemo(() => rows.filter((row) => row.data).map((row) => row.data as LeadInput), [rows]);
  const errorCount = useMemo(() => rows.filter((row) => row.errors.length > 0).length, [rows]);

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setHeaderErrors([]);
    setResult(null);
  };

  const processFile = useCallback((input: File) => {
    if (!input.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFile(input);
    setLoading(true);
    setResult(null);

    Papa.parse<RawRow>(input, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (parsed) => {
        const fields = (parsed.meta.fields ?? []).filter(Boolean);
        const mappedFields = fields.map((field) => HEADER_MAP[field.trim().toLowerCase()] ?? null);
        const missing = ['fullName', 'email', 'company'].filter((field) => !mappedFields.includes(field));

        if (missing.length > 0) {
          setHeaders(fields);
          setHeaderErrors(missing.map((field) => `Missing required column for "${field}".`));
          setRows([]);
          setLoading(false);
          return;
        }

        const duplicateEmails = new Set<string>();
        const seenEmails = new Set<string>();
        const parsedRows: ParsedRow[] = (parsed.data ?? [])
          .filter((raw) => Object.values(raw).some((value) => String(value ?? '').trim() !== ''))
          .map((raw, index) => {
            const rowNumber = index + 2;
            const errors: RowError[] = [];
            const readable: Record<string, string> = {};
            for (const [header, value] of Object.entries(raw)) {
              const key = HEADER_MAP[header.trim().toLowerCase()];
              if (key) readable[key] = String(value ?? '').trim();
            }

            const fullName = readable.fullName ?? '';
            const email = readable.email ?? '';
            const company = readable.company ?? '';

            if (fullName.length < 2) errors.push({ row: rowNumber, field: 'fullName', message: 'Name must be at least 2 characters.' });
            if (!EMAIL_PATTERN.test(email)) errors.push({ row: rowNumber, field: 'email', message: 'Valid email is required.' });
            if (!company) errors.push({ row: rowNumber, field: 'company', message: 'Company is required.' });

            const normalizedEmail = email.toLowerCase();
            if (EMAIL_PATTERN.test(email)) {
              if (seenEmails.has(normalizedEmail)) {
                duplicateEmails.add(normalizedEmail);
                errors.push({ row: rowNumber, field: 'email', message: 'Duplicate email inside this CSV.' });
              }
              seenEmails.add(normalizedEmail);
            }

            const source = SOURCE_VALUES[(readable.source ?? '').toLowerCase()] ?? 'website';
            if (readable.source && !SOURCE_VALUES[readable.source.toLowerCase()]) {
              errors.push({ row: rowNumber, field: 'source', message: `Unknown source "${readable.source}".` });
            }

            const status = STATUS_VALUES[(readable.status ?? '').toLowerCase()] ?? 'new';
            if (readable.status && !STATUS_VALUES[readable.status.toLowerCase()]) {
              errors.push({ row: rowNumber, field: 'status', message: `Unknown status "${readable.status}".` });
            }

            const priority = PRIORITY_VALUES[(readable.priority ?? '').toLowerCase()] ?? 'medium';
            if (readable.priority && !PRIORITY_VALUES[readable.priority.toLowerCase()]) {
              errors.push({ row: rowNumber, field: 'priority', message: `Unknown priority "${readable.priority}". Use low, medium, or high.` });
            }

            let dealValue: number | undefined;
            if (readable.dealValue) {
              const parsedValue = Number(readable.dealValue.replace(/[$,\s]/g, ''));
              if (!Number.isFinite(parsedValue) || parsedValue < 0) {
                errors.push({ row: rowNumber, field: 'dealValue', message: 'Deal value must be a positive number.' });
              } else {
                dealValue = parsedValue;
              }
            }

            const data: LeadInput | undefined = errors.length === 0
              ? {
                  fullName,
                  email,
                  phone: readable.phone || undefined,
                  company,
                  jobTitle: readable.jobTitle || undefined,
                  source,
                  status,
                  priority,
                  dealValue,
                  notes: readable.notes || undefined,
                }
              : undefined;

            return {
              row: rowNumber,
              values: fields.map((field) => String(raw[field] ?? '')),
              data,
              errors,
            };
          });

        setHeaders(fields);
        setHeaderErrors([]);
        setRows(parsedRows);
        setLoading(false);

        if (parsed.errors.length > 0) {
          toast.error(`CSV parsed with ${parsed.errors.length} warning(s). Review the preview.`);
        }
        if (duplicateEmails.size > 0) {
          toast.warning(`${duplicateEmails.size} duplicate email(s) detected inside the CSV.`);
        }
      },
      error: () => {
        toast.error('Failed to parse CSV file');
        setLoading(false);
      },
    });
  }, []);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    setImporting(true);
    try {
      const importResult = await api.leads.importRows(validRows);
      setResult(importResult);
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`${importResult.imported} lead${importResult.imported === 1 ? '' : 's'} imported`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        toast.error('Only admins can import leads.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Import failed');
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {result ? (
        <Card>
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">Import Complete</h3>
            <div className="flex items-center justify-center gap-3 mb-5">
              <Badge variant="success">{result.imported} imported</Badge>
              {result.skipped > 0 && <Badge variant="warning">{result.skipped} skipped</Badge>}
              {result.failed > 0 && <Badge variant="danger">{result.failed} failed</Badge>}
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto text-left mx-auto max-w-lg mb-5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bg-primary">
                      <th className="text-left px-3 py-1.5 font-medium text-text-muted">Row</th>
                      <th className="text-left px-3 py-1.5 font-medium text-text-muted">Field</th>
                      <th className="text-left px-3 py-1.5 font-medium text-text-muted">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((error, index) => (
                      <tr key={index} className="border-t border-border-light">
                        <td className="px-3 py-1.5 text-text-secondary">{error.row}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{error.field}</td>
                        <td className="px-3 py-1.5 text-danger">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button variant="secondary" onClick={reset}>Import More</Button>
          </div>
        </Card>
      ) : !file || (loading && rows.length === 0 && headerErrors.length === 0) ? (
        <Card>
          <div
            onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragOver ? 'border-accent bg-accent-light' : 'border-border hover:border-text-muted'
            }`}
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <FileUp className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary mb-1">Drop your CSV file here</p>
                <p className="text-xs text-text-muted mb-4">or click to browse files</p>
                <label className="cursor-pointer">
                  <Button variant="secondary" size="sm" disabled={loading}>
                    <Upload className="w-3.5 h-3.5" /> Browse Files
                  </Button>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (selected) processFile(selected);
                      event.target.value = '';
                    }}
                  />
                </label>
              </>
            )}
          </div>
          <div className="mt-4 p-3 bg-bg-primary rounded-lg">
            <p className="text-xs font-medium text-text-secondary mb-1">Required columns:</p>
            <p className="text-xs text-text-muted">Name, Email, Company</p>
            <p className="text-xs font-medium text-text-secondary mt-2 mb-1">Optional columns:</p>
            <p className="text-xs text-text-muted">Phone, Job Title, Source, Status, Priority, Deal Value, Notes</p>
            <p className="text-xs text-text-muted mt-2">Accepted sources: Website, Referral, LinkedIn, Cold Call, Email Campaign, Trade Show, Partner.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-text-muted">{rows.length} rows · {headers.length} columns</p>
                </div>
              </div>
              <button onClick={reset} className="text-text-muted hover:text-text-primary" aria-label="Remove file">
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>

          {headerErrors.length > 0 && (
            <Card>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-danger mb-1">Missing Required Columns</p>
                  <ul className="space-y-1">
                    {headerErrors.map((message, index) => (
                      <li key={index} className="text-xs text-text-secondary">{message}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-text-muted mt-2">Please fix the CSV and re-upload.</p>
                </div>
              </div>
            </Card>
          )}

          {headers.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Column Mapping</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {headers.map((header) => (
                  <div key={header} className="flex items-center gap-2 px-3 py-2 bg-bg-primary rounded-lg">
                    <span className="text-xs font-medium text-text-primary flex-1">{header}</span>
                    <ArrowRight className="w-3 h-3 text-text-muted" />
                    <span className="text-xs text-accent">
                      {HEADER_MAP[header.trim().toLowerCase()] || <span className="text-text-muted italic">unmapped</span>}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {headerErrors.length === 0 && rows.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Validation Results</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="success"><CheckCircle2 className="w-3 h-3" /> {validRows.length} valid</Badge>
                  {errorCount > 0 && <Badge variant="danger"><AlertCircle className="w-3 h-3" /> {errorCount} invalid</Badge>}
                </div>
              </div>

              {errorCount > 0 && (
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-danger-light/50">
                        <th className="text-left px-3 py-1.5 font-medium text-text-muted">Row</th>
                        <th className="text-left px-3 py-1.5 font-medium text-text-muted">Field</th>
                        <th className="text-left px-3 py-1.5 font-medium text-text-muted">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.flatMap((row) => row.errors).map((error, index) => (
                        <tr key={index} className="border-t border-border-light">
                          <td className="px-3 py-1.5 text-text-secondary">{error.row}</td>
                          <td className="px-3 py-1.5 text-text-secondary">{error.field}</td>
                          <td className="px-3 py-1.5 text-danger">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[11px] text-text-muted mt-2">
                Invalid rows are skipped. Existing database duplicates are detected by the server during import.
              </p>
            </Card>
          )}

          {rows.length > 0 && (
            <Card padding={false}>
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Data Preview</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bg-primary/50">
                      <th className="text-left px-3 py-2 font-medium text-text-muted w-8">#</th>
                      {headers.map((header) => (
                        <th key={header} className="text-left px-3 py-2 font-medium text-text-muted">{header}</th>
                      ))}
                      <th className="text-left px-3 py-2 font-medium text-text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row) => (
                      <tr key={row.row} className={`border-t border-border-light ${row.errors.length > 0 ? 'bg-danger-light/30' : ''}`}>
                        <td className="px-3 py-2 text-text-muted">{row.row}</td>
                        {row.values.map((cell, index) => (
                          <td key={index} className="px-3 py-2 text-text-secondary">{cell}</td>
                        ))}
                        <td className="px-3 py-2">
                          {row.errors.length > 0 ? <Badge variant="danger">Error</Badge> : <Badge variant="success">Valid</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <p className="px-5 py-2 text-xs text-text-muted border-t border-border-light">
                  Showing 10 of {rows.length} rows
                </p>
              )}
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={reset} disabled={importing}>Cancel</Button>
            <Button
              onClick={handleImport}
              loading={importing}
              disabled={validRows.length === 0 || headerErrors.length > 0}
            >
              <Upload className="w-3.5 h-3.5" /> Import {validRows.length} Leads
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportSection() {
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [priority, setPriority] = useState<LeadPriority | ''>('');
  const [source, setSource] = useState<LeadSource | ''>('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await api.leads.exportCsv({
        search: search.trim() || undefined,
        status: status || undefined,
        priority: priority || undefined,
        source: source || undefined,
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `signaldesk-leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Leads exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <div className="max-w-xl mx-auto py-4">
        <div className="text-center mb-5">
          <Download className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">Export Leads Data</h3>
          <p className="text-xs text-text-muted">
            Download leads visible to your account as a CSV file. Optional filters limit the rows exported.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, company, or email"
            />
          </div>
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as LeadStatus | '')}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'interested', label: 'Interested' },
              { value: 'negotiation', label: 'Negotiation' },
              { value: 'converted', label: 'Converted' },
              { value: 'lost', label: 'Lost' },
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as LeadPriority | '')}
            options={[
              { value: '', label: 'All priorities' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
          <div className="sm:col-span-2">
            <Select
              label="Source"
              value={source}
              onChange={(event) => setSource(event.target.value as LeadSource | '')}
              options={[
                { value: '', label: 'All sources' },
                ...Object.entries(sourceLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>
        </div>

        <div className="flex justify-center mt-5">
          <Button onClick={handleExport} loading={exporting}>
            <Download className="w-4 h-4" /> Export to CSV
          </Button>
        </div>
      </div>
    </Card>
  );
}
