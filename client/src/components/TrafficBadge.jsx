import React from 'react';
import { Users, Clock } from 'lucide-react';

export default function TrafficBadge({ trafficLevel = 'LOW', patientsWaiting = 0, estimatedWaitMinutes = 0, compact = false }) {
  const getBadgeConfig = () => {
    switch (trafficLevel) {
      case 'HIGH':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-500 animate-pulse',
          label: 'High Patient Traffic',
          waitText: `${estimatedWaitMinutes}+ min wait`,
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: 'Moderate Traffic',
          waitText: `~${estimatedWaitMinutes} min wait`,
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          dot: 'bg-emerald-500',
          label: 'Low Patient Traffic',
          waitText: `${estimatedWaitMinutes || 5} min wait`,
        };
    }
  };

  const config = getBadgeConfig();

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${config.bg}`}>
      <span className="flex items-center gap-1.5 font-semibold">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
      <span className="text-slate-300">|</span>
      <span className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5 opacity-70" />
        <span>{patientsWaiting} waiting</span>
      </span>
      <span className="text-slate-300">|</span>
      <span className="flex items-center gap-1 font-medium">
        <Clock className="w-3.5 h-3.5 opacity-70" />
        <span>{config.waitText}</span>
      </span>
    </div>
  );
}
