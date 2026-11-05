import React, { useState } from 'react';
import { LocalizedText } from '../types';

export interface TranslatableInputProps {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
  requiredLanguages?: ('en' | 'te' | 'hi')[];
  placeholder?: string;
  helperText?: string;
}

export const TranslatableInput: React.FC<TranslatableInputProps> = ({
  label,
  value,
  onChange,
  multiline = false,
  requiredLanguages = ['en'],
  placeholder,
  helperText,
}) => {
  const [activeTab, setActiveTab] = useState<'en' | 'te' | 'hi'>('en');
  const [viewMode, setViewMode] = useState<'tabs' | 'split'>('tabs');

  const handleChange = (lang: 'en' | 'te' | 'hi', text: string) => {
    onChange({
      ...value,
      [lang]: text,
    });
  };

  const getStatus = (lang: 'en' | 'te' | 'hi') => {
    const text = value[lang]?.trim();
    const isRequired = requiredLanguages.includes(lang);

    if (text && text.length > 0) {
      return { status: 'complete', label: '✓ Filled', color: '#16A34A', bg: '#DCFCE7' };
    }
    if (isRequired) {
      return { status: 'missing_required', label: '⚠️ Required', color: '#DC2626', bg: '#FEE2E2' };
    }
    return { status: 'optional_empty', label: '○ Empty', color: '#94A3B8', bg: '#F1F5F9' };
  };

  const languages: { code: 'en' | 'te' | 'hi'; label: string; script: string }[] = [
    { code: 'en', label: 'English', script: 'English (EN)' },
    { code: 'te', label: 'Telugu', script: 'తెలుగు (TE)' },
    { code: 'hi', label: 'Hindi', script: 'हिन्दी (HI)' },
  ];

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>
          {label} {requiredLanguages.includes('en') && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'tabs' ? 'split' : 'tabs')}
          style={{
            fontSize: '0.75rem',
            background: 'none',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            padding: '2px 8px',
            cursor: 'pointer',
            color: '#475569',
          }}
        >
          {viewMode === 'tabs' ? '⊞ Side-by-Side View' : '⊟ Tabs View'}
        </button>
      </div>

      {viewMode === 'tabs' ? (
        <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Language Tabs */}
          <div style={{ display: 'flex', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            {languages.map((l) => {
              const info = getStatus(l.code);
              const isActive = activeTab === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setActiveTab(l.code)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #0F52BA' : '2px solid transparent',
                    background: isActive ? '#FFFFFF' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8125rem',
                    color: isActive ? '#0F52BA' : '#475569',
                  }}
                >
                  <span>{l.script}</span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: info.bg,
                      color: info.color,
                      fontWeight: 600,
                    }}
                  >
                    {info.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Input */}
          <div style={{ padding: '0.75rem' }}>
            {multiline ? (
              <textarea
                value={value[activeTab] || ''}
                onChange={(e) => handleChange(activeTab, e.target.value)}
                placeholder={placeholder || `Enter translation in ${languages.find((l) => l.code === activeTab)?.label}...`}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: activeTab === 'te' ? "'Noto Sans Telugu', sans-serif" : activeTab === 'hi' ? "'Noto Sans Devanagari', sans-serif" : 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <input
                type="text"
                value={value[activeTab] || ''}
                onChange={(e) => handleChange(activeTab, e.target.value)}
                placeholder={placeholder || `Enter translation in ${languages.find((l) => l.code === activeTab)?.label}...`}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: activeTab === 'te' ? "'Noto Sans Telugu', sans-serif" : activeTab === 'hi' ? "'Noto Sans Devanagari', sans-serif" : 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        </div>
      ) : (
        /* Side by side layout */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {languages.map((l) => {
            const info = getStatus(l.code);
            return (
              <div key={l.code} style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '10px', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{l.script}</span>
                  <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px', background: info.bg, color: info.color, fontWeight: 600 }}>
                    {info.label}
                  </span>
                </div>
                {multiline ? (
                  <textarea
                    value={value[l.code] || ''}
                    onChange={(e) => handleChange(l.code, e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: l.code === 'te' ? "'Noto Sans Telugu', sans-serif" : l.code === 'hi' ? "'Noto Sans Devanagari', sans-serif" : 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={value[l.code] || ''}
                    onChange={(e) => handleChange(l.code, e.target.value)}
                    style={{
                      width: '100%',
                      height: '34px',
                      padding: '4px 8px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: l.code === 'te' ? "'Noto Sans Telugu', sans-serif" : l.code === 'hi' ? "'Noto Sans Devanagari', sans-serif" : 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {helperText && (
        <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};

