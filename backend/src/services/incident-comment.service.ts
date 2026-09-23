import { prisma } from "../lib/prisma.js";

interface CreateIncidentCommentParams {
  incidentId: string;
  orgId: string;
  userId: string;
  content: string;
}

interface GetIncidentCommentsParams {
  incidentId: string;
  orgId: string;
  page: number;
  limit: number;
}

export const createIncidentComment = async ({
  incidentId,
  orgId,
  userId,
  content,
}: CreateIncidentCommentParams) => {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      orgId,
    },
    select: {
      id: true,
    },
  });

  if (!incident) {
    throw new Error("Incident not found");
  }

  return prisma.incidentComment.create({
    data: {
      incidentId,
      orgId,
      userId,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
};

export const getIncidentComments = async ({
  incidentId,
  orgId,
  page,
  limit,
}: GetIncidentCommentsParams) => {
  const where = {
    incidentId,
    orgId,
  };

  const [comments, total] = await Promise.all([
    prisma.incidentComment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.incidentComment.count({ where }),
  ]);

  return {
    data: comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
