import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useMobileSidebar, useDarkMode } from '../../hooks';

export function AppShell() {
  const { isOpen, toggle, close } = useMobileSidebar();
  const { isDark, toggle: toggleTheme } = useDarkMode();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar isOpen={isOpen} onClose={close} />
      <div className="lg:ml-[240px] flex flex-col min-h-screen">
        <Topbar onMenuToggle={toggle} isDark={isDark} onThemeToggle={toggleTheme} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
