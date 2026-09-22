/** Allowed urgency levels for an incident. */
export var IncidentSeverity;
(function (IncidentSeverity) {
    IncidentSeverity["LOW"] = "LOW";
    IncidentSeverity["MEDIUM"] = "MEDIUM";
    IncidentSeverity["HIGH"] = "HIGH";
    IncidentSeverity["CRITICAL"] = "CRITICAL";
})(IncidentSeverity || (IncidentSeverity = {}));
/** Allowed lifecycle states for an incident. */
export var IncidentStatus;
(function (IncidentStatus) {
    IncidentStatus["OPEN"] = "OPEN";
    IncidentStatus["INVESTIGATING"] = "INVESTIGATING";
    IncidentStatus["MITIGATED"] = "MITIGATED";
    IncidentStatus["RESOLVED"] = "RESOLVED";
})(IncidentStatus || (IncidentStatus = {}));
export var IncidentEventType;
(function (IncidentEventType) {
    IncidentEventType["CREATED"] = "CREATED";
    IncidentEventType["UPDATED"] = "UPDATED";
    IncidentEventType["STATUS_CHANGED"] = "STATUS_CHANGED";
    IncidentEventType["SEVERITY_CHANGED"] = "SEVERITY_CHANGED";
    IncidentEventType["ASSIGNED"] = "ASSIGNED";
})(IncidentEventType || (IncidentEventType = {}));
//# sourceMappingURL=incident.js.map