import React from 'react';
import { cn } from '../../utils';

// ─── Button ───
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent/40',
    secondary: 'bg-bg-primary text-text-primary border border-border hover:bg-border-light focus:ring-border',
    ghost: 'text-text-secondary hover:bg-bg-primary hover:text-text-primary focus:ring-border',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger/40',
    outline: 'border border-accent text-accent hover:bg-accent-light focus:ring-accent/40',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ───
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-text-secondary">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
            icon && 'pl-10',
            error && 'border-danger focus:ring-danger/20 focus:border-danger',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Select ───
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-text-secondary">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

// ─── Textarea ───
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-text-secondary">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

// ─── Badge ───
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  const variants = {
    default: 'bg-bg-primary text-text-secondary border-border',
    success: 'bg-success-light text-success border-green-200',
    warning: 'bg-warning-light text-warning border-amber-200',
    danger: 'bg-danger-light text-danger border-red-200',
    info: 'bg-accent-light text-accent border-blue-200',
    muted: 'bg-bg-primary text-text-muted border-border-light',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border', variants[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-slate-400': variant === 'default' || variant === 'muted',
        'bg-green-500': variant === 'success',
        'bg-amber-500': variant === 'warning',
        'bg-red-500': variant === 'danger',
        'bg-blue-500': variant === 'info',
      })} />}
      {children}
    </span>
  );
}

// ─── Status Badge ───
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    new: { label: 'New', variant: 'info' },
    contacted: { label: 'Contacted', variant: 'warning' },
    interested: { label: 'Interested', variant: 'success' },
    negotiation: { label: 'Negotiation', variant: 'default' },
    converted: { label: 'Converted', variant: 'success' },
    lost: { label: 'Lost', variant: 'danger' },
  };
  const c = config[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={c.variant} dot>{c.label}</Badge>;
}

// ─── Priority Badge ───
export function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    low: { label: 'Low', variant: 'muted' },
    medium: { label: 'Medium', variant: 'info' },
    high: { label: 'High', variant: 'warning' },
    critical: { label: 'Critical', variant: 'danger' },
  };
  const c = config[priority] ?? { label: priority, variant: 'default' as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

// ─── Avatar ───
export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-teal-100 text-teal-700'];
  const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold shrink-0', sizes[size], colors[colorIndex], className)}>
      {initials}
    </div>
  );
}

// ─── Dialog ───
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Dialog({ open, onClose, title, children, maxWidth = 'max-w-lg' }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-bg-surface rounded-xl shadow-xl border border-border w-full animate-fade-in', maxWidth)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-bg-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-text-secondary mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}

// ─── Empty State ───
export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-bg-primary border border-border flex items-center justify-center text-text-muted mb-4">{icon}</div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

// ─── Loading Spinner ───
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
    </div>
  );
}

// ─── Tabs ───
interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-0.5 border-b border-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors relative',
            activeTab === tab.id
              ? 'text-accent'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-accent/10 text-accent' : 'bg-bg-primary text-text-muted'
              )}>{tab.count}</span>
            )}
          </span>
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Card ───
export function Card({ children, className, padding = true, style }: { children: React.ReactNode; className?: string; padding?: boolean; style?: React.CSSProperties }) {
  return (
    <div className={cn('bg-bg-surface border border-border rounded-xl', padding && 'p-5', className)} style={style}>
      {children}
    </div>
  );
}

// ─── Search Input ───
export function SearchInput({ value, onChange, placeholder = 'Search...', className }: { value: string; onChange: (val: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-border bg-bg-surface pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors'
        )}
      />
    </div>
  );
}

// ─── Dropdown ───
interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={cn(
          'absolute top-full mt-1 bg-bg-surface border border-border rounded-lg shadow-lg py-1 z-40 min-w-[160px] animate-fade-in',
          align === 'right' ? 'right-0' : 'left-0'
        )} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, variant = 'default', icon }: { children: React.ReactNode; onClick?: () => void; variant?: 'default' | 'danger'; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
        variant === 'danger' ? 'text-danger hover:bg-danger-light' : 'text-text-primary hover:bg-bg-primary'
      )}
    >
      {icon && <span className="text-text-muted">{icon}</span>}
      {children}
    </button>
  );
}
