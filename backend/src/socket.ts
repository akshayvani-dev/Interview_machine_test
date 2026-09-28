import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import type { AuthPayload } from "./types/auth.js";
import { UserRole } from "./constants/user.js";

let io: Server;

type VerifyUserToken = (
  token: string,
) => Extract<AuthPayload, { type: "user" }>;

export function initializeSocket(
  server: HttpServer,
  verifyUserToken: VerifyUserToken,
): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  /**
   * Authenticate every socket connection.
   *
   * Client sends:
   *
   * io(SOCKET_URL, {
   *   auth: {
   *     token: jwtToken
   *   }
   * });
   */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (typeof token !== "string" || !token) {
        return next(new Error("Authentication token is required"));
      }

      const auth = await verifyUserToken(token);

      if (auth.type !== "user") {
        return next(new Error("A user authentication token is required"));
      }

      socket.data.auth = auth;

      next();
    } catch {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const auth = socket.data.auth;

    const { userId, orgId, role } = auth;

    console.info(
      `Socket connected: ${socket.id}, user: ${userId}, org: ${orgId}, role: ${role}`,
    );

    /**
     * Every user gets a personal room.
     *
     * Used for:
     * - assignment notifications
     * - direct notifications
     */
    socket.join(`user:${userId}`);

    /**
     * Organization-level rooms.
     *
     * Admins and managers receive organization notifications.
     * Members do not join these rooms.
     */
    if (role === UserRole.ADMIN) {
      socket.join(`org:${orgId}:admins`);
    }

    if (role === UserRole.MANAGER) {
      socket.join(`org:${orgId}:managers`);
    }

    /**
     * Incident-specific room.
     *
     * IMPORTANT:
     * Access to an incident should be verified before
     * allowing the user to join this room.
     */
    socket.on("incident:join", (incidentId: string) => {
      if (typeof incidentId !== "string" || !incidentId.trim()) {
        return;
      }

      socket.join(`incident:${incidentId}`);

      console.info(`Socket ${socket.id} joined incident:${incidentId}`);
    });

    socket.on("incident:leave", (incidentId: string) => {
      if (typeof incidentId !== "string" || !incidentId.trim()) {
        return;
      }

      socket.leave(`incident:${incidentId}`);

      console.info(`Socket ${socket.id} left incident:${incidentId}`);
    });

    socket.on("disconnect", (reason) => {
      console.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
}

export function getSocket(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}
