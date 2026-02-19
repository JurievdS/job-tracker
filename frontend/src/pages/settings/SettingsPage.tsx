import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, User, Lock, AlertTriangle,
  Sun, Moon, Monitor, PanelLeft, PanelRight, Check, Pencil,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { settingsApi } from '@/api/settings';
import { Button, Input, Modal, PageHeader, Tabs, Alert, Badge, PasswordInput } from '@/components/common';
import { parseApiError } from '@/utils/errors';
import { ROUTES } from '@/routes/routes';
import {
  ACCENT_PRESETS,
  COLOR_MODE_OPTIONS,
  DENSITY_OPTIONS,
  FONT_SIZE_OPTIONS,
  PALETTES,
  type ColorMode,
  type Density,
  type FontSize,
  type ThemePalette,
} from '@/config/theme';
import { hexToOKLCH } from '@/utils/color';

// ─── Tab Definitions ───────────────────────────────────────────────────────

const TABS = [
  { key: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { key: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
  { key: 'password', label: 'Password', icon: <Lock className="w-4 h-4" /> },
  { key: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-4 h-4" /> },
];

const COLOR_MODE_ICONS: Record<string, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

// ─── Appearance Tab ──────────────────────────────────────────────────────────

function AppearanceTab() {
  const { settings, updateSettings } = useTheme();
  const [customHex, setCustomHex] = useState('');

  const handleAccentSelect = (oklchValue: string) => {
    updateSettings({ accentColor: oklchValue });
  };

  const handleAccentReset = () => {
    updateSettings({ accentColor: null });
  };

  const handleCustomHex = () => {
    const hex = customHex.startsWith('#') ? customHex : `#${customHex}`;
    if (!/^#[0-9a-fA-F]{3,6}$/.test(hex)) return;
    const oklch = hexToOKLCH(hex);
    if (oklch) {
      updateSettings({ accentColor: oklch });
      setCustomHex('');
    }
  };

  // Check if current accent matches a preset
  const activePresetIndex = settings.accentColor
    ? ACCENT_PRESETS.findIndex((p) => p.value === settings.accentColor)
    : -1;

  return (
    <div className="space-y-8">
      {/* Color Mode */}
      <div>
        <h3 className="text-sm font-medium text-text mb-1">Color Mode</h3>
        <p className="text-xs text-text-muted mb-3">Choose how the app appears</p>
        <div className="grid grid-cols-3 gap-3">
          {COLOR_MODE_OPTIONS.map((option) => {
            const Icon = COLOR_MODE_ICONS[option.value];
            const isActive = settings.colorMode === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateSettings({ colorMode: option.value as ColorMode })}
                className={`flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border-2 transition-colors ${
                  isActive
                    ? 'border-primary bg-primary-light'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-text'}`}>
                  {option.label}
                </span>
                <span className="text-xs text-text-muted">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Palette */}
      <div>
        <h3 className="text-sm font-medium text-text mb-1">Theme Palette</h3>
        <p className="text-xs text-text-muted mb-3">Choose a visual theme for the entire app</p>
        <div className="grid grid-cols-2 gap-3">
          {PALETTES.map((palette) => {
            const isActive = settings.palette === palette.id;
            return (
              <button
                key={palette.id}
                onClick={() => updateSettings({ palette: palette.id as ThemePalette })}
                className={`flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border-2 text-left transition-colors ${
                  isActive
                    ? 'border-primary bg-primary-light'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                {/* Preview swatches */}
                <div className="flex -space-x-1 flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-surface"
                    style={{ backgroundColor: palette.swatches.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2 border-surface"
                    style={{ backgroundColor: palette.swatches.surface }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2 border-surface"
                    style={{ backgroundColor: palette.swatches.text }}
                  />
                </div>
                <div>
                  <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-text'}`}>
                    {palette.label}
                  </div>
                  <div className="text-xs text-text-muted">{palette.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-sm font-medium text-text mb-1">Accent Color</h3>
        <p className="text-xs text-text-muted mb-3">Customize the primary color used throughout the app</p>
        <div className="flex flex-wrap gap-3 mb-3">
          {ACCENT_PRESETS.map((preset, i) => {
            const isActive = activePresetIndex === i;
            return (
              <button
                key={preset.label}
                onClick={() => handleAccentSelect(preset.value)}
                title={preset.label}
                className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                  isActive
                    ? 'border-text scale-110 shadow-md'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: preset.hex }}
              >
                {isActive && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-48">
            <Input
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#6366f1"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleCustomHex} disabled={!customHex}>
            Apply
          </Button>
          {settings.accentColor && (
            <Button variant="ghost" size="sm" onClick={handleAccentReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Layout Density */}
      <div>
        <h3 className="text-sm font-medium text-text mb-1">Layout Density</h3>
        <p className="text-xs text-text-muted mb-3">Adjust the spacing between elements</p>
        <div className="inline-flex rounded-[var(--radius-lg)] border border-border overflow-hidden">
          {DENSITY_OPTIONS.map((option) => {
            const isActive = settings.density === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateSettings({ density: option.value as Density })}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-text-secondary hover:bg-surface-alt'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-placeholder mt-2">
          {DENSITY_OPTIONS.find((d) => d.value === settings.density)?.description}
        </p>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-sm font-medium text-text mb-1">Font Size</h3>
        <p className="text-xs text-text-muted mb-3">Adjust the base font size</p>
        <div className="inline-flex rounded-[var(--radius-lg)] border border-border overflow-hidden">
          {FONT_SIZE_OPTIONS.map((option) => {
            const isActive = settings.fontSize === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateSettings({ fontSize: option.value as FontSize })}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-text-secondary hover:bg-surface-alt'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Position */}
      <div>
        <h3 className="text-sm font-medium text-text mb-1">Sidebar Position</h3>
        <p className="text-xs text-text-muted mb-3">Choose which side the navigation appears on</p>
        <div className="flex gap-3">
          {([
            { value: 'left', label: 'Left', Icon: PanelLeft },
            { value: 'right', label: 'Right', Icon: PanelRight },
          ] as const).map(({ value, label, Icon }) => {
            const isActive = settings.sidebarPosition === value;
            return (
              <button
                key={value}
                onClick={() => updateSettings({ sidebarPosition: value })}
                className={`flex items-center gap-2 px-4 py-3 rounded-[var(--radius-lg)] border-2 transition-colors ${
                  isActive
                    ? 'border-primary bg-primary-light'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-text'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Account Tab ─────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }
    if (trimmed === user?.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const updatedUser = await settingsApi.updateAccount({ name: trimmed });
      updateUser(updatedUser);
      addToast('Display name updated', 'success');
      setIsEditingName(false);
    } catch (err) {
      setNameError(parseApiError(err, 'Failed to update name'));
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNameValue(user?.name || '');
    setNameError(null);
  };

  return (
    <div className="space-y-6">
      {/* Avatar + Identity Header */}
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User avatar'}
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center border-2 border-border">
              <span className="text-xl font-semibold text-primary">
                {(user?.name || user?.email || '?')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-text truncate">
            {user?.name || 'No name set'}
          </p>
          <p className="text-sm text-text-muted truncate">{user?.email}</p>
        </div>
      </div>

      {/* Display Name */}
      <div className="bg-surface-alt rounded-[var(--radius-md)] p-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-text">Display Name</label>
          {!isEditingName && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNameValue(user?.name || '');
                setIsEditingName(true);
              }}
              icon={<Pencil className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
          )}
        </div>
        {isEditingName ? (
          <div className="space-y-3">
            {nameError && <Alert variant="danger">{nameError}</Alert>}
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Your display name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSaveName(); }
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" loading={savingName} onClick={handleSaveName}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text">{user?.name || 'Not set'}</p>
        )}
      </div>

      {/* Email (read-only) */}
      <div className="bg-surface-alt rounded-[var(--radius-md)] p-4">
        <label className="text-sm font-medium text-text">Email</label>
        <p className="text-sm text-text mt-1">{user?.email || 'Not set'}</p>
      </div>

      {/* Member Since */}
      <div className="bg-surface-alt rounded-[var(--radius-md)] p-4">
        <label className="text-sm font-medium text-text">Member Since</label>
        <p className="text-sm text-text mt-1">
          {user?.created_at
            ? new Date(user.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              })
            : 'Unknown'}
        </p>
      </div>

      {/* Connected Accounts */}
      <div className="bg-surface-alt rounded-[var(--radius-md)] p-4">
        <label className="text-sm font-medium text-text mb-3 block">Connected Accounts</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text">Google</span>
            <Badge variant={user?.google_connected ? 'success' : 'default'}>
              {user?.google_connected ? 'Connected' : 'Not connected'}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text">GitHub</span>
            <Badge variant={user?.github_connected ? 'success' : 'default'}>
              {user?.github_connected ? 'Connected' : 'Not connected'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Password Tab ────────────────────────────────────────────────────────────

function PasswordTab() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await settingsApi.changePassword({
        current_password: user?.has_password ? currentPassword : undefined,
        new_password: newPassword,
      });
      addToast('Password updated successfully', 'success');
      setShowForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Failed to update password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  if (!showForm) {
    return (
      <div>
        <p className="text-sm text-text-muted mb-3">
          {user?.has_password
            ? 'Change your account password.'
            : 'Set a password to enable email/password login alongside your OAuth account.'}
        </p>
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          {user?.has_password ? 'Change Password' : 'Set Password'}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {user?.has_password && (
        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      )}

      <PasswordInput
        label="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Minimum 8 characters"
        required
      />

      <PasswordInput
        label="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          {user?.has_password ? 'Update Password' : 'Set Password'}
        </Button>
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            setShowForm(false);
            setError(null);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Danger Zone Tab ─────────────────────────────────────────────────────────

function DangerZoneTab() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await settingsApi.deleteAccount();
      await logout();
      navigate(ROUTES.LOGIN);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-danger p-6">
        <h3 className="text-base font-semibold text-danger mb-2">Delete Account</h3>
        <p className="text-sm text-text-muted mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </Button>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will permanently delete your account and all your data including applications,
            contacts, interactions, reminders, and documents. This cannot be undone.
          </p>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Type <span className="font-mono font-bold">delete</span> to confirm
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirmText !== 'delete'}
              loading={deleting}
              onClick={handleDeleteAccount}
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────

const TAB_COMPONENTS: Record<string, () => JSX.Element> = {
  appearance: AppearanceTab,
  account: AccountTab,
  password: PasswordTab,
  danger: DangerZoneTab,
};

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('appearance');
  const TabContent = TAB_COMPONENTS[activeTab];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and app preferences"
      />

      <div className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border">
        <div className="px-6 pt-4">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="p-6">
          <TabContent />
        </div>
      </div>
    </div>
  );
}
