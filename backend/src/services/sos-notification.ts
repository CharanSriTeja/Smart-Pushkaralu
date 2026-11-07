import { getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { SosAlertRecord, SosStatus } from '../types/sos.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { getSmsGatewayAdapter } from './sms-gateway.js';
import { query } from '../db/index.js';

export interface SosNotificationDeliveryResult {
  adminPushed: boolean;
  reporterPushed: boolean;
  backupSmsSent: boolean;
}

export class SosNotificationService {
  /**
   * Broadcasts high-priority alert to admin staff devices via FCM topic
   */
  static async notifyAdminsNewAlert(
    alert: SosAlertRecord,
    ghatName?: string | null
  ): Promise<boolean> {
    const title = `🚨 SOS: ${alert.type.toUpperCase()}`;
    const locationDesc = ghatName || alert.zone_code || (alert.lat ? `${alert.lat}, ${alert.lng}` : 'Unknown location');
    const body = `Emergency report received via ${alert.channel.toUpperCase()} at ${locationDesc}.`;

    try {
      if (getApps().length > 0) {
        await getMessaging().send({
          topic: 'admin-sos',
          notification: { title, body },
          data: {
            alertId: alert.id,
            type: alert.type,
            channel: alert.channel,
            severity: String(alert.severity),
            createdAt: new Date(alert.created_at).toISOString(),
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'emergency_sos',
              priority: 'max',
            },
          },
        });
      }

      logger.info({ alertId: alert.id }, '[SosNotification] Admin FCM broadcast completed');
      return true;
    } catch (err: any) {
      logger.warn({ err: err.message, alertId: alert.id }, '[SosNotification] Admin FCM broadcast note');
      return false;
    }
  }

  /**
   * Sends fallback SMS notification to on-duty district officer if backup phone configured
   */
  static async sendBackupSmsAlert(
    alert: SosAlertRecord,
    ghatName?: string | null
  ): Promise<boolean> {
    if (!env.SOS_BACKUP_NOTIFY_PHONE) {
      return false;
    }

    const loc = ghatName || alert.zone_code || 'Ghat steps';
    const message = `EMERGENCY ALERT: ${alert.type.toUpperCase()} reported at ${loc}. ID: ${alert.id.slice(0, 8)}. Check admin panel immediately.`;

    try {
      const adapter = getSmsGatewayAdapter();
      await adapter.sendSms(env.SOS_BACKUP_NOTIFY_PHONE, message);
      return true;
    } catch (err: any) {
      logger.error({ err: err.message }, '[SosNotification] Failed to deliver backup SMS');
      return false;
    }
  }

  /**
   * Updates reporter's device on status changes or public updates
   */
  static async notifyReporterUpdate(params: {
    alert: SosAlertRecord;
    status?: SosStatus | null;
    publicNote?: string | null;
  }): Promise<boolean> {
    const { alert, status, publicNote } = params;
    const lang = (alert.language || 'en') as 'en' | 'te' | 'hi';

    const statusTitles: Record<'en' | 'te' | 'hi', Record<string, string>> = {
      en: {
        acknowledged: 'Emergency Alert Acknowledged',
        dispatched: 'Emergency Response Dispatched',
        resolved: 'Emergency Resolved',
        false_alarm: 'Alert Cancelled',
      },
      te: {
        acknowledged: 'అత్యవసర హెచ్చరిక స్వీకరించబడింది',
        dispatched: 'రెస్క్యూ బృందం బయలుదేరింది',
        resolved: 'అత్యవసర సమస్య పరిష్కరించబడింది',
        false_alarm: 'హెచ్చరిక రద్దు చేయబడింది',
      },
      hi: {
        acknowledged: 'आपातकालीन अलर्ट स्वीकार किया गया',
        dispatched: 'बचाव दल रवाना हो चुका है',
        resolved: 'आपातकालीन स्थिति सुलझाई गई',
        false_alarm: 'अलर्ट रद्द किया गया',
      },
    };

    const statusBodies: Record<'en' | 'te' | 'hi', Record<string, string>> = {
      en: {
        acknowledged: 'Command control has acknowledged your alert. Teams are responding.',
        dispatched: 'First responders / medical teams are on their way to your location.',
        resolved: 'The incident has been marked as resolved by on-site teams.',
        false_alarm: 'The emergency alert was closed as a false alarm.',
      },
      te: {
        acknowledged: 'కమాండ్ కంట్రోల్ మీ సమాచారాన్ని నమోదు చేసింది. బృందాలు చర్యలు చేపడుతున్నాయి.',
        dispatched: 'సహాయక / వైద్య బృందం మీ స్థానానికి చేరుకుంటోంది.',
        resolved: 'సంఘటనను క్షేత్రస్థాయి బృందం విజయవంతంగా పరిష్కరించింది.',
        false_alarm: 'అత్యవసర హెచ్చరిక పొరపాటుగా నమోదు చేయబడినట్లు గుర్తించి మూసివేయబడింది.',
      },
      hi: {
        acknowledged: 'कमांड कंट्रोल ने आपकी सूचना प्राप्त कर ली है। टीमें प्रतिक्रिया दे रही हैं।',
        dispatched: 'राहत और बचाव / चिकित्सा दल आपके स्थान पर पहुंच रहा है।',
        resolved: 'घटना को ग्राउंड टीम द्वारा सुलझा लिया गया है।',
        false_alarm: 'आपातकालीन अलर्ट को गलत सूचना मानकर बंद कर दिया गया।',
      },
    };

    const title =
      (status && statusTitles[lang]?.[status]) ||
      (status && statusTitles.en[status]) ||
      'SOS Status Update';

    const body =
      publicNote ||
      (status && statusBodies[lang]?.[status]) ||
      (status && statusBodies.en[status]) ||
      'Your emergency report status has been updated.';

    const payloadData: Record<string, string> = {
      type: 'sos_update',
      alertId: alert.id,
      status: status || alert.status,
      updatedAt: new Date().toISOString(),
    };

    let delivered = false;

    // 1. Deliver to device topic if device_id is present
    if (alert.device_id) {
      try {
        if (getApps().length > 0) {
          await getMessaging().send({
            topic: `device_${alert.device_id}`,
            notification: { title, body },
            data: payloadData,
          });
          delivered = true;
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, '[SosNotification] Failed delivery to device topic');
      }
    }

    // 2. Deliver to user registered devices if user_id is linked
    if (alert.user_id) {
      try {
        const { rows } = await query<{ token: string }>(
          'SELECT token FROM device_tokens WHERE user_id = $1',
          [alert.user_id]
        );
        for (const row of rows) {
          if (row.token && getApps().length > 0) {
            await getMessaging().send({
              token: row.token,
              notification: { title, body },
              data: payloadData,
            });
            delivered = true;
          }
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, '[SosNotification] Failed delivery to user tokens');
      }
    }

    return delivered;
  }
}

