import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { theme } from '../theme';
import { Button } from './Button';
import { registerPushNotifications } from '../services/push';
import { useLanguage } from '../context/LanguageContext';

export interface NotificationPromptProps {
  visible: boolean;
  onDismiss: () => void;
  onGranted?: () => void;
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({
  visible,
  onDismiss,
  onGranted,
}) => {
  const { language, fontFamily, fontFamilyBold } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await registerPushNotifications(language);
      if (result.granted && onGranted) {
        onGranted();
      }
    } finally {
      setLoading(false);
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
            Stay Safe with Official Alerts
          </Text>
          <Text style={[styles.body, { fontFamily }]}>
            Enable push notifications to receive real-time Godavari water level warnings,
            crowd movement updates, and official district administration safety advisories.
          </Text>
          <View style={styles.actions}>
            <Button
              title="Enable Safety Alerts"
              onPress={handleEnable}
              loading={loading}
              variant="primary"
              style={styles.enableButton}
            />
            <Button
              title="Maybe Later"
              onPress={onDismiss}
              variant="ghost"
              style={styles.dismissButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  actions: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  enableButton: {
    width: '100%',
  },
  dismissButton: {
    width: '100%',
  },
});

