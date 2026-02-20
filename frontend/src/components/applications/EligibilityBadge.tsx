import { Badge, Tooltip } from '@/components/common';
import type { Eligibility } from '@/types/application';
import { WORK_AUTH_STATUSES } from '@/types/workAuthorization';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, ShieldQuestion } from 'lucide-react';

interface EligibilityBadgeProps {
  eligibility: Eligibility | null;
  mode?: 'dot' | 'badge';
}

const STATUS_CONFIG: Record<string, {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'default';
  label: string;
  dotColor: string;
  Icon: typeof Shield;
}> = {
  authorized: {
    variant: 'success',
    label: 'Authorized',
    dotColor: 'bg-success',
    Icon: ShieldCheck,
  },
  sponsorship_available: {
    variant: 'info',
    label: 'Sponsorship Available',
    dotColor: 'bg-info',
    Icon: Shield,
  },
  not_authorized: {
    variant: 'danger',
    label: 'Not Authorized',
    dotColor: 'bg-danger',
    Icon: ShieldX,
  },
  expired: {
    variant: 'warning',
    label: 'Expired',
    dotColor: 'bg-warning',
    Icon: ShieldAlert,
  },
  unknown: {
    variant: 'default',
    label: 'Unknown',
    dotColor: 'bg-text-muted',
    Icon: ShieldQuestion,
  },
};

function getAuthTypeLabel(authType?: string): string {
  if (!authType) return '';
  const match = WORK_AUTH_STATUSES.find((s) => s.value === authType);
  return match?.label || authType.replace(/_/g, ' ');
}

function getTooltipText(eligibility: Eligibility): string {
  const config = STATUS_CONFIG[eligibility.status];
  if (!config) return '';

  if (eligibility.status === 'authorized') {
    const authLabel = getAuthTypeLabel(eligibility.auth_type);
    const parts = [authLabel || 'Authorized'];
    if (eligibility.expiry_date) {
      const daysUntil = Math.ceil(
        (new Date(eligibility.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 90 && daysUntil > 0) {
        parts.push(`(expires in ${daysUntil}d)`);
      } else if (daysUntil <= 0) {
        parts.push('(expiring soon)');
      }
    }
    return parts.join(' ');
  }

  if (eligibility.status === 'expired') {
    const authLabel = getAuthTypeLabel(eligibility.auth_type);
    return `${authLabel || 'Authorization'} expired${eligibility.expiry_date ? ` on ${eligibility.expiry_date}` : ''}`;
  }

  return config.label;
}

export function EligibilityBadge({ eligibility, mode = 'badge' }: EligibilityBadgeProps) {
  if (!eligibility) return null;

  const config = STATUS_CONFIG[eligibility.status];
  if (!config) return null;

  // In dot mode, skip 'unknown' — not useful to show
  if (mode === 'dot' && eligibility.status === 'unknown') return null;

  const tooltip = getTooltipText(eligibility);

  if (mode === 'dot') {
    return (
      <Tooltip content={tooltip} side="top">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${config.dotColor} shrink-0`}
          aria-label={tooltip}
        />
      </Tooltip>
    );
  }

  const { Icon } = config;
  const authLabel = eligibility.status === 'authorized' ? getAuthTypeLabel(eligibility.auth_type) : '';

  return (
    <Badge variant={config.variant}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {config.label}
      {authLabel && <span className="ml-1 opacity-75">({authLabel})</span>}
    </Badge>
  );
}
