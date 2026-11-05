import React, { useState } from 'react';
import { TranslatableInput } from '../components/TranslatableInput';
import { LocalizedText } from '../types';
import { useAuth } from '../context/AuthContext';

export const GhatsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [ghatName, setGhatName] = useState<LocalizedText>({
    en: 'Kotilingala Ghat',
    te: 'కోటిలింగాల ఘాట్',
    hi: 'कोटिश्र्वर घाट',
  });
  const [ghatDesc, setGhatDesc] = useState<LocalizedText>({
    en: 'Historical primary bathing ghat situated on the north bank of Godavari River.',
    te: 'గోదావరి నది ఉత్తర తీరంలో ఉన్న చారిత్రక ప్రధాన స్నాన ఘాట్.',
    hi: '',
  });

  if (!hasPermission('ghats.write')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your role lacks <code>ghats.write</code> permission required to edit ghat metadata.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Ghats Management & Metadata
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          Configure Godavari bathing ghats, coordinates, and multilingual pilgrim descriptions.
        </p>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '1.5rem', maxWidth: '780px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: '1rem' }}>
          Edit Ghat Details
        </h2>

        <TranslatableInput
          label="Ghat Name"
          value={ghatName}
          onChange={setGhatName}
          requiredLanguages={['en', 'te']}
          helperText="English is mandatory. Telugu is strongly recommended for local pilgrims."
        />

        <TranslatableInput
          label="Ghat Description & Facilities"
          value={ghatDesc}
          onChange={setGhatDesc}
          multiline
          requiredLanguages={['en']}
          helperText="Include water safety guidelines, changing room locations, and steps count."
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            onClick={() => alert('Ghat metadata saved!')}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              background: '#0F52BA',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Save Ghat Information
          </button>
        </div>
      </div>
    </div>
  );
};

