import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

let io: Server;

export function initializeSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.info(`Socket connected: ${socket.id}`);

    socket.on("incident:join", (incidentId: string) => {
      if (typeof incidentId !== "string" || !incidentId) {
        return;
      }

      socket.join(`incident:${incidentId}`);

      console.info(
        `Socket ${socket.id} joined incident:${incidentId}`,
      );
    });

    socket.on("incident:leave", (incidentId: string) => {
      if (typeof incidentId !== "string" || !incidentId) {
        return;
      }

      socket.leave(`incident:${incidentId}`);

      console.info(
        `Socket ${socket.id} left incident:${incidentId}`,
      );
    });

    socket.on("disconnect", () => {
      console.info(`Socket disconnected: ${socket.id}`);
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

