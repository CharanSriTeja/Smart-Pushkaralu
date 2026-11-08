import React from 'react';
import { Stack } from 'expo-router';

export default function IssuesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="report" />
      <Stack.Screen name="[ticket_no]" />
    </Stack>
  );
}

