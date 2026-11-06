import React, { useState } from 'react';
import { Ghat } from '../types';
import { AdminApi } from '../services/adminApi';

interface Props {
  ghat?: Ghat | null;
  onCancel: () => void;
  onSaved: () => void;
}

export const GhatFormPage: React.FC<Props> = ({ ghat, onCancel, onSaved }) => {
  const isEdit = !!ghat;

  // Multi-language form fields
  const [nameEn, setNameEn] = useState(ghat?.name.en || '');
  const [nameTe, setNameTe] = useState(ghat?.name.te || '');
  const [nameHi, setNameHi] = useState(ghat?.name.hi || '');

  const [river, setRiver] = useState(ghat?.river || 'Godavari');
  const [district, setDistrict] = useState(ghat?.district || 'East Godavari');
  const [state, setState] = useState(ghat?.state || 'Andhra Pradesh');

  const [lat, setLat] = useState(ghat?.lat?.toString() || '16.9922');
  const [lng, setLng] = useState(ghat?.lng?.toString() || '81.7656');

  const [townEn, setTownEn] = useState(ghat?.nearest_town.en || '');
  const [townTe, setTownTe] = useState(ghat?.nearest_town.te || '');
  const [townHi, setTownHi] = useState(ghat?.nearest_town.hi || '');

  const [railwayEn, setRailwayEn] = useState(ghat?.nearest_railway_station.en || '');
  const [railwayTe, setRailwayTe] = useState(ghat?.nearest_railway_station.te || '');
  const [railwayHi, setRailwayHi] = useState(ghat?.nearest_railway_station.hi || '');

  const [busEn, setBusEn] = useState(ghat?.nearest_bus_stand.en || '');
  const [busTe, setBusTe] = useState(ghat?.nearest_bus_stand.te || '');
  const [busHi, setBusHi] = useState(ghat?.nearest_bus_stand.hi || '');

  const [officialSourceUrl, setOfficialSourceUrl] = useState(ghat?.official_source_url || '');
  const [recordStatus, setRecordStatus] = useState(ghat?.record_status || 'unverified');
  const [bathingStatus, setBathingStatus] = useState(ghat?.bathing_status || 'allowed');
  const [crowdLevel, setCrowdLevel] = useState(ghat?.crowd_level || 'low');
  const [publishStatus, setPublishStatus] = useState(ghat?.publish_status || 'published');

  const [descEn, setDescEn] = useState(ghat?.description?.en || '');
  const [descTe, setDescTe] = useState(ghat?.description?.te || '');
  const [descHi, setDescHi] = useState(ghat?.description?.hi || '');

  // Mandatory audit reason
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isGovDomain = (url: string) => {
    try {
      const u = new URL(url.trim());
      const h = u.hostname.toLowerCase();
      return h.endsWith('.gov.in') || h.endsWith('.nic.in');
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Strict validation
    if (!nameEn.trim()) {
      setError('English Ghat Name is strictly required.');
      return;
    }

    if (recordStatus === 'officially_listed') {
      if (!officialSourceUrl.trim() || !isGovDomain(officialSourceUrl)) {
        setError(
          'CRITICAL RULE VIOLATION: A ghat cannot be set to "Officially Listed" without a verified government or district administration portal URL (.gov.in / .nic.in). Change status to "reported" or "unverified", or provide an authentic government source.'
        );
        return;
      }
    }

    if (!reason.trim() || reason.trim().length < 5) {
      setError('Mandatory audit reason of at least 5 characters is required for accountability.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: { en: nameEn.trim(), te: nameTe.trim() || undefined, hi: nameHi.trim() || undefined },
      river: river.trim(),
      district: district.trim(),
      state: state.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      nearest_town: { en: townEn.trim(), te: townTe.trim() || undefined, hi: townHi.trim() || undefined },
      nearest_railway_station: { en: railwayEn.trim(), te: railwayTe.trim() || undefined, hi: railwayHi.trim() || undefined },
      nearest_bus_stand: { en: busEn.trim(), te: busTe.trim() || undefined, hi: busHi.trim() || undefined },
      official_source_url: officialSourceUrl.trim() || null,
      record_status: recordStatus,
      bathing_status: bathingStatus,
      crowd_level: crowdLevel,
      publish_status: publishStatus,
      description: { en: descEn.trim(), te: descTe.trim() || undefined, hi: descHi.trim() || undefined },
      reason: reason.trim(),
    };

    try {
      if (isEdit) {
        await AdminApi.updateGhat(ghat.id, payload);
        alert('Ghat updated and recorded in audit logs.');
      } else {
        await AdminApi.createGhat(payload);
        alert('New ghat created and recorded in audit logs.');
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save ghat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>
            {isEdit ? `Edit Ghat: ${ghat.name.en}` : 'Add New Pushkaralu Ghat'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B' }}>
            Provide multi-language names and verified administrative details. All changes are logged.
          </p>
        </div>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          padding: '14px',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Multi-language Names */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
            1. Ghat Name (Multi-Language: Telugu, English, Hindi)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                English Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kotilingala Ghat"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Telugu (తెలుగు)
              </label>
              <input
                type="text"
                placeholder="ఉదా. కోటిలింగాల ఘాట్"
                value={nameTe}
                onChange={(e) => setNameTe(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Hindi (हिन्दी)
              </label>
              <input
                type="text"
                placeholder="उदा. कोटिलिंगला घाट"
                value={nameHi}
                onChange={(e) => setNameHi(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Location & Coordinates */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
            2. Location & Geographic Coordinates
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                River
              </label>
              <input
                type="text"
                value={river}
                onChange={(e) => setRiver(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                District *
              </label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  if (['East Godavari', 'West Godavari', 'Dr. B.R. Ambedkar Konaseema'].includes(e.target.value)) {
                    setState('Andhra Pradesh');
                  } else {
                    setState('Telangana');
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFF' }}
              >
                <option value="East Godavari">East Godavari (AP)</option>
                <option value="West Godavari">West Godavari (AP)</option>
                <option value="Dr. B.R. Ambedkar Konaseema">Dr. B.R. Ambedkar Konaseema (AP)</option>
                <option value="Bhadradri Kothagudem">Bhadradri Kothagudem (TS)</option>
                <option value="Jagtial">Jagtial (TS)</option>
                <option value="Nirmal">Nirmal (TS)</option>
                <option value="Jayashankar Bhupalpally">Jayashankar Bhupalpally (TS)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                State *
              </label>
              <input
                type="text"
                value={state}
                readOnly
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Latitude (lat) *
              </label>
              <input
                type="number"
                step="0.0000001"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Longitude (lng) *
              </label>
              <input
                type="number"
                step="0.0000001"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Official Verification & Trust */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
            3. Official Trust & Government Verification
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Record Trust Status *
              </label>
              <select
                value={recordStatus}
                onChange={(e) => setRecordStatus(e.target.value as any)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFF' }}
              >
                <option value="officially_listed">✓ Officially Listed (Requires .gov.in URL)</option>
                <option value="reported">👥 Community Reported</option>
                <option value="unverified">⚠️ Unverified</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Official Government / District Portal Source URL:
              </label>
              <input
                type="url"
                placeholder="https://eastgodavari.ap.gov.in/pushkaralu"
                value={officialSourceUrl}
                onChange={(e) => setOfficialSourceUrl(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px' }}>
            🛡️ <strong>Rule Reminder:</strong> An entry cannot be marked <em>"Officially Listed"</em> unless backed by an authentic government domain (.gov.in or .nic.in). Unverified ghats must be left as unverified without fabricated sources.
          </div>
        </div>

        {/* Section 4: Operational Status */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
            4. Bathing, Crowd, and Publication Status
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Bathing Status
              </label>
              <select
                value={bathingStatus}
                onChange={(e) => setBathingStatus(e.target.value as any)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFF' }}
              >
                <option value="allowed">Allowed (Safe)</option>
                <option value="restricted">Restricted (High Current)</option>
                <option value="closed">Closed (Dangerous)</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Crowd Density
              </label>
              <select
                value={crowdLevel}
                onChange={(e) => setCrowdLevel(e.target.value as any)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFF' }}
              >
                <option value="low">Low (&lt;30%)</option>
                <option value="medium">Medium (30-60%)</option>
                <option value="high">High (60-85%)</option>
                <option value="very_high">Very High (&gt;85%)</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Publication Status
              </label>
              <select
                value={publishStatus}
                onChange={(e) => setPublishStatus(e.target.value as any)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFF' }}
              >
                <option value="published">Published (Visible to Pilgrims)</option>
                <option value="hidden">Hidden</option>
                <option value="draft">Draft (Under Review)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Nearest Stations & Towns */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
            5. Connectivity (Town, Railway, Bus Stand)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Nearest Town (EN) *"
                required
                value={townEn}
                onChange={(e) => setTownEn(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <input
                type="text"
                placeholder="Nearest Town (TE)"
                value={townTe}
                onChange={(e) => setTownTe(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <input
                type="text"
                placeholder="Nearest Town (HI)"
                value={townHi}
                onChange={(e) => setTownHi(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Nearest Railway Station (EN) *"
                required
                value={railwayEn}
                onChange={(e) => setRailwayEn(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <input
                type="text"
                placeholder="Railway Station (TE)"
                value={railwayTe}
                onChange={(e) => setRailwayTe(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <input
                type="text"
                placeholder="Railway Station (HI)"
                value={railwayHi}
                onChange={(e) => setRailwayHi(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Nearest Bus Stand (EN) *"
                required
                value={busEn}
                onChange={(e) => setBusEn(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <input
                type="text"
                placeholder="Bus Stand (TE)"
                value={busTe}
                onChange={(e) => setBusTe(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <input
                type="text"
                placeholder="Bus Stand (HI)"
                value={busHi}
                onChange={(e) => setBusHi(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>

        {/* Section 5b: Description (Optional) */}
        <div style={{ borderTop: '1.5px solid #F1F5F9', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
            Historical & Pilgrimage Description (Optional)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <textarea
              rows={2}
              placeholder="Description (English)"
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            />
            <textarea
              rows={2}
              placeholder="వివరణ (తెలుగు)"
              value={descTe}
              onChange={(e) => setDescTe(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            />
            <textarea
              rows={2}
              placeholder="विवरण (हिन्दी)"
              value={descHi}
              onChange={(e) => setDescHi(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Section 6: Mandatory Audit Reason */}
        <div style={{ borderTop: '1.5px solid #F1F5F9', paddingTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#DC2626', marginBottom: '6px' }}>
            * Mandatory Audit Reason (Logged in audit_logs registry):
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Official Pushkaralu master plan update approved by District Collector..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px 24px',
              backgroundColor: '#0F52BA',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {isSubmitting ? 'Saving & Auditing...' : isEdit ? 'Update Ghat & Log Audit' : 'Create Ghat & Log Audit'}
          </button>
        </div>
      </form>
    </div>
  );
};

