import { useState } from 'react';
import { User, Shield, Palette, Bell, Save } from 'lucide-react';
import { Card, Button, Input, Avatar, Badge } from '../../components/ui';
import { currentUser, teamMembers } from '../../data/mockData';
import { toast } from 'sonner';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <Card padding={false} className="lg:col-span-1 h-fit">
          <nav className="p-2">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'team', label: 'Team', icon: Shield },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === item.id
                    ? 'bg-accent-light text-accent font-medium'
                    : 'text-text-secondary hover:bg-bg-primary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'team' && <TeamSection />}
          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'notifications' && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-4">Profile Settings</h2>
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={currentUser.name} size="lg" />
        <div>
          <p className="text-sm font-medium text-text-primary">{currentUser.name}</p>
          <p className="text-xs text-text-muted">{currentUser.email}</p>
          <Badge variant="info" className="mt-1">{currentUser.role}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" defaultValue={currentUser.name} />
        <Input label="Email" type="email" defaultValue={currentUser.email} />
        <Input label="Phone" defaultValue="+1 (555) 000-0000" />
        <Input label="Job Title" defaultValue="Sales Manager" />
      </div>
      <div className="flex justify-end mt-5">
        <Button onClick={() => toast.success('Profile updated')}><Save className="w-3.5 h-3.5" /> Save Changes</Button>
      </div>
    </Card>
  );
}

function TeamSection() {
  return (
    <Card padding={false}>
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">Team Members</h2>
      </div>
      <div className="divide-y divide-border-light">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={member.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-text-primary">{member.name}</p>
                <p className="text-xs text-text-muted">{member.email}</p>
              </div>
            </div>
            <Badge variant={member.role === 'admin' ? 'info' : member.role === 'manager' ? 'warning' : 'default'}>
              {member.role === 'sales-rep' ? 'Sales Rep' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AppearanceSection() {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-4">Appearance</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-2">Theme</label>
          <div className="flex gap-3">
            {['Light', 'Dark', 'System'].map((theme) => (
              <button
                key={theme}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  theme === 'Light'
                    ? 'border-accent bg-accent-light text-accent'
                    : 'border-border text-text-secondary hover:bg-bg-primary'
                }`}
                onClick={() => toast.success(`Theme set to ${theme}`)}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-2">Density</label>
          <div className="flex gap-3">
            {['Comfortable', 'Compact'].map((density) => (
              <button
                key={density}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  density === 'Comfortable'
                    ? 'border-accent bg-accent-light text-accent'
                    : 'border-border text-text-secondary hover:bg-bg-primary'
                }`}
                onClick={() => toast.success(`Density set to ${density}`)}
              >
                {density}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function NotificationsSection() {
  const [settings, setSettings] = useState({
    emailFollowUps: true,
    emailNewLeads: true,
    emailWeekly: false,
    pushOverdue: true,
    pushNewLeads: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification preference updated');
  };

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-4">Notification Preferences</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Email Notifications</h3>
          <div className="space-y-3">
            <ToggleRow label="Follow-up reminders" description="Get email reminders for upcoming and overdue follow-ups" checked={settings.emailFollowUps} onChange={() => toggle('emailFollowUps')} />
            <ToggleRow label="New lead assignments" description="Notify when a lead is assigned to you" checked={settings.emailNewLeads} onChange={() => toggle('emailNewLeads')} />
            <ToggleRow label="Weekly digest" description="Summary of pipeline activity each Monday" checked={settings.emailWeekly} onChange={() => toggle('emailWeekly')} />
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Push Notifications</h3>
          <div className="space-y-3">
            <ToggleRow label="Overdue alerts" description="Immediate alert for overdue follow-ups" checked={settings.pushOverdue} onChange={() => toggle('pushOverdue')} />
            <ToggleRow label="New lead alerts" description="Push notification for new inbound leads" checked={settings.pushNewLeads} onChange={() => toggle('pushNewLeads')} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-accent' : 'bg-border'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}
