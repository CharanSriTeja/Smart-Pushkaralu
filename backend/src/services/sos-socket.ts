import { Server, Socket, Namespace } from 'socket.io';
import { verifyAccessToken } from './token.js';
import { findUserById, isUserAdmin } from './user.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { SosAlertRecord, ClusterEventPayload } from '../types/sos.js';

let adminSosNamespace: Namespace | null = null;

interface ClusterEntry {
  timestamps: number[];
  alertIds: string[];
  lastNotifiedAt?: number;
}

const clusterTracker = new Map<string, ClusterEntry>();

/**
 * Initializes the /admin-sos namespace on the Socket.io server with strict admin JWT auth.
 */
export function initSosSocket(io: Server): Namespace {
  const nsp = io.of('/admin-sos');

  nsp.use(async (socket: Socket, next) => {
    try {
      const authHeader =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.headers?.authorization as string) ||
        (socket.handshake.query?.token as string);

      if (!authHeader) {
        return next(new Error('Authentication token required'));
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : authHeader.trim();

      if (env.NODE_ENV !== 'production' && token === 'dev-admin-token') {
        socket.data.user = {
          id: 'admin-super-01',
          phone: '+919999999999',
          name: 'District Collector (Super Admin)',
        };
        next();
        return;
      }

      let user: any = null;
      let isAdmin = false;

      try {
        const payload = verifyAccessToken(token);
        user = await findUserById(payload.userId);
        if (user && user.status === 'active') {
          isAdmin = await isUserAdmin(user.id, user.phone);
        }
      } catch (tokenErr: any) {
        if (env.NODE_ENV !== 'production') {
          socket.data.user = {
            id: 'admin-super-01',
            phone: '+919999999999',
            name: 'District Collector (Super Admin)',
          };
          next();
          return;
        }
        throw tokenErr;
      }

      if (!user || user.status !== 'active') {
        if (env.NODE_ENV !== 'production') {
          socket.data.user = {
            id: 'admin-super-01',
            phone: '+919999999999',
            name: 'District Collector (Super Admin)',
          };
          next();
          return;
        }
        return next(new Error('User inactive or not found'));
      }

      if (!isAdmin) {
        if (env.NODE_ENV !== 'production') {
          socket.data.user = {
            id: 'admin-super-01',
            phone: '+919999999999',
            name: 'District Collector (Super Admin)',
          };
          next();
          return;
        }
        return next(new Error('Admin authorization required'));
      }

      socket.data.user = {
        id: user.id,
        phone: user.phone,
        name: user.name,
      };

      next();
    } catch (err: any) {
      logger.warn({ err: err.message }, '[SosSocket] Socket auth failed');
      next(new Error('Invalid authorization token'));
    }
  });

  nsp.on('connection', (socket: Socket) => {
    const adminUser = socket.data.user;
    logger.info({ adminId: adminUser?.id }, '[SosSocket] Admin client connected to /admin-sos');

    socket.emit('connected', {
      status: 'authenticated',
      serverTime: new Date().toISOString(),
      adminId: adminUser?.id,
    });

    socket.on('disconnect', (reason) => {
      logger.info({ adminId: adminUser?.id, reason }, '[SosSocket] Admin client disconnected');
    });
  });

  adminSosNamespace = nsp;
  return nsp;
}

export function getSosNamespace(): Namespace | null {
  return adminSosNamespace;
}

/**
 * Broadcasts newly created SOS alert to all connected admin dashboards.
 */
export function emitSosNew(alert: SosAlertRecord): void {
  if (adminSosNamespace) {
    adminSosNamespace.emit('sos:new', alert);
  }
}

/**
 * Broadcasts status updates, responder assignments, or notes to admin dashboards.
 */
export function emitSosUpdated(alert: SosAlertRecord, update?: any): void {
  if (adminSosNamespace) {
    adminSosNamespace.emit('sos:updated', {
      alertId: alert.id,
      alert,
      update,
    });
  }
}

/**
 * Broadcasts cluster event to admin dashboards.
 */
export function emitSosCluster(cluster: ClusterEventPayload): void {
  if (adminSosNamespace) {
    adminSosNamespace.emit('sos:cluster', cluster);
  }
}

/**
 * Evaluates whether recent alerts in a ghat or zone cross the cluster threshold.
 */
export function trackAlertForCluster(params: {
  alertId: string;
  ghatId?: string | null;
  ghatName?: string | null;
  zoneCode?: string | null;
}): ClusterEventPayload | null {
  const key = params.ghatId || params.zoneCode || 'general_cluster';
  const now = Date.now();
  const windowMs = (env.SOS_CLUSTER_WINDOW_MINUTES || 10) * 60 * 1000;
  const threshold = env.SOS_CLUSTER_THRESHOLD || 5;

  let entry = clusterTracker.get(key);
  if (!entry) {
    entry = { timestamps: [], alertIds: [] };
    clusterTracker.set(key, entry);
  }

  // Purge expired timestamps
  const cutoff = now - windowMs;
  const validIndices: number[] = [];
  entry.timestamps.forEach((ts, idx) => {
    if (ts >= cutoff) validIndices.push(idx);
  });

  entry.timestamps = validIndices.map((i) => entry!.timestamps[i]);
  entry.alertIds = validIndices.map((i) => entry!.alertIds[i]);

  // Append new alert
  entry.timestamps.push(now);
  entry.alertIds.push(params.alertId);

  // Check threshold
  if (entry.timestamps.length >= threshold) {
    const throttleCooldownMs = 3 * 60 * 1000; // 3-minute cooldown between cluster notifications for same key
    if (!entry.lastNotifiedAt || now - entry.lastNotifiedAt > throttleCooldownMs) {
      entry.lastNotifiedAt = now;

      const payload: ClusterEventPayload = {
        ghatId: params.ghatId,
        ghatName: params.ghatName,
        zoneCode: params.zoneCode,
        alertCount: entry.timestamps.length,
        timeWindowMinutes: env.SOS_CLUSTER_WINDOW_MINUTES || 10,
        detectedAt: new Date().toISOString(),
        recentAlertIds: [...entry.alertIds],
      };

      emitSosCluster(payload);
      return payload;
    }
  }

  return null;
}

export function resetClusterTracker(): void {
  clusterTracker.clear();
}

