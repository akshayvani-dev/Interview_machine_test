export declare const Severity: {
    readonly LOW: 'LOW';
    readonly MEDIUM: 'MEDIUM';
    readonly HIGH: 'HIGH';
    readonly CRITICAL: 'CRITICAL';
};
export type Severity = (typeof Severity)[keyof typeof Severity];
export declare const Status: {
    readonly OPEN: 'OPEN';
    readonly INVESTIGATING: 'INVESTIGATING';
    readonly MITIGATED: 'MITIGATED';
    readonly RESOLVED: 'RESOLVED';
};
export type Status = (typeof Status)[keyof typeof Status];
export declare const IncidentEventType: {
    readonly CREATED: 'CREATED';
    readonly UPDATED: 'UPDATED';
    readonly STATUS_CHANGED: 'STATUS_CHANGED';
    readonly SEVERITY_CHANGED: 'SEVERITY_CHANGED';
    readonly ASSIGNED: 'ASSIGNED';
};
export type IncidentEventType = (typeof IncidentEventType)[keyof typeof IncidentEventType];
//# sourceMappingURL=enums.d.ts.map