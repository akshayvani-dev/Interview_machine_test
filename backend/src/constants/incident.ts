/** Allowed urgency levels for an incident. */
export enum IncidentSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/** Allowed lifecycle states for an incident. */
export enum IncidentStatus {
  OPEN = "OPEN",
  INVESTIGATING = "INVESTIGATING",
  MITIGATED = "MITIGATED",
  RESOLVED = "RESOLVED",
}
