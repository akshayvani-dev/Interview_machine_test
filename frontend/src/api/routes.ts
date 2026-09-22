const API_PREFIX = '/api/v1';

export const apiRoutes = {
  auth: {
    login: `${API_PREFIX}/auth/login`,
    me: `${API_PREFIX}/auth/me`,
  },
  organizations: {
    register: `${API_PREFIX}/org/register`,
  },
  users: {
    list: `${API_PREFIX}/users`,
    byId: (id: string) => `${API_PREFIX}/users/${id}`,
  },
  incidents: {
    list: `${API_PREFIX}/incidents`,
    listByOrg: `${API_PREFIX}/incident-events`,
    eventListing: (id: string) => `${API_PREFIX}/incidents/${id}/events`,
    byId: (id: string) => `${API_PREFIX}/incidents/${id}`,
    assign: (id: string) => `${API_PREFIX}/incidents/${id}/assign`,
  },
} as const;
