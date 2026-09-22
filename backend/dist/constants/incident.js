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
//# sourceMappingURL=incident.js.map