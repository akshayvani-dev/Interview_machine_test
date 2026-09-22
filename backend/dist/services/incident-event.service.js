import { prisma } from "../lib/prisma.js";
import { IncidentEventType } from "../constants/incident.js";
export const createIncidentEvent = async ({ incidentId, orgId, userId, type, metadata, }) => {
    return prisma.incidentEvent.create({
        data: {
            incidentId,
            orgId,
            userId,
            type,
            ...(metadata !== undefined ? { metadata } : {}),
        },
    });
};
export const getIncidentEvents = async ({ incidentId, orgId, userId, }) => {
    return prisma.incidentEvent.findMany({
        where: {
            incidentId,
            orgId,
            ...(userId ? { userId } : {}),
        },
        orderBy: {
            createdAt: "asc",
        },
    });
};
//# sourceMappingURL=incident-event.service.js.map