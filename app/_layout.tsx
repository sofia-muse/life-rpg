import React, { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator } from 'react-native';
import { useHeroStore } from '../src/store/heroStore';
import { GlobalModals } from '../src/components/game/GlobalModals';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const rpgDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0F0F1A',
    card: '#1A1A2E',
    text: '#E8E8F0',
    border: '#2A2A4A',
    primary: '#C4A962',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const hasHydrated = useHeroStore((s) => s._hasHydrated);
  const isOnboarded = useHeroStore((s) => s.isOnboarded);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [loaded, hasHydrated]);

  if (!loaded || !hasHydrated) {
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

  return (
    <ThemeProvider value={rpgDarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="customize" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      {!isOnboarded && <Redirect href="/onboarding" />}
      <GlobalModals />
    </ThemeProvider>
  );
}
