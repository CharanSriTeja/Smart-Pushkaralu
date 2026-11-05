import { io, Socket } from 'socket.io-client';
import { EmergencyAlert } from '../types';

export class PushkaraluSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private mockMode: boolean;
  private alertListeners: Set<(alert: EmergencyAlert) => void> = new Set();
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  private mockIntervalTimer: any = null;
  public isConnected: boolean = false;

  constructor(url?: string, mockMode?: boolean) {
    this.url = url || (import.meta.env?.VITE_SOCKET_URL as string) || 'http://localhost:4000';
    this.mockMode = mockMode ?? (import.meta.env?.VITE_MOCK_MODE === 'true' || true);
  }

  public connect(): void {
    if (this.socket) return;

    try {
      this.socket = io(this.url, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.notifyStatus(true);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.notifyStatus(false);
      });

      this.socket.on('connect_error', () => {
        this.isConnected = false;
        this.notifyStatus(false);
        // Fall back to mock stream if real socket server is not running
        if (this.mockMode && !this.mockIntervalTimer) {
          this.startMockAlertStream();
        }
      });

      this.socket.on('emergency_alert', (data: EmergencyAlert) => {
        this.notifyAlert(data);
      });
    } catch {
      if (this.mockMode) {
        this.startMockAlertStream();
      }
    }

    if (this.mockMode) {
      this.startMockAlertStream();
    }
  }

  public disconnect(): void {
    if (this.mockIntervalTimer) {
      clearInterval(this.mockIntervalTimer);
      this.mockIntervalTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  public onAlert(cb: (alert: EmergencyAlert) => void): () => void {
    this.alertListeners.add(cb);
    return () => this.alertListeners.delete(cb);
  }

  public onStatusChange(cb: (connected: boolean) => void): () => void {
    this.statusListeners.add(cb);
    cb(this.isConnected);
    return () => this.statusListeners.delete(cb);
  }

  public triggerSimulatedAlert(custom?: Partial<EmergencyAlert>): EmergencyAlert {
    const severities: ('critical' | 'high' | 'medium')[] = ['critical', 'high', 'medium'];
    const ghats = [
      { id: 'g1', name: 'Kotilingala Ghat', lat: 17.0005, lng: 81.7801 },
      { id: 'g2', name: 'Pushkar Ghat', lat: 17.0051, lng: 81.7824 },
      { id: 'g3', name: 'Saraswati Ghat', lat: 16.9942, lng: 81.7758 },
      { id: 'g4', name: 'Gowthami Ghat Kovvur', lat: 17.0123, lng: 81.7612 },
    ];
    const ghat = ghats[Math.floor(Math.random() * ghats.length)];
    const messages = [
      'High crowd density near river steps — SDRF assistance requested',
      'Pilgrim medical emergency reported near Changing Room Area B',
      'Water current surge detected near safety buoy cordon',
      'Lost child reported at Information Helpdesk Desk 2',
    ];

    const alert: EmergencyAlert = {
      id: `sos-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`,
      ghatId: custom?.ghatId || ghat.id,
      ghatName: custom?.ghatName || ghat.name,
      severity: custom?.severity || severities[Math.floor(Math.random() * severities.length)],
      message: custom?.message || messages[Math.floor(Math.random() * messages.length)],
      reportedAt: new Date().toISOString(),
      status: 'active',
      latitude: custom?.latitude || ghat.lat,
      longitude: custom?.longitude || ghat.lng,
    };

    this.notifyAlert(alert);
    return alert;
  }

  private startMockAlertStream(): void {
    if (this.mockIntervalTimer) return;
    this.isConnected = true;
    this.notifyStatus(true);

    // Initial alert for preview
    setTimeout(() => {
      this.triggerSimulatedAlert({
        ghatName: 'Pushkar Ghat',
        severity: 'critical',
        message: 'Simulation: Heavy crowd pressure at South Entrance. Barricade redirection required.',
      });
    }, 1500);

    // Stream subsequent alerts periodically
    this.mockIntervalTimer = setInterval(() => {
      this.triggerSimulatedAlert();
    }, 25000);
  }

  private notifyAlert(alert: EmergencyAlert): void {
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (err) {
        console.error('[Socket Alert Listener Error]', err);
      }
    });
  }

  private notifyStatus(connected: boolean): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (err) {
        console.error('[Socket Status Listener Error]', err);
      }
    });
  }
}

export const socketClient = new PushkaraluSocketClient();

