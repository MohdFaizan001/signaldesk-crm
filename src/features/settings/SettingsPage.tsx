import { useEffect, useState } from 'react';
import { User, Shield, Palette, Bell, Save, Loader2 } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, Button, Input, Avatar, Badge, Select } from '../../components/ui';
import { useAuth } from '../../auth/AuthProvider';
import { useDarkMode, useProfiles } from '../../hooks';
import { api } from '../../services/api';
import type { Profile, UserRole } from '../../types';
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
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.fullName ?? '');
    setAvatarUrl(profile?.avatarUrl ?? '');
  }, [profile?.fullName, profile?.avatarUrl]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-4">Profile Settings</h2>
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={profile.fullName || profile.email} size="lg" />
        <div>
          <p className="text-sm font-medium text-text-primary">{profile.fullName || profile.email}</p>
          <p className="text-xs text-text-muted">{profile.email}</p>
          <Badge variant={profile.role === 'admin' ? 'info' : 'default'} className="mt-1">
            {profile.role === 'admin' ? 'Admin' : 'Sales Rep'}
          </Badge>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            minLength={2}
            maxLength={120}
            required
          />
          <Input label="Email" type="email" value={profile.email} disabled readOnly />
          <div className="sm:col-span-2">
            <Input
              label="Avatar URL (optional)"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        <p className="text-[11px] text-text-muted">
          Email changes and password resets are managed by Supabase Auth. Role changes are restricted to admins.
        </p>
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={saving}>
            <Save className="w-3.5 h-3.5" /> Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TeamSection() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading, isError, error } = useProfiles();
  const isAdmin = profile?.role === 'admin';

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.profiles.updateRole(id, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Role updated');
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Could not update role');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading team…
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <p className="text-sm text-danger">
          {error instanceof Error ? error.message : 'Could not load team members.'}
        </p>
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Team Members</h2>
        <Badge variant="muted">{profiles.length} account{profiles.length === 1 ? '' : 's'}</Badge>
      </div>
      <div className="divide-y divide-border-light">
        {profiles.map((member: Profile) => {
          const isSelf = member.id === profile?.id;
          return (
            <div key={member.id} className="flex items-center justify-between px-5 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={member.fullName || member.email} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {member.fullName || member.email}
                    {isSelf && <span className="ml-2 text-[11px] text-text-muted">(you)</span>}
                  </p>
                  <p className="text-xs text-text-muted truncate">{member.email}</p>
                </div>
              </div>
              {isAdmin && !isSelf ? (
                <div className="w-36 shrink-0">
                  <Select
                    value={member.role}
                    onChange={(event) => updateRole.mutate({ id: member.id, role: event.target.value as UserRole })}
                    disabled={updateRole.isPending}
                    options={[
                      { value: 'sales_rep', label: 'Sales Rep' },
                      { value: 'admin', label: 'Admin' },
                    ]}
                  />
                </div>
              ) : (
                <Badge variant={member.role === 'admin' ? 'info' : 'default'}>
                  {member.role === 'admin' ? 'Admin' : 'Sales Rep'}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
      <p className="px-5 py-3 text-[11px] text-text-muted border-t border-border-light">
        {isAdmin
          ? 'Admins can promote or demote other accounts. You cannot change your own role.'
          : 'Only admins can change roles. New signups receive the sales_rep role.'}
      </p>
    </Card>
  );
}

function AppearanceSection() {
  const { isDark, toggle } = useDarkMode();

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-4">Appearance</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-2">Theme</label>
          <div className="flex gap-3">
            {[
              { label: 'Light', active: !isDark, onClick: () => { if (isDark) toggle(); } },
              { label: 'Dark', active: isDark, onClick: () => { if (!isDark) toggle(); } },
            ].map((theme) => (
              <button
                key={theme.label}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  theme.active
                    ? 'border-accent bg-accent-light text-accent'
                    : 'border-border text-text-secondary hover:bg-bg-primary'
                }`}
                onClick={theme.onClick}
              >
                {theme.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted mt-2">Theme preference is stored in this browser.</p>
        </div>
      </div>
    </Card>
  );
}

const defaultNotifications = {
  emailFollowUps: true,
  emailNewLeads: true,
  emailWeekly: false,
  pushOverdue: true,
  pushNewLeads: false,
};

function loadNotifications() {
  try {
    const stored = localStorage.getItem('signaldesk-notifications');
    return stored ? { ...defaultNotifications, ...(JSON.parse(stored) as Partial<typeof defaultNotifications>) } : defaultNotifications;
  } catch {
    return defaultNotifications;
  }
}

function NotificationsSection() {
  const [settings, setSettings] = useState(loadNotifications);

  const toggle = (key: keyof typeof settings) => {
    setSettings((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      localStorage.setItem('signaldesk-notifications', JSON.stringify(next));
      return next;
    });
    toast.success('Preference saved on this device');
  };

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-primary mb-1">Notification Preferences</h2>
      <p className="text-xs text-text-muted mb-4">
        Stored locally in this browser. Email delivery requires Resend to be configured on the server.
      </p>
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
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-accent' : 'bg-border'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}
