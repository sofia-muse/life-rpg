import { ExpoConfig, ConfigContext } from 'expo/config';

// Env is injected at build time. EXPO_PUBLIC_* values are inlined into the web/native bundle.
// Demo mode (default ON) runs the app fully local-first with no backend required — used for the
// hosted web demo so it works even when the API is asleep.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5005';
const DEMO_MODE = (process.env.EXPO_PUBLIC_DEMO_MODE ?? 'true') === 'true';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Life RPG',
  slug: 'life-rpg',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'liferpg',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0F0F1A',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0F0F1A',
      foregroundImage: './assets/images/icon.png',
    },
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: API_URL,
    demoMode: DEMO_MODE,
  },
});
