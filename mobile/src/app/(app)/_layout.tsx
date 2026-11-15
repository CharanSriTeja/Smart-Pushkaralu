import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { SOSFloatingButton } from '../../components/SOSFloatingButton';
import { colors } from '../../theme/tokens';
import { useLanguage } from '../../context/LanguageContext';

export default function AppLayout() {
  const { status } = useAuth();
  const { fontFamilyBold } = useLanguage();
  const { t } = useTranslation();

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary700} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary700,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: [styles.tabBarLabel, { fontFamily: fontFamilyBold }],
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('navigation.home', 'Home'),
            tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>🏠</Text>,
          }}
        />
        <Tabs.Screen
          name="ghats"
          options={{
            title: t('navigation.ghats', 'Ghats'),
            tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>🌊</Text>,
          }}
        />
        <Tabs.Screen
          name="routes"
          options={{
            title: t('navigation.plan', 'Plan'),
            tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>🧭</Text>,
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: t('navigation.news', 'News'),
            tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>📰</Text>,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: t('navigation.more', 'More'),
            tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>⚙️</Text>,
          }}
        />

        {/* Stack routes without bottom tab items */}
        <Tabs.Screen
          name="sos"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="seva"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="issues"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="transport"
          options={{
            href: null,
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  icon: {
    fontSize: 20,
  },
});
