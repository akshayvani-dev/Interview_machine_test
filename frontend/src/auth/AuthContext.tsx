import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getCurrentProfile,
  type CurrentProfile,
} from "../api/authApis.ts";

import {
  AUTH_CHANGE_EVENT,
  AUTH_TOKEN_KEY,
  clearAuthToken,
} from "../api/fetchClient.ts";

interface AuthContextValue {
  profile: CurrentProfile | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();

  const [hasToken, setHasToken] = useState(() =>
    Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
  );

  useEffect(() => {
    const handleAuthChange = () => {
      const tokenExists = Boolean(
        localStorage.getItem(AUTH_TOKEN_KEY)
      );

      setHasToken(tokenExists);
    };

    window.addEventListener(
      AUTH_CHANGE_EVENT,
      handleAuthChange
    );

    return () =>
      window.removeEventListener(
        AUTH_CHANGE_EVENT,
        handleAuthChange
      );
  }, []);

  const profileQuery = useQuery<CurrentProfile>({
    queryKey: ["current-profile"],
    queryFn: getCurrentProfile,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * IMPORTANT:
   *
   * When the token disappears, remove the cached profile.
   * Otherwise the previous user's profile can remain in
   * React Query and be displayed to the next logged-in user.
   */
  useEffect(() => {
    if (!hasToken) {
      queryClient.removeQueries({
        queryKey: ["current-profile"],
      });
    }
  }, [hasToken, queryClient]);

  /**
   * If the current profile request fails while authenticated,
   * clear the authentication token.
   */
  useEffect(() => {
    if (profileQuery.isError && hasToken) {
      clearAuthToken();
    }
  }, [profileQuery.isError, hasToken]);

  return (
    <AuthContext.Provider
      value={{
        profile: profileQuery.data,
        isLoading:
          hasToken && profileQuery.isPending,
        isAuthenticated:
          hasToken && Boolean(profileQuery.data),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}
