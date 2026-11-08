import React, { useEffect, useState, useMemo } from 'react';
import { socketClient } from '../services/socket';
import { AdminApi } from '../services/adminApi';
import {
  SosAlertAdminRecord,
  SosUpdateAdminRecord,
  QrZoneAdminRecord,
  EmergencyContactAdminRecord,
  ClusterNotification,
} from '../types';
import { useAuth } from '../context/AuthContext';

export const SOSDashboardPage: React.FC = () => {
  const { hasPermission } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'alerts' | 'zones' | 'contacts'>('alerts');

  // Alerts state
  const [alerts, setAlerts] = useState<SosAlertAdminRecord[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<{
    alert: SosAlertAdminRecord;
    updates: SosUpdateAdminRecord[];
    duplicates: SosAlertAdminRecord[];
  } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Socket & connection state
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clusterNotice, setClusterNotice] = useState<ClusterNotification | null>(null);

  // Form states for actions
  const [newNote, setNewNote] = useState('');
  const [isPublicNote, setIsPublicNote] = useState(false);
  const [responderName, setResponderName] = useState('');
  const [responderPhone, setResponderPhone] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeReason, setMergeReason] = useState('');

  // QR Zones & Contacts state
  const [zones, setZones] = useState<QrZoneAdminRecord[]>([]);
  const [contacts, setContacts] = useState<EmergencyContactAdminRecord[]>([]);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneLabelEn, setNewZoneLabelEn] = useState('');
  const [newZoneLabelTe, setNewZoneLabelTe] = useState('');
  const [newZoneLabelHi, setNewZoneLabelHi] = useState('');

  // Initial load
  useEffect(() => {
    loadAlerts();
    loadZones();
    loadContacts();

    socketClient.connect();

    const unsubStatus = socketClient.onStatusChange((connected) => {
      setIsConnected(connected);
    });

    const unsubAlert = socketClient.onAlert((newAlert: SosAlertAdminRecord) => {
      setAlerts((prev) => {
        // Prevent duplicate append
        const exists = prev.some((a) => a.id === newAlert.id);
        if (exists) return prev.map((a) => (a.id === newAlert.id ? newAlert : a));
        return [newAlert, ...prev];
      });
    });

    const unsubUpdate = socketClient.onUpdate((data: { alertId: string; alert: SosAlertAdminRecord; update?: any }) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === data.alertId ? { ...a, ...data.alert } : a))
      );
      if (selectedAlertId === data.alertId) {
        loadSelectedAlertDetails(data.alertId);
      }
    });

    const unsubCluster = socketClient.onCluster((cluster) => {
      setClusterNotice(cluster);
    });

    return () => {
      unsubStatus();
      unsubAlert();
      unsubUpdate();
      unsubCluster();
    };
  }, [selectedAlertId]);

  const loadAlerts = async () => {
    try {
      const res = await AdminApi.getSosAlerts({ limit: 100 });
      setAlerts(res.data);
      if (res.data.length > 0 && !selectedAlertId) {
        setSelectedAlertId(res.data[0].id);
        loadSelectedAlertDetails(res.data[0].id);
      }
    } catch (_) {}
  };

  const loadSelectedAlertDetails = async (id: string) => {
    try {
      const data = await AdminApi.getSosAlertById(id);
      setSelectedAlertDetails(data);
    } catch (_) {}
  };

  const loadZones = async () => {
    try {
      const data = await AdminApi.getQrZones();
      setZones(data);
    } catch (_) {}
  };

  const loadContacts = async () => {
    try {
      const data = await AdminApi.getEmergencyContacts();
      setContacts(data);
    } catch (_) {}
  };

  const handleSelectAlert = (id: string) => {
    setSelectedAlertId(id);
    loadSelectedAlertDetails(id);
  };

  const handleStatusChange = async (status: string, noteText: string) => {
    if (!selectedAlertId) return;
    try {
      await AdminApi.updateSosStatus(selectedAlertId, status, noteText, true);
      loadSelectedAlertDetails(selectedAlertId);
      loadAlerts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertId || !newNote.trim()) return;
    try {
      await AdminApi.addSosNote(selectedAlertId, newNote.trim(), isPublicNote);
      setNewNote('');
      loadSelectedAlertDetails(selectedAlertId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignResponder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertId || !responderName.trim()) return;
    try {
      await AdminApi.assignSosResponder(selectedAlertId, responderName.trim(), responderPhone.trim());
      setResponderName('');
      setResponderPhone('');
      loadSelectedAlertDetails(selectedAlertId);
      loadAlerts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertId || !mergeTargetId || !mergeReason.trim()) return;
    try {
      await AdminApi.mergeSosAlerts(selectedAlertId, mergeTargetId, mergeReason.trim());
      setMergeTargetId('');
      setMergeReason('');
      loadAlerts();
      loadSelectedAlertDetails(selectedAlertId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneCode.trim() || !newZoneLabelEn.trim()) return;
    try {
      await AdminApi.createQrZone({
        zoneCode: newZoneCode.trim(),
        label: {
          en: newZoneLabelEn.trim(),
          te: newZoneLabelTe.trim() || undefined,
          hi: newZoneLabelHi.trim() || undefined,
        },
      });
      setIsAddingZone(false);
      setNewZoneCode('');
      setNewZoneLabelEn('');
      setNewZoneLabelTe('');
      setNewZoneLabelHi('');
      loadZones();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    socketClient.setSoundEnabled(next);
  };

  const handleExportCsv = () => {
    if (alerts.length === 0) {
      alert('No alerts to export.');
      return;
    }
    const headers = [
      'ID',
      'Type',
      'Status',
      'Severity',
      'Channel',
      'Phone',
      'Ghat Name',
      'Zone',
      'Assigned To',
      'Latitude',
      'Longitude',
      'Created At',
    ];
    const rows = alerts.map((a: any) => [
      a.id,
      a.type,
      a.status,
      a.severity,
      a.channel,
      a.phone || '',
      typeof a.ghat_name === 'object' ? a.ghat_name?.en || '' : a.ghat_name || '',
      a.zone_code || '',
      a.assigned_to_name ? `${a.assigned_to_name} (${a.assigned_to_phone || ''})` : '',
      a.lat ?? '',
      a.lng ?? '',
      a.created_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pushkaralu_sos_incident_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      return true;
    });
  }, [alerts, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      new: alerts.filter((a) => a.status === 'new').length,
      dispatched: alerts.filter((a) => a.status === 'dispatched' || a.status === 'acknowledged').length,
      resolved: alerts.filter((a) => a.status === 'resolved').length,
    };
  }, [alerts]);

  const canEdit = hasPermission('sos.update') || hasPermission('*');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              🚨 Emergency SOS Command Center
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                background: isConnected ? '#DCFCE7' : '#FEE2E2',
                color: isConnected ? '#15803D' : '#991B1B',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isConnected ? '#22C55E' : '#DC2626',
                  display: 'inline-block',
                }}
              />
              {isConnected ? 'Socket Connected' : 'Disconnected (Reconnecting...)'}
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Live triage & dispatch for pilgrim SOS alerts, QR poster scans, and SMS helpline integrations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleExportCsv}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📥 Export CSV
          </button>

          <button
            onClick={toggleSound}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? '🔔 Chime: ON' : '🔕 Chime: Muted'}
          </button>

          <button
            onClick={loadAlerts}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#F8FAFC',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Disconnection Warning Banner */}
      {!isConnected && (
        <div
          style={{
            background: '#FEE2E2',
            border: '2px solid #EF4444',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '1rem',
            color: '#991B1B',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>⚠️ Disconnected from emergency socket stream. Retrying connection in background...</div>
          <button
            onClick={() => socketClient.connect()}
            style={{
              padding: '4px 10px',
              background: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* Cluster Notification Alert Banner */}
      {clusterNotice && (
        <div
          style={{
            background: '#FEF3C7',
            border: '2px solid #F59E0B',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: '#92400E', fontSize: '1rem' }}>
              ⚡ HIGH INCIDENT DENSITY DETECTED (Cluster Triggered)
            </div>
            <div style={{ color: '#78350F', fontSize: '0.875rem', marginTop: '2px' }}>
              <strong>{clusterNotice.alertCount} emergency alerts</strong> received in the last{' '}
              {clusterNotice.timeWindowMinutes} minutes at {clusterNotice.ghatName || clusterNotice.zoneCode || 'monitored sector'}.
              Deploy additional crowd safety personnel immediately.
            </div>
          </div>
          <button
            onClick={() => setClusterNotice(null)}
            style={{
              background: '#F59E0B',
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'alerts' ? '3px solid #DC2626' : '3px solid transparent',
            color: activeTab === 'alerts' ? '#DC2626' : '#64748B',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Active Incidents Stream ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'zones' ? '3px solid #DC2626' : '3px solid transparent',
            color: activeTab === 'zones' ? '#DC2626' : '#64748B',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          QR Zones & Posters ({zones.length})
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'contacts' ? '3px solid #DC2626' : '3px solid transparent',
            color: activeTab === 'contacts' ? '#DC2626' : '#64748B',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Emergency Contacts ({contacts.length})
        </button>
      </div>

      {/* TAB 1: ALERTS STREAM */}
      {activeTab === 'alerts' && (
        <div>
          {/* Summary Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>TOTAL ALERTS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>{stats.total}</div>
            </div>
            <div style={{ background: '#FEF2F2', padding: '14px', borderRadius: '8px', border: '1px solid #FECACA' }}>
              <div style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 700 }}>NEW / UNTRIAGED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#DC2626' }}>{stats.new}</div>
            </div>
            <div style={{ background: '#FFFBEB', padding: '14px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 700 }}>DISPATCHED / IN PROGRESS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706' }}>{stats.dispatched}</div>
            </div>
            <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>RESOLVED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A' }}>{stats.resolved}</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Filter By:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New (Untriaged)</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="dispatched">Dispatched</option>
              <option value="resolved">Resolved</option>
              <option value="false_alarm">False Alarm</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            >
              <option value="all">All Categories</option>
              <option value="medical">Medical 🚑</option>
              <option value="police">Police 👮</option>
              <option value="fire">Fire 🚒</option>
              <option value="lost_person">Lost Person 🧒</option>
              <option value="general">General 🆘</option>
            </select>
          </div>

          {/* 2-Column Incident Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '16px' }}>
            {/* Left Column: Incidents List */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '12px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '8px', fontSize: '0.9rem' }}>
                Incident Feed ({filteredAlerts.length})
              </div>

              {filteredAlerts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                  No incidents match the active filters.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredAlerts.map((alert) => {
                    const isSelected = alert.id === selectedAlertId;
                    const isNew = alert.status === 'new';

                    return (
                      <div
                        key={alert.id}
                        onClick={() => handleSelectAlert(alert.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #DC2626' : '1px solid #E2E8F0',
                          background: isSelected ? '#FEF2F2' : isNew ? '#FFFBEB' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: alert.severity === 1 ? '#DC2626' : alert.severity === 2 ? '#EA580C' : '#64748B',
                              color: '#FFFFFF',
                              textTransform: 'uppercase',
                            }}
                          >
                            Sev {alert.severity} • {alert.type}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', margin: '4px 0' }}>
                          {alert.ghat_name?.en || alert.zone_code || 'Ghat Location'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                          <span>Via {alert.channel.toUpperCase()}</span>
                          <span style={{ fontWeight: 700, color: alert.status === 'new' ? '#DC2626' : '#0F172A' }}>
                            {alert.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Detail & Action Panel */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px' }}>
              {selectedAlertDetails ? (
                <div>
                  {/* Top Bar Details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                          Incident Ref #{selectedAlertDetails.alert.id.slice(0, 8)}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            background: selectedAlertDetails.alert.status === 'new' ? '#FEE2E2' : '#DCFCE7',
                            color: selectedAlertDetails.alert.status === 'new' ? '#991B1B' : '#166534',
                          }}
                        >
                          {selectedAlertDetails.alert.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                        Type: <strong>{selectedAlertDetails.alert.type.toUpperCase()}</strong> | Channel: <strong>{selectedAlertDetails.alert.channel}</strong> | Reported: {new Date(selectedAlertDetails.alert.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Quick Call */}
                    {selectedAlertDetails.alert.phone && (
                      <a
                        href={`tel:${selectedAlertDetails.alert.phone}`}
                        style={{
                          background: '#DC2626',
                          color: '#FFFFFF',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        📞 Call Pilgrim ({selectedAlertDetails.alert.phone})
                      </a>
                    )}
                  </div>

                  {/* Incident GPS Location & Live Interactive Map */}
                  {selectedAlertDetails.alert.lat && selectedAlertDetails.alert.lng ? (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                            📍 Incident Location: {Number(selectedAlertDetails.alert.lat).toFixed(5)}, {Number(selectedAlertDetails.alert.lng).toFixed(5)}
                          </span>
                          {selectedAlertDetails.alert.accuracy_m ? (
                            <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '6px' }}>
                              (GPS Accuracy: ±{Math.round(selectedAlertDetails.alert.accuracy_m)}m)
                            </span>
                          ) : null}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedAlertDetails.alert.lat},${selectedAlertDetails.alert.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#0F52BA',
                              color: 'white',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            🧭 Google Maps Route
                          </a>
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${selectedAlertDetails.alert.lat}&mlon=${selectedAlertDetails.alert.lng}#map=17/${selectedAlertDetails.alert.lat}/${selectedAlertDetails.alert.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#16A34A',
                              color: 'white',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            🌍 OpenStreetMap
                          </a>
                        </div>
                      </div>

                      <div style={{ height: '180px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                        <iframe
                          title="OpenStreetMap Incident Location"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight={0}
                          marginWidth={0}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(selectedAlertDetails.alert.lng) - 0.005}%2C${Number(selectedAlertDetails.alert.lat) - 0.003}%2C${Number(selectedAlertDetails.alert.lng) + 0.005}%2C${Number(selectedAlertDetails.alert.lat) + 0.003}&layer=mapnik&marker=${selectedAlertDetails.alert.lat}%2C${selectedAlertDetails.alert.lng}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.8rem', color: '#64748B' }}>
                      📍 Location: Linked to <strong>{selectedAlertDetails.alert.zone_code || selectedAlertDetails.alert.ghat_name?.en || 'General Sector'}</strong> (GPS coordinates not provided by reporter).
                    </div>
                  )}

                  {/* Status Progression Buttons */}
                  {canEdit && (
                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Update Status:</span>
                      <button
                        onClick={() => handleStatusChange('acknowledged', 'Control room acknowledged emergency alert.')}
                        style={{ padding: '6px 12px', background: '#DBEAFE', color: '#1E40AF', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleStatusChange('dispatched', 'First responder & ambulance dispatched.')}
                        style={{ padding: '6px 12px', background: '#FFEDD5', color: '#9A3412', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Dispatch Team
                      </button>
                      <button
                        onClick={() => handleStatusChange('resolved', 'Incident addressed and verified resolved by ground patrol.')}
                        style={{ padding: '6px 12px', background: '#DCFCE7', color: '#166534', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ✓ Mark Resolved
                      </button>
                      <button
                        onClick={() => handleStatusChange('false_alarm', 'Closed as false alarm or accidental scan.')}
                        style={{ padding: '6px 12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Mark False Alarm
                      </button>
                    </div>
                  )}

                  {/* Assign Responder & Duplicates Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {/* Assign Responder */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: '#0F172A' }}>
                        Assign Responder / Team
                      </div>
                      {selectedAlertDetails.alert.assigned_to_name && (
                        <div style={{ fontSize: '0.8rem', background: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                          Current: <strong>{selectedAlertDetails.alert.assigned_to_name}</strong> ({selectedAlertDetails.alert.assigned_to_phone || 'No phone'})
                        </div>
                      )}
                      <form onSubmit={handleAssignResponder} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Officer / Volunteer Name"
                          value={responderName}
                          onChange={(e) => setResponderName(e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Phone Number (e.g. +91...)"
                          value={responderPhone}
                          onChange={(e) => setResponderPhone(e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                        />
                        <button
                          type="submit"
                          style={{ padding: '6px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Assign Responder
                        </button>
                      </form>
                    </div>

                    {/* Merge Duplicates */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: '#0F172A' }}>
                        Merge Duplicate Alert
                      </div>
                      <form onSubmit={handleMerge} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <select
                          value={mergeTargetId}
                          onChange={(e) => setMergeTargetId(e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                        >
                          <option value="">Select Target Primary Alert...</option>
                          {alerts
                            .filter((a) => a.id !== selectedAlertId && a.status !== 'resolved')
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                #{a.id.slice(0, 8)} - {a.type} ({a.ghat_name?.en || a.zone_code || 'Ghat'})
                              </option>
                            ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Merge Reason (e.g. Same incident caller)"
                          value={mergeReason}
                          onChange={(e) => setMergeReason(e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                        />
                        <button
                          type="submit"
                          style={{ padding: '6px', background: '#475569', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Merge into Target
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Updates & Notes Feed */}
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', color: '#0F172A' }}>
                      Incident Log & Timeline
                    </div>

                    <div style={{ maxHeight: 180, overflowY: 'auto', background: '#F8FAFC', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
                      {selectedAlertDetails.updates.map((u) => (
                        <div key={u.id} style={{ borderBottom: '1px solid #E2E8F0', padding: '6px 0', fontSize: '0.8rem' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>
                            {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          </span>
                          <span style={{ fontWeight: 700, color: u.is_public ? '#15803D' : '#64748B' }}>
                            [{u.is_public ? 'Public Note' : 'Internal Note'}]
                          </span>{' '}
                          <span style={{ color: '#1E293B' }}>{u.note}</span>
                        </div>
                      ))}
                    </div>

                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Add dispatch note or update..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isPublicNote}
                          onChange={(e) => setIsPublicNote(e.target.checked)}
                        />
                        Send to Pilgrim
                      </label>
                      <button
                        type="submit"
                        style={{ padding: '8px 14px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        Add Note
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                  Select an incident from the left feed to view full details and dispatch actions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QR ZONES MANAGEMENT */}
      {activeTab === 'zones' && (
        <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              QR Emergency Zones ({zones.length})
            </h2>
            <button
              onClick={() => setIsAddingZone(!isAddingZone)}
              style={{
                padding: '8px 14px',
                background: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {isAddingZone ? 'Cancel' : '+ Add New QR Zone'}
            </button>
          </div>

          {isAddingZone && (
            <form onSubmit={handleCreateZone} style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>Register New Sector / Gate Zone</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Zone Code (e.g. G08, GATE-SOUTH)"
                  value={newZoneCode}
                  onChange={(e) => setNewZoneCode(e.target.value)}
                  required
                  style={{ padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                <input
                  type="text"
                  placeholder="Label English (e.g. South Changing Enclosure)"
                  value={newZoneLabelEn}
                  onChange={(e) => setNewZoneLabelEn(e.target.value)}
                  required
                  style={{ padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                <input
                  type="text"
                  placeholder="Label Telugu"
                  value={newZoneLabelTe}
                  onChange={(e) => setNewZoneLabelTe(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                <input
                  type="text"
                  placeholder="Label Hindi"
                  value={newZoneLabelHi}
                  onChange={(e) => setNewZoneLabelHi(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
              <button
                type="submit"
                style={{ padding: '8px 16px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 700, alignSelf: 'flex-start', cursor: 'pointer' }}
              >
                Save Zone
              </button>
            </form>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '10px' }}>Zone Code</th>
                <th style={{ padding: '10px' }}>Sector Label</th>
                <th style={{ padding: '10px' }}>Coordinates</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Print Poster</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px', fontWeight: 800, color: '#0F172A' }}>{z.zone_code}</td>
                  <td style={{ padding: '10px' }}>{z.label.en}</td>
                  <td style={{ padding: '10px', color: '#64748B' }}>
                    {z.lat ? `${Number(z.lat).toFixed(4)}, ${Number(z.lng).toFixed(4)}` : 'Not specified'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: z.active ? '#15803D' : '#991B1B', fontWeight: 700 }}>
                      {z.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <a
                      href={`/v1/admin/sos/zones/${z.zone_code}/poster`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '6px 12px',
                        background: '#DC2626',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      🖨️ View Poster
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: EMERGENCY CONTACTS */}
      {activeTab === 'contacts' && (
        <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Official Helplines & Emergency Contacts ({contacts.length})
            </h2>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '10px' }}>Priority</th>
                <th style={{ padding: '10px' }}>Helpline / Agency</th>
                <th style={{ padding: '10px' }}>Telephone Number</th>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px', fontWeight: 700 }}>#{c.sort_order}</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: '#0F172A' }}>
                    {c.label.en} {c.phone === '112' ? '⭐ (National Default)' : ''}
                  </td>
                  <td style={{ padding: '10px', fontWeight: 800, color: '#DC2626' }}>{c.phone}</td>
                  <td style={{ padding: '10px', textTransform: 'capitalize' }}>{c.kind}</td>
                  <td style={{ padding: '10px', color: '#15803D', fontWeight: 700 }}>Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
