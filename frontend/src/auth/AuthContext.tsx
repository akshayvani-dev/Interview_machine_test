import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentProfile, type CurrentProfile } from '../api/authApis.ts';
import { AUTH_CHANGE_EVENT, AUTH_TOKEN_KEY, clearAuthToken } from '../api/fetchClient.ts';

interface AuthContextValue {
  profile: CurrentProfile | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)));
  useEffect(() => {
    const handleAuthChange = () => setHasToken(Boolean(localStorage.getItem(AUTH_TOKEN_KEY)));
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  const profileQuery = useQuery({
    queryKey: ['current-profile'],
    queryFn: getCurrentProfile,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (profileQuery.isError && hasToken) clearAuthToken();
  }, [profileQuery.isError, hasToken]);

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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
