import React, { createContext, useContext, useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getCurrentProfile, type CurrentProfile } from "../api/authApis.ts";

import {
  AUTH_CHANGE_EVENT,
  AUTH_TOKEN_KEY,
  clearAuthToken,
} from "../api/fetchClient.ts";

import { connectSocket, disconnectSocket } from "../services/socket.ts";

import {
  initializeNotificationSound,
  playNotificationSound,
} from "../services/notificationSound.ts";

interface AuthContextValue {
  profile: CurrentProfile | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface SocketNotification {
  id: string;
  incidentId: string;
  type: "INCIDENT_CREATED" | "INCIDENT_ASSIGNED" | "INCIDENT_UPDATED";
  title: string;
  message: string;
  createdAt: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();

  const [hasToken, setHasToken] = useState(() =>
    Boolean(localStorage.getItem(AUTH_TOKEN_KEY)),
  );

  /**
   * Listen for authentication changes.
   */
  useEffect(() => {
    const handleAuthChange = () => {
      const tokenExists = Boolean(localStorage.getItem(AUTH_TOKEN_KEY));

      setHasToken(tokenExists);
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () =>
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  /**
   * Load the current authenticated user's profile.
   */
  const profileQuery = useQuery<CurrentProfile>({
    queryKey: ["current-profile"],
    queryFn: getCurrentProfile,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Remove cached profile when authentication token disappears.
   */
  useEffect(() => {
    if (!hasToken) {
      queryClient.removeQueries({
        queryKey: ["current-profile"],
      });
    }
  }, [hasToken, queryClient]);

  /**
   * Clear authentication when the current profile request fails.
   */
  useEffect(() => {
    if (profileQuery.isError && hasToken) {
      clearAuthToken();
    }
  }, [profileQuery.isError, hasToken]);

  /**
   * Unlock notification audio after the user's first interaction
   * with the application.
   *
   * Browsers prevent automatic audio playback until the user
   * has interacted with the page.
   */
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeNotificationSound();
    };

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  /**
   * Socket.IO lifecycle and realtime notification listener.
   *
   * Connect whenever an authentication token exists.
   * Disconnect whenever the token disappears.
   */
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(token);

    const handleNotification = (notification: SocketNotification) => {
      console.info("Realtime notification received:", notification);

      /**
       * Play notification sound.
       *
       * Audio is unlocked after the user's first interaction.
       */
      playNotificationSound();

      /**
       * Show notification toast for 4 seconds.
       */
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "opacity-100" : "opacity-0"
            } w-[360px] rounded-lg border border-zinc-200 bg-white p-4 shadow-lg transition-opacity duration-200`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-lg">🔔</div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900">
                  {notification.title}
                </p>

                <p className="mt-1 text-sm text-zinc-600">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        ),
        {
          duration: 4000,
        },
      );

      /**
       * Refresh notification list.
       */
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      /**
       * Refresh unread notification count.
       */
      void queryClient.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
      disconnectSocket();
    };
  }, [hasToken, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        profile: profileQuery.data,
        isLoading: hasToken && profileQuery.isPending,
        isAuthenticated: hasToken && Boolean(profileQuery.data),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
