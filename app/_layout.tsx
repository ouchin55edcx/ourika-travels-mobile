import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
