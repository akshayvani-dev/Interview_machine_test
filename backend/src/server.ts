
import "dotenv/config";

import { createServer } from "node:http";

import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { initializeSocket } from "./socket.js";
import { verifyUserToken } from "./middlewares/auth.middleware.js";

const port = Number(process.env.PORT);

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    console.info("Database connection established.");

    const server = createServer(app);

    initializeSocket(server, verifyUserToken);

    server.listen(port, () => {
      console.info(`Server listening on http://localhost:${port}`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.info(`${signal} received; closing server.`);

      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    console.error("Unable to connect to the database.", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void startServer();
