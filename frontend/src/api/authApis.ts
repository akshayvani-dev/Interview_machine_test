import type { AxiosError } from 'axios';

import { apiClient, setAuthToken } from './client.ts';
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

interface ApiErrorResponse {
	message?: string;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
	try {
		const { data } = await apiClient.post<LoginResponse>(apiRoutes.auth.login, payload);
		setAuthToken(data.token);
		return data;
	} catch (error) {
		const apiError = error as AxiosError<ApiErrorResponse>;
		throw new Error(apiError.response?.data?.message ?? 'Unable to sign in');
	}
}
