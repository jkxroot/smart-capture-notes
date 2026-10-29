import { Stack } from 'expo-router';
import { RecordsProvider } from '../../src/context/RecordsContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <RecordsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="add" />
        <Stack.Screen name="record/[id]" />
        <Stack.Screen name="edit/[id]" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="settings" />
      </Stack>
    </RecordsProvider>
  );
}
