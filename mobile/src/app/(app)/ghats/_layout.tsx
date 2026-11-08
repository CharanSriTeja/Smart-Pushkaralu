import React from 'react';
import { Stack } from 'expo-router';

export default function GhatsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="map" />
      <Stack.Screen name="routes" />
      <Stack.Screen name="nearby" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
