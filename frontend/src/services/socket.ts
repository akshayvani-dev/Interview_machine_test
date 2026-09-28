import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) {
    return socket;
  }

  const newSocket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: true,
  });

  newSocket.on("connect", () => {
    console.info("Socket connected:", newSocket.id);
  });

  newSocket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
  });

  newSocket.on("disconnect", (reason) => {
    console.info("Socket disconnected:", reason);
  });

  socket = newSocket;

  return newSocket;
}

export function disconnectSocket(): void {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
