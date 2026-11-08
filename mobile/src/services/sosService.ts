import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { apiRequest } from './api';

// NetInfo is conditionally loaded — it uses native modules not available on web
let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // Web / SSR — NetInfo not available; we fall back to window online/offline events
}

export type SosType = 'medical' | 'police' | 'fire' | 'lost_person' | 'general' | 'other';
export type SosChannel = 'app' | 'sms' | 'qr' | 'call';
export type SosStatus = 'new' | 'acknowledged' | 'dispatched' | 'resolved' | 'false_alarm';

export interface SosTriggerParams {
  type: SosType;
  channel?: SosChannel;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
  zoneCode?: string | null;
  phone?: string | null;
  deviceId?: string | null;
  language?: string;
  metadata?: Record<string, any>;
}

export interface QueuedAlert extends SosTriggerParams {
  tempId: string;
  idempotencyKey: string;
  queuedAt: string;
}

export interface ActiveSosAlert {
  id: string;
  statusToken: string;
  status: SosStatus;
  type: SosType;
  channel: SosChannel;
  zoneCode?: string | null;
  createdAt: string;
}

export interface SosUpdateItem {
  id: string;
  status: SosStatus | null;
  note: string;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  phone: string;
  label: { en: string; te?: string; hi?: string };
  kind: string;
  sortOrder: number;
}

const QUEUE_KEY = 'sp_offline_sos_queue';
const ACTIVE_ALERT_KEY = 'sp_active_sos_alert';

export class SosService {
  /**
   * Retrieves offline queued alerts
   */
  static async getOfflineQueue(): Promise<QueuedAlert[]> {
    try {
      const raw = await storage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Adds an SOS alert to offline queue
   */
  static async addToOfflineQueue(params: SosTriggerParams): Promise<QueuedAlert> {
    const queue = await this.getOfflineQueue();
    const queuedItem: QueuedAlert = {
      ...params,
      tempId: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      idempotencyKey: `idem_off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queuedAt: new Date().toISOString(),
    };
    queue.push(queuedItem);
    await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queuedItem;
  }

  /**
   * Removes alert from offline queue
   */
  static async removeFromOfflineQueue(tempId: string): Promise<void> {
    const queue = await this.getOfflineQueue();
    const filtered = queue.filter((item) => item.tempId !== tempId);
    await storage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  }

  /**
   * Flushes offline queued alerts when connectivity is restored
   */
  static async flushOfflineQueue(): Promise<number> {
    const queue = await this.getOfflineQueue();
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    for (const item of queue) {
      try {
        await apiRequest('/v1/sos', {
          method: 'POST',
          body: JSON.stringify({
            channel: item.channel || 'app',
            type: item.type,
            lat: item.lat,
            lng: item.lng,
            accuracyM: item.accuracyM,
            zoneCode: item.zoneCode,
            phone: item.phone,
            idempotencyKey: item.idempotencyKey,
            language: item.language || 'en',
            metadata: {
              ...(item.metadata || {}),
              wasQueuedOffline: true,
              queuedAt: item.queuedAt,
            },
          }),
          skipAuth: true,
        });
        await this.removeFromOfflineQueue(item.tempId);
        syncedCount++;
      } catch (err) {
        // Stop flushing if still offline / error
        break;
      }
    }
    return syncedCount;
  }

  /**
   * Triggers an SOS alert. If offline or network error, transparently queues it.
   */
  static async triggerSos(params: SosTriggerParams): Promise<{
    alert?: ActiveSosAlert;
    queued?: boolean;
    tempId?: string;
  }> {
    const idempotencyKey = `mob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          id: string;
          statusToken: string;
          status: SosStatus;
          type: SosType;
          channel: SosChannel;
          createdAt: string;
        };
      }>('/v1/sos', {
        method: 'POST',
        body: JSON.stringify({
          ...params,
          idempotencyKey,
        }),
        // SOS is a public endpoint (optionalAuth) — always skip auth so an
        // expired token does NOT throw "Session expired" and block the emergency alert
        skipAuth: true,
      });

      if (response && response.data) {
        const activeAlert: ActiveSosAlert = {
          id: response.data.id,
          statusToken: response.data.statusToken,
          status: response.data.status,
          type: response.data.type,
          channel: response.data.channel,
          zoneCode: params.zoneCode,
          createdAt: response.data.createdAt,
        };
        await this.saveActiveAlert(activeAlert);
        return { alert: activeAlert, queued: false };
      }
    } catch (err: any) {
      console.warn('[SosService] triggerSos failed:', err);
      // Check if this is a genuine network failure / device is offline
      const msg = (err?.message || '').toLowerCase();
      const isNetworkOffline =
        msg.includes('network request failed') ||
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('aborted') ||
        (typeof navigator !== 'undefined' && navigator.onLine === false);

      if (isNetworkOffline) {
        // Transparently queue locally to sync as soon as connection recovers
        const queuedItem = await this.addToOfflineQueue(params);
        return { queued: true, tempId: queuedItem.tempId };
      }

      // If the server responded with an error (e.g. 400, 429, 500), do NOT swallow it
      throw err;
    }

    const queuedItem = await this.addToOfflineQueue(params);
    return { queued: true, tempId: queuedItem.tempId };
  }

