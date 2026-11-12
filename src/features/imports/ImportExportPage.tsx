import { useState, useCallback } from 'react';
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, ArrowRight, X, FileUp, AlertCircle
} from 'lucide-react';
import { Card, Button, Badge, Tabs } from '../../components/ui';
import * as api from '../../services/mockService';
import type { ImportValidationResult } from '../../services/mockService';
import { toast } from 'sonner';

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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);

  const columnMapping: Record<string, string> = {
    'Name': 'fullName',
    'Full Name': 'fullName',
    'Email': 'email',
    'Phone': 'phone',
    'Company': 'company',
    'Source': 'source',
    'Status': 'status',
    'Priority': 'priority',
  };

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFile(f);
    setLoading(true);
    setImportResult(null);
    setValidation(null);
    try {
      const result = await api.parseCSV(f);
      setPreview(result);

      // Validate immediately
      const validationResult = api.validateCSVForImport(result.headers, result.rows, columnMapping);
      setValidation(validationResult);

      if (validationResult.headerErrors.length > 0) {
        toast.error(`CSV header issues: ${validationResult.headerErrors.join(', ')}`);
      }
    } catch {
      toast.error('Failed to parse CSV file');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!validation || validation.validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    try {
      const created = await api.importLeadsFromCSV(validation.validRows);
      setImportResult({ count: created.length });
      toast.success(`${created.length} lead${created.length !== 1 ? 's' : ''} imported successfully`);
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setValidation(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-4">
      {importResult ? (
        <Card>
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">Import Complete</h3>
            <p className="text-xs text-text-muted mb-5">
              {importResult.count} lead{importResult.count !== 1 ? 's' : ''} imported successfully.
              {validation && validation.errors.length > 0 && ` ${validation.errors.length} row(s) skipped due to errors.`}
            </p>
            <Button variant="secondary" onClick={reset}>Import More</Button>
          </div>
        </Card>
      ) : !preview ? (
        <Card>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragOver ? 'border-accent bg-accent-light' : 'border-border hover:border-text-muted'
            }`}
          >
            <FileUp className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-text-primary mb-1">
              {loading ? 'Processing file...' : 'Drop your CSV file here'}
            </p>
            <p className="text-xs text-text-muted mb-4">or click to browse files</p>
            <label className="cursor-pointer">
              <Button variant="secondary" size="sm" disabled={loading}>
                <Upload className="w-3.5 h-3.5" /> Browse Files
              </Button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          </div>
          <div className="mt-4 p-3 bg-bg-primary rounded-lg">
            <p className="text-xs font-medium text-text-secondary mb-1">Required columns:</p>
            <p className="text-xs text-text-muted">Name, Email, Company</p>
            <p className="text-xs font-medium text-text-secondary mt-2 mb-1">Optional columns:</p>
            <p className="text-xs text-text-muted">Phone, Source, Status, Priority</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* File info */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{file?.name}</p>
                  <p className="text-xs text-text-muted">{preview.rows.length} rows · {preview.headers.length} columns</p>
                </div>
              </div>
              <button onClick={reset} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>

          {/* Header Errors */}
          {validation && validation.headerErrors.length > 0 && (
            <Card>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-danger mb-1">Missing Required Columns</p>
                  <ul className="space-y-1">
                    {validation.headerErrors.map((err, i) => (
                      <li key={i} className="text-xs text-text-secondary">{err}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-text-muted mt-2">Please fix the CSV and re-upload.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Column Mapping */}
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Column Mapping</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {preview.headers.map((header) => (
                <div key={header} className="flex items-center gap-2 px-3 py-2 bg-bg-primary rounded-lg">
                  <span className="text-xs font-medium text-text-primary flex-1">{header}</span>
                  <ArrowRight className="w-3 h-3 text-text-muted" />
                  <span className="text-xs text-accent">
                    {columnMapping[header] || <span className="text-text-muted italic">unmapped</span>}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Validation Summary */}
          {validation && validation.headerErrors.length === 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Validation Results</h3>
              <div className="flex items-center gap-4 mb-3">
                {validation.validRows.length > 0 && (
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3" /> {validation.validRows.length} valid
                  </Badge>
                )}
                {validation.errors.length > 0 && (
                  <Badge variant="danger">
                    <AlertCircle className="w-3 h-3" /> {new Set(validation.errors.map(e => e.row)).size} invalid row(s)
                  </Badge>
                )}
              </div>

              {/* Error details */}
              {validation.errors.length > 0 && (
                <div className="mb-3 max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-danger-light/50">
                        <th className="text-left px-3 py-1.5 font-medium text-text-muted">Row</th>
                        <th className="text-left px-3 py-1.5 font-medium text-text-muted">Field</th>
                        <th className="text-left px-3 py-1.5 font-medium text-text-muted">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.errors.map((err, i) => (
                        <tr key={i} className="border-t border-border-light">
                          <td className="px-3 py-1.5 text-text-secondary">{err.row}</td>
                          <td className="px-3 py-1.5 text-text-secondary">{err.field}</td>
                          <td className="px-3 py-1.5 text-danger">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Preview */}
          <Card padding={false}>
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Data Preview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-bg-primary/50">
                    <th className="text-left px-3 py-2 font-medium text-text-muted w-8">#</th>
                    {preview.headers.map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-text-muted">{h}</th>
                    ))}
                    <th className="text-left px-3 py-2 font-medium text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 10).map((row, i) => {
                    const rowNum = i + 2;
                    const hasError = validation?.errors.some((e) => e.row === rowNum);
                    return (
                      <tr key={i} className={`border-t border-border-light ${hasError ? 'bg-danger-light/30' : ''}`}>
                        <td className="px-3 py-2 text-text-muted">{rowNum}</td>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-text-secondary">{cell}</td>
                        ))}
                        <td className="px-3 py-2">
                          {hasError ? (
                            <Badge variant="danger">Error</Badge>
                          ) : (
                            <Badge variant="success">Valid</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 10 && (
              <p className="px-5 py-2 text-xs text-text-muted border-t border-border-light">
                Showing 10 of {preview.rows.length} rows
              </p>
            )}
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={reset}>Cancel</Button>
            <Button
              onClick={handleImport}
              loading={importing}
              disabled={!validation || validation.validRows.length === 0 || validation.headerErrors.length > 0}
            >
              <Upload className="w-3.5 h-3.5" /> Import {validation?.validRows.length || 0} Leads
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportSection() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await api.exportLeadsCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signaldesk-leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Leads exported successfully');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <div className="text-center py-8">
        <Download className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">Export Leads Data</h3>
        <p className="text-xs text-text-muted mb-5 max-w-sm mx-auto">
          Download all your leads data as a CSV file. Includes name, email, phone, company, status, priority, and more.
        </p>
        <Button onClick={handleExport} loading={exporting}>
          <Download className="w-4 h-4" /> Export to CSV
        </Button>
      </div>
    </Card>
  );
}
