import { apiFetch } from './client';
import { tokenStorage } from './tokenStorage';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ApiUser {
  id: string;
  email: string;
  displayName: string;
}

async function authenticate(path: string, payload: object): Promise<ApiUser> {
  const res = await apiFetch<AuthResponse>(path, { method: 'POST', body: payload, auth: false });
  await tokenStorage.setTokens(res.accessToken, res.refreshToken);
  return getMe();
}

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    authenticate('/api/v1/auth/register', { email, password, displayName }),

  login: (email: string, password: string) =>
    authenticate('/api/v1/auth/login', { email, password }),

  getMe: () => getMe(),

  async logout(): Promise<void> {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiFetch('/api/v1/auth/logout', { method: 'POST', body: { refreshToken } });
      } catch {
        // best-effort revoke
      }
    }
    await tokenStorage.clear();
  },

  hasToken: () => tokenStorage.getAccessToken().then((t) => !!t),
};

function getMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/v1/auth/me');
}