  /**
   * Saves active SOS alert to local storage
   */
  static async saveActiveAlert(alert: ActiveSosAlert): Promise<void> {
    try {
      await storage.setItem(ACTIVE_ALERT_KEY, JSON.stringify(alert));
    } catch {}
  }

  /**
   * Retrieves active SOS alert
   */
  static async getActiveAlert(): Promise<ActiveSosAlert | null> {
    try {
      const raw = await storage.getItem(ACTIVE_ALERT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clears active SOS alert
   */
  static async clearActiveAlert(): Promise<void> {
    try {
      await storage.deleteItem(ACTIVE_ALERT_KEY);
    } catch {}
  }

  /**
   * Polls live alert status
   */
  static async pollAlertStatus(
    alertId: string,
    statusToken: string
  ): Promise<{ alert: any; updates: SosUpdateItem[] } | null> {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: { alert: any; updates: SosUpdateItem[] };
      }>(`/v1/sos/${alertId}/status?token=${encodeURIComponent(statusToken)}`, {
        skipAuth: true,
      });
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * Cancels active alert / marks false alarm
   */
  static async cancelAlert(alertId: string, statusToken: string, reason?: string): Promise<boolean> {
    try {
      const res = await apiRequest<{ success: boolean }>(`/v1/sos/${alertId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ token: statusToken, reason }),
        skipAuth: true,
      });
      if (res.success) {
        await this.clearActiveAlert();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Adds a situational note to active alert
   */
  static async addNote(alertId: string, statusToken: string, note: string): Promise<boolean> {
    try {
      const res = await apiRequest<{ success: boolean }>(`/v1/sos/${alertId}/note`, {
        method: 'POST',
        body: JSON.stringify({ token: statusToken, note }),
        skipAuth: true,
      });
      return !!res.success;
    } catch {
      return false;
    }
  }

  /**
   * Fetches emergency contacts with fallback
   */
  static async getEmergencyContacts(ghatId?: string): Promise<EmergencyContact[]> {
    const fallbackContacts: EmergencyContact[] = [
      {
        id: 'c-112',
        phone: '112',
        label: { en: 'National Emergency Helpline', te: 'జాతీయ అత్యవసర సహాయం', hi: 'राष्ट्रीय आपातकालीन हेल्पलाइन' },
        kind: 'control_room',
        sortOrder: 1,
      },
      {
        id: 'c-108',
        phone: '108',
        label: { en: 'Ambulance & Medical', te: 'అంబులెన్స్', hi: 'एम्बुलेंस' },
        kind: 'ambulance',
        sortOrder: 2,
      },
      {
        id: 'c-101',
        phone: '101',
        label: { en: 'Fire & Rescue', te: 'అగ్నిమాపక విభాగం', hi: 'अग्निशमन सेवा' },
        kind: 'fire',
        sortOrder: 3,
      },
      {
        id: 'c-100',
        phone: '100',
        label: { en: 'Police Assistance', te: 'పోలీస్ సహాయం', hi: 'पुलिस सहायता' },
        kind: 'police',
        sortOrder: 4,
      },
    ];

    try {
      const url = ghatId ? `/v1/emergency-contacts?ghatId=${encodeURIComponent(ghatId)}` : '/v1/emergency-contacts';
      const res = await apiRequest<{ success: boolean; data: any[] }>(url, { skipAuth: true });
      if (res && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch {}

    return fallbackContacts;
  }
}

// Auto-sync offline queue when internet connection is restored
try {
  if (NetInfo && Platform.OS !== 'web') {
    // Native: use NetInfo for reliable connectivity events
    NetInfo.addEventListener((state: any) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        SosService.flushOfflineQueue().catch(() => {});
      }
    });
  } else if (typeof window !== 'undefined') {
    // Web: use standard browser online event
    window.addEventListener('online', () => {
      SosService.flushOfflineQueue().catch(() => {});
    });
  }
} catch {}

