import 'react-native-reanimated';

import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/auth-context';
import { FilterProvider } from '@/contexts/filter-context';
import { ToastProvider } from '@/contexts/toast-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'onboarding',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  NavigationBar.setVisibilityAsync('hidden');

  return (
    <AuthProvider>
      <FilterProvider>
        <ToastProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DefaultTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="userprofile" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="matched" options={{ headerShown: false }} />
              <Stack.Screen name="chat" options={{ headerShown: false }} />
              <Stack.Screen name="filters" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar hidden={true} />
          </ThemeProvider>
        </ToastProvider>
      </FilterProvider>
    </AuthProvider>
  );
}
