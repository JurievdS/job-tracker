import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  MessageSquare,
  Clock,
  Link,
  Stamp,
  User,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/routes/routes';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const mainNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { path: ROUTES.APPLICATIONS, label: 'Applications', icon: FileText },
      { path: ROUTES.COMPANIES, label: 'Companies', icon: Building2 },
      { path: ROUTES.CONTACTS, label: 'Contacts', icon: Users },
    ],
  },
  {
    label: 'Activity',
    items: [
      { path: ROUTES.INTERACTIONS, label: 'Interactions', icon: MessageSquare },
      { path: ROUTES.REMINDERS, label: 'Reminders', icon: Clock },
    ],
  },
  {
    label: 'Reference',
    items: [
      { path: ROUTES.SOURCES, label: 'Sources', icon: Link },
      { path: ROUTES.VISA_TYPES, label: 'Visa Types', icon: Stamp },
    ],
  },
];

export const accountNavItems: NavItem[] = [
  { path: ROUTES.PROFILE, label: 'Profile', icon: User },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
];
