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
    version: z.ZodNumber;
}, z.core.$strict>;
export declare const assignIncidentSchema: z.ZodObject<{
    assignedTo: z.ZodString;
}, z.core.$strict>;
export declare const listIncidentsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
//# sourceMappingURL=incident.schema.d.ts.map