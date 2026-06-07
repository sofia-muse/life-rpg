import Constants from 'expo-constants';

interface AppEnv {
  apiUrl: string;
  /** When true, the app runs fully local-first and never calls the backend. */
  demoMode: boolean;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppEnv>;

export const env: AppEnv = {
  apiUrl: extra.apiUrl ?? 'http://localhost:5005',
  demoMode: extra.demoMode ?? true,
};
