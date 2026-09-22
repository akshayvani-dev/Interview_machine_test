import { fetchApi, setAuthToken } from './fetchClient.ts';
import { apiRoutes } from './routes.ts';

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	type: 'org' | 'user';
	id: string;
	name: string;
	email: string;
	role?: string;
}

export interface CurrentProfile {
	type: 'org' | 'user';
	id: string;
	orgId?: string;
	name: string;
	email: string;
	role?: string;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const data = await fetchApi<LoginResponse>(apiRoutes.auth.login, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAuthToken(data.token);
  return data;
}

export async function getCurrentProfile(): Promise<CurrentProfile> {
	return fetchApi<CurrentProfile>(apiRoutes.auth.me);
}
