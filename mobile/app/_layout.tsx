import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../store/auth.store';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { hydrate, hydrated, token } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Restore session on app start
  useEffect(() => {
    hydrate();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (token && inAuthGroup) {
      router.replace('/(app)/home');
    }
  }, [hydrated, token, segments]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});