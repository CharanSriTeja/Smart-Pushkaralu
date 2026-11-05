import React, { useState } from 'react';
import { TranslatableInput } from '../components/TranslatableInput';
import { LocalizedText } from '../types';
import { useAuth } from '../context/AuthContext';

export const NewsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [headline, setHeadline] = useState<LocalizedText>({
    en: 'Water Current Caution Issued for Pushkar Ghat',
    te: 'పుష్కర ఘాట్ వద్ద నీటి ప్రవాహం హెచ్చరిక జారీ చేయబడింది',
    hi: '',
  });
  const [body, setBody] = useState<LocalizedText>({
    en: 'District collector advises pilgrims to remain within the safety buoy line.',
    te: '',
    hi: '',
  });

  if (!hasPermission('news.publish')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your role lacks <code>news.publish</code> permission required to publish advisories.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Official News & Advisory Dispatch
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          Publish alerts and news items to pilgrim mobile devices. News columns use JSONB LocalizedText.
        </p>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '1.5rem', maxWidth: '780px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: '1rem' }}>
          Compose New Advisory
        </h2>

        <TranslatableInput
          label="Advisory Headline"
          value={headline}
          onChange={setHeadline}
          requiredLanguages={['en', 'te']}
        />

        <TranslatableInput
          label="Advisory Body"
          value={body}
          onChange={setBody}
          multiline
          requiredLanguages={['en']}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            onClick={() => alert('News published and broadcasted to FCM push topics!')}
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
            Publish & Broadcast via Push
          </button>
        </div>
      </div>
    </div>
  );
};

