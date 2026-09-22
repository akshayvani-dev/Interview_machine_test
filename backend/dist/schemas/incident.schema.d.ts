import { z } from "zod";
export declare const incidentIdParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const createIncidentSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    severity: z.ZodEnum<{
        CRITICAL: "CRITICAL";
        HIGH: "HIGH";
        LOW: "LOW";
        MEDIUM: "MEDIUM";
    }>;
    status: z.ZodDefault<z.ZodEnum<{
        INVESTIGATING: "INVESTIGATING";
        MITIGATED: "MITIGATED";
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
    }>>;
    assignedTo: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const updateIncidentSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodEnum<{
        CRITICAL: "CRITICAL";
        HIGH: "HIGH";
        LOW: "LOW";
        MEDIUM: "MEDIUM";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        INVESTIGATING: "INVESTIGATING";
        MITIGATED: "MITIGATED";
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
    }>>;
    assignedTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    version: z.ZodNumber;
}, z.core.$strict>;
export declare const assignIncidentSchema: z.ZodObject<{
    assignedTo: z.ZodString;
    version: z.ZodNumber;
}, z.core.$strict>;
export declare const listIncidentsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    severity: z.ZodOptional<z.ZodEnum<{
        CRITICAL: "CRITICAL";
        HIGH: "HIGH";
        LOW: "LOW";
        MEDIUM: "MEDIUM";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        INVESTIGATING: "INVESTIGATING";
        MITIGATED: "MITIGATED";
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
    }>>;
    assignedTo: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
//# sourceMappingURL=incident.schema.d.ts.map