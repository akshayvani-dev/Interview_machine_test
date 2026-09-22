import type { Prisma } from "../generated/prisma/client.js";
import { IncidentEventType } from "../constants/incident.js";
interface GetIncidentEventsParams {
    incidentId: string;
    orgId: string;
    userId?: string;
}
interface CreateIncidentEventParams {
    incidentId: string;
    orgId: string;
    userId: string;
    type: IncidentEventType;
    metadata?: Prisma.InputJsonValue;
}
export declare const createIncidentEvent: ({ incidentId, orgId, userId, type, metadata, }: CreateIncidentEventParams) => Promise<{
    id: string;
    incidentId: string;
    orgId: string;
    userId: string;
    type: import("../generated/prisma/enums.js").IncidentEventType;
    message: string | null;
    metadata: import("@prisma/client/runtime/client").JsonValue | null;
    createdAt: Date;
}>;
export declare const getIncidentEvents: ({ incidentId, orgId, userId, }: GetIncidentEventsParams) => Promise<{
    id: string;
    incidentId: string;
    orgId: string;
    userId: string;
    type: import("../generated/prisma/enums.js").IncidentEventType;
    message: string | null;
    metadata: import("@prisma/client/runtime/client").JsonValue | null;
    createdAt: Date;
}[]>;
export {};
//# sourceMappingURL=incident-event.service.d.ts.map