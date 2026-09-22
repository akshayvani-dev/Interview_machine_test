/** Allowed urgency levels for an incident. */
export declare enum IncidentSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
/** Allowed lifecycle states for an incident. */
export declare enum IncidentStatus {
    OPEN = "OPEN",
    INVESTIGATING = "INVESTIGATING",
    MITIGATED = "MITIGATED",
    RESOLVED = "RESOLVED"
}
export declare enum IncidentEventType {
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    STATUS_CHANGED = "STATUS_CHANGED",
    SEVERITY_CHANGED = "SEVERITY_CHANGED",
    ASSIGNED = "ASSIGNED"
}
//# sourceMappingURL=incident.d.ts.map