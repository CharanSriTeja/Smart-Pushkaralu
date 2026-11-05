import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F52BA" />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href={'/(app)' as any} />;
  }

  return <Redirect href={'/(auth)/landing' as any} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#F4F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
