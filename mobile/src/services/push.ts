import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import * as SecureStore from 'expo-secure-store';

const FCM_TOKEN_STORAGE_KEY = 'sp_fcm_device_token';

// Configure default in-app banner behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers device for push notifications, obtains native FCM token,
 * and calls backend POST /v1/devices.
 */
export async function registerPushNotifications(
  language: string = 'en',
  topics: string[] = []
): Promise<{ granted: boolean; token?: string }> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    console.log('[Push] Physical device required for native push notifications.');
    return { granted: false };
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Notification permission was denied by user.');
      return { granted: false };
    }

    // Android notification channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pushkaralu_alerts', {
        name: 'Godavari Pushkaralu Official Alerts',
        importance: (Notifications as any).AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0F52BA',
      });
    }

    // Get native device token
    const tokenObj = await Notifications.getDevicePushTokenAsync();
    const token = tokenObj.data;

    // Cache locally
    await SecureStore.setItemAsync(FCM_TOKEN_STORAGE_KEY, token);

    // Register with backend /v1/devices
    await apiClient.post('/v1/devices', {
      fcmToken: token,
      language,
      topics,
      platform: Platform.OS,
    });

    console.log('[Push] Device registered with backend successfully.');
    return { granted: true, token };
  } catch (err: any) {
    console.warn('[Push] Registration failed:', err.message);
    return { granted: false };
  }
}

/**
 * Re-registers device with backend when user changes preferred language.
 */
export async function updateDeviceLanguage(language: string): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(FCM_TOKEN_STORAGE_KEY);
    if (!token) return;

    await apiClient.post('/v1/devices', {
      fcmToken: token,
      language,
      platform: Platform.OS,
    });
  } catch (err: any) {
    console.warn('[Push] Failed to update language topic:', err.message);
  }
}

