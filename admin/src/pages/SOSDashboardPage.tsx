import React, { useEffect, useState } from 'react';
import { socketClient } from '../services/socket';
import { EmergencyAlert } from '../types';
import { useAuth } from '../context/AuthContext';

export const SOSDashboardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    socketClient.connect();

    const unsubStatus = socketClient.onStatusChange((connected) => {
      setIsConnected(connected);
    });

    const unsubAlert = socketClient.onAlert((newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => {
      unsubStatus();
      unsubAlert();
    };
  }, []);

  const handleSimulate = () => {
    socketClient.triggerSimulatedAlert();
  };

  const handleUpdateStatus = (id: string, status: 'acknowledged' | 'resolved') => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  if (!hasPermission('sos.update') && !hasPermission('*')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your role lacks <code>sos.update</code> permission required to view real-time emergency dispatch.</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => a.status !== 'resolved');

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Live Emergency SOS Command
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '9999px',
                background: isConnected ? '#DCFCE7' : '#FEF3C7',
                color: isConnected ? '#15803D' : '#B45309',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isConnected ? '#22C55E' : '#F59E0B',
                  display: 'inline-block',
                }}
              />
              {isConnected ? 'Live WebSocket Connected' : 'Connecting / Mock Stream'}
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Real-time incident stream from pilgrim mobile app SOS button and ghat safety patrol sensors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? '🔔 Alert Sound: ON' : '🔕 Alert Sound: Muted'}
          </button>
          <button
            onClick={handleSimulate}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
            }}
          >
            ⚡ Simulate Incoming SOS Incident
          </button>
        </div>
      </div>

      {/* Active Alerts Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.75rem' }}>
          Active Incidents ({activeAlerts.length})
        </h2>

        {activeAlerts.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '3rem', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>✅</span>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>No active emergency incidents</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
              All monitored Godavari ghats report safe conditions. Click "Simulate Incoming SOS Incident" to test the pipeline.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeAlerts.map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isAcknowledged = alert.status === 'acknowledged';

              return (
                <div
                  key={alert.id}
                  style={{
                    backgroundColor: isCritical ? '#FFF5F5' : '#FFFFFF',
                    borderLeft: `6px solid ${isCritical ? '#DC2626' : '#EA580C'}`,
                    border: '1px solid #E2E8F0',
                    borderLeftWidth: '6px',
                    borderRadius: '8px',
                    padding: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isCritical ? '#DC2626' : '#EA580C',
                            color: '#FFFFFF',
                            textTransform: 'uppercase',
                          }}
                        >
                          {alert.severity}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                          {alert.ghatName}
                        </span>
                        {isAcknowledged && (
                          <span style={{ fontSize: '0.6875rem', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Acknowledged by Dispatch
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500, margin: '6px 0' }}>
                        {alert.message}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '16px' }}>
                        <span>⏱️ Reported: {new Date(alert.reportedAt).toLocaleTimeString()}</span>
                        <span>📍 GPS: {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}</span>
                        <span>🆔 Incident Ref: <code>{alert.id}</code></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isAcknowledged && (
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'acknowledged')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#16A34A',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolved History */}
      {alerts.some((a) => a.status === 'resolved') && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>
            Recently Resolved Incidents
          </h2>
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0.5rem' }}>
            {alerts
              .filter((a) => a.status === 'resolved')
              .map((alert) => (
                <div key={alert.id} style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#475569' }}>
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ Resolved:</span> {alert.ghatName} — {alert.message}
                  </span>
                  <span style={{ color: '#94A3B8' }}>{new Date(alert.reportedAt).toLocaleTimeString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

