import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { GlobalErrorBoundary } from '../components/ErrorBoundary';
import { initMobileSentry } from '../services/sentry';
import { requestLocationOnStartup } from '../utils/location';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Initialize Sentry error reporting early
initMobileSentry();

function RootContent() {
  const { isLanguageReady } = useLanguage();
  const { status } = useAuth();

  useEffect(() => {
    // Request location immediately upon opening the site / app
    requestLocationOnStartup().catch(() => {});
  }, []);

  useEffect(() => {
    if (isLanguageReady && status !== 'loading') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLanguageReady, status]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <RootContent />
        </AuthProvider>
      </LanguageProvider>
    </GlobalErrorBoundary>
  );
}
