import React from 'react';
import { tokens } from '../theme/tokens';

export interface MapPickerProps {
  latitude: number | string;
  longitude: number | string;
  onChange: (lat: number, lng: number) => void;
  label?: string;
  disabled?: boolean;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  onChange,
  label = 'Geographic Coordinates (WGS84)',
  disabled = false,
}) => {
  const numLat = typeof latitude === 'number' ? latitude : parseFloat(latitude) || 0;
  const numLng = typeof longitude === 'number' ? longitude : parseFloat(longitude) || 0;

  const handleLatChange = (val: string) => {
    const parsed = parseFloat(val);
    onChange(isNaN(parsed) ? 0 : parsed, numLng);
  };

  const handleLngChange = (val: string) => {
    const parsed = parseFloat(val);
    onChange(numLat, isNaN(parsed) ? 0 : parsed);
  };

  // Pushkaralu reference center (Rajahmundry Godavari river area)
  const setPresetRajahmundry = () => {
    onChange(17.0005, 81.7800);
  };

  const setPresetKotilingala = () => {
    onChange(17.0051, 81.7765);
  };

  const setPresetPushkarGhat = () => {
    onChange(16.9972, 81.7788);
  };

  return (
    <div
      style={{
        backgroundColor: tokens.colors.bgWarm,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: `${tokens.radii.md}px`,
        padding: '1rem',
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: '700',
          color: tokens.colors.textPrimary,
          marginBottom: '0.5rem',
        }}
      >
        📍 {label}
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: tokens.colors.textMuted, display: 'block', marginBottom: '4px' }}>
            Latitude (e.g. 17.0005)
          </span>
          <input
            type="number"
            step="any"
            disabled={disabled}
            value={latitude}
            onChange={(e) => handleLatChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '0.8125rem',
              borderRadius: `${tokens.radii.sm}px`,
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bg,
              color: tokens.colors.textPrimary,
            }}
          />
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: tokens.colors.textMuted, display: 'block', marginBottom: '4px' }}>
            Longitude (e.g. 81.7800)
          </span>
          <input
            type="number"
            step="any"
            disabled={disabled}
            value={longitude}
            onChange={(e) => handleLngChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '0.8125rem',
              borderRadius: `${tokens.radii.sm}px`,
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bg,
              color: tokens.colors.textPrimary,
            }}
          />
        </div>
      </div>

      {/* Quick Location Presets & External Map Check */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: tokens.colors.textMuted }}>Presets:</span>
          <button
            type="button"
            disabled={disabled}
            onClick={setPresetKotilingala}
            style={{
              padding: '3px 8px',
              fontSize: '0.6875rem',
              borderRadius: `${tokens.radii.sm}px`,
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bg,
              cursor: 'pointer',
            }}
          >
            Kotilingala
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={setPresetPushkarGhat}
            style={{
              padding: '3px 8px',
              fontSize: '0.6875rem',
              borderRadius: `${tokens.radii.sm}px`,
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bg,
              cursor: 'pointer',
            }}
          >
            Pushkar Ghat
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={setPresetRajahmundry}
            style={{
              padding: '3px 8px',
              fontSize: '0.6875rem',
              borderRadius: `${tokens.radii.sm}px`,
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bg,
              cursor: 'pointer',
            }}
          >
            Central Rajahmundry
          </button>
        </div>

        {numLat !== 0 && numLng !== 0 && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${numLat}&mlon=${numLng}#map=16/${numLat}/${numLng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem',
              color: tokens.colors.primary700,
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            View on OpenStreetMap ↗
          </a>
        )}
      </div>
    </div>
  );
};

