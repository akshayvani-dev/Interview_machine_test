export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  MITIGATED = 'MITIGATED',
  RESOLVED = 'RESOLVED',
}

export const INCIDENT_SEVERITY_OPTIONS = [
  { value: IncidentSeverity.LOW, label: 'Low' },
  { value: IncidentSeverity.MEDIUM, label: 'Medium' },
  { value: IncidentSeverity.HIGH, label: 'High' },
  { value: IncidentSeverity.CRITICAL, label: 'Critical' },
] as const;

export const INCIDENT_STATUS_OPTIONS = [
  { value: IncidentStatus.OPEN, label: 'Open' },
  { value: IncidentStatus.INVESTIGATING, label: 'Investigating' },
  { value: IncidentStatus.MITIGATED, label: 'Mitigated' },
  { value: IncidentStatus.RESOLVED, label: 'Resolved' },
] as const;
