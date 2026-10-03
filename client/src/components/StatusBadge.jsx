import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const normStatus = (status || 'pending').toLowerCase();

  const configs = {
    taken: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      label: 'Taken',
    },
    upcoming: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: Clock,
      label: 'Upcoming',
    },
    pending: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Clock,
      label: 'Pending',
    },
    missed: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
      label: 'Missed',
    },
    skipped: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertCircle,
      label: 'Skipped',
    },
  };

  const current = configs[normStatus] || configs.pending;
  const Icon = current.icon;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${current.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
}
