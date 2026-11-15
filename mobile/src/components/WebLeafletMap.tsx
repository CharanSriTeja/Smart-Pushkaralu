import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ghat } from '../types/ghats';
import { getLocalizedText } from '../utils/localized';

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  color?: string; // 'green' | 'orange' | 'purple' | 'red' | 'blue'
  icon?: string;
  badge?: string;
  actionUrl?: string;
  ghatId?: string;
}

export interface WebLeafletMapProps {
  ghats?: Ghat[];
  customMarkers?: MapMarkerItem[];
  polylineCoords?: Array<{ latitude: number; longitude: number }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  language?: string;
  onSelectGhat?: (ghatId: string) => void;
  style?: any;
}

export const WebLeafletMap: React.FC<WebLeafletMapProps> = ({
  ghats = [],
  customMarkers = [],
  polylineCoords = [],
  center = { lat: 17.0005, lng: 81.7725 },
  zoom = 9,
  language = 'en',
  onSelectGhat,
  style,
}) => {
  // Listen for postMessage from the iframe for in-app navigation
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (data && data.type === 'SELECT_GHAT' && data.id && onSelectGhat) {
          onSelectGhat(data.id);
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onSelectGhat]);

  const mapHtml = useMemo(() => {
    // Safe center & zoom
    const safeCenterLat = center && typeof center.lat === 'number' && !isNaN(center.lat) ? center.lat : 17.0005;
    const safeCenterLng = center && typeof center.lng === 'number' && !isNaN(center.lng) ? center.lng : 81.7725;
    const safeZoom = typeof zoom === 'number' && !isNaN(zoom) ? zoom : 9;

    // Convert ghats to marker data
    const ghatMarkersData = (ghats || [])
      .map((g) => {
        if (!g) return null;
        const lat = Number(g.lat ?? (g as any).latitude);
        const lng = Number(g.lng ?? (g as any).longitude);
        if (isNaN(lat) || isNaN(lng) || lat === 0) return null;

        const name = getLocalizedText(g.name, language as any) || 'Pushkaralu Ghat';
        let pinColor = '#16A34A'; // Green
        if (g.bathing_status === 'closed' || g.crowd_level === 'very_high') pinColor = '#DC2626';
        else if (g.bathing_status === 'restricted' || g.crowd_level === 'high') pinColor = '#EA580C';
        else if (g.crowd_level === 'medium') pinColor = '#CA8A04';

        return {
          id: g.id,
          lat,
          lng,
          name,
          district: `${g.district || ''} • ${g.state || ''}`,
          status: g.bathing_status || 'allowed',
          crowd: g.crowd_level || 'low',
          color: pinColor,
          directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        };
      })
      .filter(Boolean);

    const customMarkersData = (customMarkers || [])
      .map((m) => {
        if (!m) return null;
        const lat = Number(m.lat);
        const lng = Number(m.lng);
        if (isNaN(lat) || isNaN(lng) || lat === 0) return null;

        return {
          id: m.id || String(Math.random()),
          lat,
          lng,
          title: m.title || '',
          subtitle: m.subtitle || '',
          color: m.color || '#2563EB',
          badge: m.badge || '',
          actionUrl: m.actionUrl || '',
          ghatId: m.ghatId || '',
        };
      })
      .filter(Boolean);

    const polylineData = (polylineCoords || [])
      .map((c: any) => [Number(c.latitude ?? c.lat), Number(c.longitude ?? c.lng)])
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && lat !== 0);

    const ghatsJson = JSON.stringify(ghatMarkersData).replace(/<\/script/gi, '<\\/script');
    const customMarkersJson = JSON.stringify(customMarkersData).replace(/<\/script/gi, '<\\/script');
    const polylineJson = JSON.stringify(polylineData).replace(/<\/script/gi, '<\\/script');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .custom-pin {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2.5px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.35);
      cursor: pointer;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      padding: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .popup-card { padding: 4px; min-width: 190px; }
    .popup-title { font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
    .popup-sub { font-size: 11px; color: #64748B; margin-bottom: 6px; }
    .popup-tags { display: flex; gap: 4px; margin-bottom: 8px; }
    .popup-tag { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #F1F5F9; color: #334155; }
    .popup-actions { display: flex; gap: 6px; margin-top: 6px; }
    .btn-dir {
      background: #E65100;
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-view {
      background: #0F52BA;
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      border: none;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
    }
    .btn-gps-fab {
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #0F52BA;
      color: white;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .map-attribution {
      position: absolute;
      bottom: 4px;
      left: 10px;
      z-index: 999;
      background: rgba(255,255,255,0.85);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <button class="btn-gps-fab" title="Locate Me" onclick="locateUser()">🎯</button>
  <div class="map-attribution">© OpenStreetMap contributors • Smart Pushkaralu 2027</div>

  <script>
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${safeCenterLat}, ${safeCenterLng}], ${safeZoom});

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const ghats = ${ghatsJson};
    const customMarkers = ${customMarkersJson};
    const polyline = ${polylineJson};

    // Create colored circle pin icons
    function createPin(color) {
      return L.divIcon({
        className: 'custom-pin-wrap',
        html: '<div class="custom-pin" style="background-color:' + color + ';"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
    }

    // Render Ghat Markers
    ghats.forEach(function(g) {
      if (!g.lat || !g.lng) return;
      const marker = L.marker([g.lat, g.lng], { icon: createPin(g.color) }).addTo(map);

      const html = '<div class="popup-card">' +
        '<div class="popup-title">' + g.name + '</div>' +
        '<div class="popup-sub">' + g.district + '</div>' +
        '<div class="popup-tags">' +
          '<span class="popup-tag">Status: ' + g.status + '</span>' +
          '<span class="popup-tag">Crowd: ' + g.crowd + '</span>' +
        '</div>' +
        '<div class="popup-actions">' +
          '<a class="btn-dir" href="' + g.directionsUrl + '" target="_blank">🧭 Directions</a>' +
          '<button class="btn-view" onclick="selectGhat(\\'' + g.id + '\\')">View Details</button>' +
        '</div>' +
      '</div>';

      marker.bindPopup(html);
    });

    // Render Custom Markers (Origin, Destination, Temples, Closures)
    customMarkers.forEach(function(m) {
      if (!m.lat || !m.lng) return;
      const marker = L.marker([m.lat, m.lng], { icon: createPin(m.color) }).addTo(map);
      let html = '<div class="popup-card">' +
        '<div class="popup-title">' + m.title + '</div>';
      if (m.subtitle) html += '<div class="popup-sub">' + m.subtitle + '</div>';
      if (m.badge) html += '<div class="popup-tag">' + m.badge + '</div>';
      if (m.ghatId) {
        html += '<div class="popup-actions"><button class="btn-view" onclick="selectGhat(\\'' + m.ghatId + '\\')">View Ghat</button></div>';
      }
      html += '</div>';
      marker.bindPopup(html);
    });

    // Render Route Polyline
    if (polyline.length > 0) {
      const line = L.polyline(polyline, {
        color: '#E65100',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round'
      }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [40, 40] });
    }

    function selectGhat(id) {
      if (window.parent) {
        window.parent.postMessage({ type: 'SELECT_GHAT', id: id }, '*');
      }
    }

    function locateUser() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#2563EB',
            color: '#FFFFFF',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map).bindPopup("<b>You are here</b>").openPopup();
          map.setView([lat, lng], 13);
        });
      }
    }
  </script>
</body>
</html>`;
  }, [ghats, customMarkers, polylineCoords, center, zoom, language]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {React.createElement('iframe', {
        srcDoc: mapHtml,
        style: {
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        },
        title: 'OpenStreetMap Pushkaralu Ghats',
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
});
