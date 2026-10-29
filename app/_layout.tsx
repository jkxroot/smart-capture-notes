import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { ToastProvider } from '../src/context/ToastContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { ConfigErrorScreen } from '../src/components/ConfigErrorScreen';
import { LoadingOverlay } from '../src/components/LoadingOverlay';

function NavigationGuard() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { isDark, colors } = useTheme();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // User is not authenticated and trying to access protected screen -> Redirect to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // User is authenticated and trying to access auth screen -> Redirect to app home
      router.replace('/(app)');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return <LoadingOverlay message="Restoring session..." />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  if (!isSupabaseConfigured) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <ConfigErrorScreen />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <NavigationGuard />
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
