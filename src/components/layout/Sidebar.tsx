import { NavLink, useLocation } from 'react-router-dom';
import { cn, getInitials } from '../../utils';
import { useAuth } from '../../auth/AuthProvider';
import {
  LayoutDashboard, Users, GitBranch, CalendarClock, Brain,
  Upload, Settings, X, ChevronDown, Signal
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/leads', icon: Users, label: 'Leads' },
      { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
      { to: '/follow-ups', icon: CalendarClock, label: 'Follow-ups' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/ai', icon: Brain, label: 'AI Workspace' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/import-export', icon: Upload, label: 'Import / Export' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-[240px] bg-sidebar flex flex-col z-50 transition-transform duration-200',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Signal className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">SignalDesk</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-active text-white font-medium'
                          : 'text-white/60 hover:bg-sidebar-hover hover:text-white/90'
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/8 p-3">
          <NavLink to="/settings" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-sidebar-hover transition-colors">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold">
              {profile?.fullName ? getInitials(profile.fullName) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90 font-medium truncate">{profile?.fullName || profile?.email || 'Account'}</p>
              <p className="text-[11px] text-white/40 truncate">
                {profile?.role === 'admin' ? 'Admin' : 'Sales Rep'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/30" />
          </NavLink>
        </div>
      </aside>
    </>
  );
}
