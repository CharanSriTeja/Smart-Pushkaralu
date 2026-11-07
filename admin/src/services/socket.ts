import { io, Socket } from 'socket.io-client';
import { EmergencyAlert, SosAlertAdminRecord, ClusterNotification } from '../types';

export class PushkaraluSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private alertListeners: Set<(alert: any) => void> = new Set();
  private updateListeners: Set<(data: any) => void> = new Set();
  private clusterListeners: Set<(cluster: ClusterNotification) => void> = new Set();
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  public isConnected: boolean = false;
  public soundEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;

  constructor(url?: string) {
    const rawUrl = url || (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:4000';
    this.url = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
  }

  public connect(): void {
    if (this.socket) return;

    const token =
      localStorage.getItem('sp_admin_token') ||
      localStorage.getItem('pushkaralu_admin_token') ||
      'dev-admin-token';

    try {
      this.socket = io(`${this.url}/admin-sos`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 8000,
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
      });

      // Module 7 Emergency events
      this.socket.on('sos:new', (alert: SosAlertAdminRecord) => {
        if (this.soundEnabled) {
          this.playSosChime();
        }
        this.notifyAlert(alert);
      });

      this.socket.on('sos:updated', (data: { alertId: string; alert: SosAlertAdminRecord; update?: any }) => {
        this.updateListeners.forEach((cb) => {
          try { cb(data); } catch (_) {}
        });
      });

      this.socket.on('sos:cluster', (cluster: ClusterNotification) => {
        if (this.soundEnabled) {
          this.playClusterAlert();
        }
        this.clusterListeners.forEach((cb) => {
          try { cb(cluster); } catch (_) {}
        });
      });

      // Legacy support
      this.socket.on('emergency_alert', (data: EmergencyAlert) => {
        this.notifyAlert(data);
      });
    } catch (err) {
      this.isConnected = false;
      this.notifyStatus(false);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  public onAlert(cb: (alert: any) => void): () => void {
    this.alertListeners.add(cb);
    return () => this.alertListeners.delete(cb);
  }

  public onUpdate(cb: (data: any) => void): () => void {
    this.updateListeners.add(cb);
    return () => this.updateListeners.delete(cb);
  }

  public onCluster(cb: (cluster: ClusterNotification) => void): () => void {
    this.clusterListeners.add(cb);
    return () => this.clusterListeners.delete(cb);
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

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Synthesizes emergency chime using Web Audio API without external audio files
   */
  public playSosChime(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1320, now + 0.15); // E6

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (_) {}
  }

  /**
   * Synthesizes multi-tone cluster emergency alarm
   */
  public playClusterAlert(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750 + i * 200, now + i * 0.15);
        gain.gain.setValueAtTime(0.2, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.15);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + (i + 1) * 0.15);
      }
    } catch (_) {}
  }

  private notifyAlert(alert: any): void {
    this.alertListeners.forEach((listener) => {
      try { listener(alert); } catch (_) {}
    });
  }

  private notifyStatus(connected: boolean): void {
    this.statusListeners.forEach((listener) => {
      try { listener(connected); } catch (_) {}
    });
  }
}

export const socketClient = new PushkaraluSocketClient();
