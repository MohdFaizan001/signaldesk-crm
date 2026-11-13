import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { Avatar, Dropdown, DropdownItem } from '../ui';
import { useAuth } from '../../auth/AuthProvider';

interface TopbarProps {
  onMenuToggle: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

const pageTitles: Record<string, { title: string; breadcrumb?: string[] }> = {
  '/': { title: 'Dashboard', breadcrumb: ['Overview'] },
  '/leads': { title: 'Leads', breadcrumb: ['Sales', 'Leads'] },
  '/pipeline': { title: 'Sales Pipeline', breadcrumb: ['Sales', 'Pipeline'] },
  '/follow-ups': { title: 'Follow-ups', breadcrumb: ['Sales', 'Follow-ups'] },
  '/ai': { title: 'AI Workspace', breadcrumb: ['Intelligence', 'AI Workspace'] },
  '/import-export': { title: 'Import / Export', breadcrumb: ['Tools', 'Import / Export'] },
  '/settings': { title: 'Settings', breadcrumb: ['Tools', 'Settings'] },
};

export function Topbar({ onMenuToggle, isDark, onThemeToggle }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const displayName = profile?.fullName || profile?.email?.split('@')[0] || 'Account';
  const firstName = displayName.split(' ')[0];
  const pathKey = Object.keys(pageTitles).find(
    (key) => key === '/' ? location.pathname === '/' : location.pathname.startsWith(key)
  );
  const page = pageTitles[pathKey || '/'] ?? { title: 'SignalDesk', breadcrumb: [] };

  return (
    <header className="h-14 border-b border-border bg-bg-surface flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-md hover:bg-bg-primary text-text-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted">
          {page.breadcrumb?.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-text-muted/40">/</span>}
              <span>{crumb}</span>
            </span>
          ))}
        </div>
        <h1 className="sm:hidden text-sm font-semibold text-text-primary">{page.title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg hover:bg-bg-primary text-text-muted hover:text-text-secondary transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User menu */}
        <div className="ml-1 pl-2 border-l border-border">
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-bg-primary transition-colors">
                <Avatar name={displayName} size="sm" />
                <span className="hidden md:block text-sm text-text-primary font-medium">{firstName}</span>
              </button>
            }
          >
            <DropdownItem onClick={() => navigate('/settings')}>Profile</DropdownItem>
            <DropdownItem onClick={() => navigate('/settings')}>Account Settings</DropdownItem>
            <div className="border-t border-border my-1" />
            <DropdownItem
              icon={<LogOut className="w-3.5 h-3.5" />}
              onClick={async () => {
                await signOut();
                navigate('/login', { replace: true });
              }}
              variant="danger"
            >
              Sign Out
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
