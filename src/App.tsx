import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LeadsPage } from './features/leads/LeadsPage';
import { LeadDetailPage } from './features/leads/LeadDetailPage';
import { PipelinePage } from './features/pipeline/PipelinePage';
import { FollowUpsPage } from './features/followups/FollowUpsPage';
import { AIWorkspacePage } from './features/ai/AIWorkspacePage';
import { ImportExportPage } from './features/imports/ImportExportPage';
import { SettingsPage } from './features/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/follow-ups" element={<FollowUpsPage />} />
          <Route path="/ai" element={<AIWorkspacePage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontSize: '13px',
            borderRadius: '10px',
          },
        }}
      />
    </BrowserRouter>
  );
}
