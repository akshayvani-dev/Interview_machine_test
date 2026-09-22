import type { BadgeTone } from './badge.ts';

export function getIncidentSeverityTone(severity: string): BadgeTone {
  if (severity === 'CRITICAL') return 'rose';
  if (severity === 'HIGH') return 'amber';
  if (severity === 'MEDIUM') return 'blue';
  return 'emerald';
}

export function getIncidentStatusTone(status: string): BadgeTone {
  if (status === 'RESOLVED') return 'emerald';
  if (status === 'MITIGATED') return 'blue';
  if (status === 'INVESTIGATING') return 'amber';
  return 'rose';
}
