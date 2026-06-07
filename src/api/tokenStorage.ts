import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Tokens live in the OS keychain on native. SecureStore is unavailable on web (the live demo
// target), so fall back to localStorage there.
const ACCESS = 'liferpg.accessToken';
const REFRESH = 'liferpg.refreshToken';

const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS),
  getRefreshToken: () => getItem(REFRESH),
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([setItem(ACCESS, accessToken), setItem(REFRESH, refreshToken)]);
  },
  async clear(): Promise<void> {
    await Promise.all([removeItem(ACCESS), removeItem(REFRESH)]);
  },
};
