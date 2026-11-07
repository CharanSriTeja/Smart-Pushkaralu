import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SOSFloatingButton } from '../../components/SOSFloatingButton';
import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

export default function AppLayout() {
  const { status } = useAuth();
  const { fontFamilyBold } = useLanguage();

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: [styles.tabBarLabel, { fontFamily: fontFamilyBold }],
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: () => <Text style={styles.icon}>🏠</Text>,
          }}
        />
        <Tabs.Screen
          name="ghats"
          options={{
            title: 'Ghats',
            tabBarIcon: () => <Text style={styles.icon}>🌊</Text>,
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: 'News',
            tabBarIcon: () => <Text style={styles.icon}>📰</Text>,
          }}
        />
        <Tabs.Screen
          name="seva"
          options={{
            title: 'Seva',
            tabBarIcon: () => <Text style={styles.icon}>🙏</Text>,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: () => <Text style={styles.icon}>⚙️</Text>,
          }}
        />
        <Tabs.Screen
          name="sos"
          options={{
            href: null, // Hidden from bottom bar tabs, triggered via floating SOS button
          }}
        />
        <Tabs.Screen
          name="issues"
          options={{
            href: null, // Sub-navigation screens (grievances, timeline)
          }}
        />
      </Tabs>
      <SOSFloatingButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  icon: {
    fontSize: 20,
  },
});
