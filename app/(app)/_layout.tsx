import React from 'react';
import { Stack } from 'expo-router';
import { RecordsProvider } from '../../src/context/RecordsContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <RecordsProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Smart Capture & Notes',
            headerShown: false, // Custom header for home with search & profile
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: 'New Note',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="record/[id]"
          options={{
            title: 'Note Details',
          }}
        />
        <Stack.Screen
          name="edit/[id]"
          options={{
            title: 'Edit Note',
          }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            title: 'Category Dashboard',
          }}
        />
      </Stack>
    </RecordsProvider>
  );
}
