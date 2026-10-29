import { useCompletionStore } from '../src/store/completionStore';
import React, { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator, AppState } from 'react-native';
import { useHeroStore } from '../src/store/heroStore';
import { useAuthStore } from '../src/store/authStore';
import { useForgedSkillStore } from '../src/store/forgedSkillStore';
import { useGameplayStore } from '../src/store/gameplayStore';
import { GlobalModals } from '../src/components/game/GlobalModals';
import { syncManager } from '../src/api/syncManager';
import { env } from '../src/config/env';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const rpgDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0B1916',
    card: '#142B24',
    text: '#F5F0DF',
    border: '#2C493C',
    primary: '#C4A962',
  },
};

export default function RootLayout() {
  const completionHydrated = useCompletionStore((s) => s.hydrated);
  const hasHydrated = useHeroStore((s) => s._hasHydrated);
  const isOnboarded = useHeroStore((s) => s.isOnboarded);
  const authStatus = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
    void syncManager.init();
    if (env.demoMode) {
      useForgedSkillStore.getState().seedDemo();
    }
  }, [bootstrap]);

  useEffect(() => {
    if (hasHydrated && authStatus !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [hasHydrated, authStatus]);

  // Reset daily availability on startup, UTC day changes, and return from the background.
  useEffect(() => {
    if (!hasHydrated || !completionHydrated || authStatus === 'loading' || !isOnboarded) return;
    const run = () => useGameplayStore.getState().runDailyLifecycle();
    run();
    let day = new Date().toISOString().slice(0, 10);
    const timer = setInterval(() => {
      const nextDay = new Date().toISOString().slice(0, 10);
      if (nextDay !== day) { day = nextDay; run(); }
    }, 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') { day = new Date().toISOString().slice(0, 10); run(); }
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [hasHydrated, completionHydrated, authStatus, isOnboarded]);

  if (!hasHydrated || authStatus === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0F0F1A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#C4A962" size="large" />
      </View>
    );
  }

  // Gating: outside demo mode an unauthenticated user signs in first; then onboarding gates on
  // hero creation. In demo mode auth is skipped and we go straight to the local-first experience.
  const mustSignIn = !env.demoMode && authStatus === 'guest';

  return (
    <ThemeProvider value={rpgDarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="customize" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="codex" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="achievements" options={{ headerShown: false }} />
      </Stack>
      {mustSignIn ? <Redirect href="/login" /> : !isOnboarded && <Redirect href="/onboarding" />}
      <GlobalModals />
    </ThemeProvider>
  );
}
