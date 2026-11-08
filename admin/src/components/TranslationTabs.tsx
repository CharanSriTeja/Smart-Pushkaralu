import React from 'react';
import { tokens } from '../theme/tokens';

export type LanguageCode = 'en' | 'te' | 'hi';

export interface TranslationStatus {
  en?: boolean;
  te?: boolean;
  hi?: boolean;
}

export interface TranslationTabsProps {
  activeTab: LanguageCode;
  onTabChange: (tab: LanguageCode) => void;
  status?: TranslationStatus;
}

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
];

export const TranslationTabs: React.FC<TranslationTabsProps> = ({
  activeTab,
  onTabChange,
  status = {},
}) => {
  const completedCount = ['en', 'te', 'hi'].filter(
    (k) => status[k as LanguageCode] === true || (status[k as LanguageCode] === undefined && k === 'en')
  ).length;

  let badgeColor = tokens.colors.danger;
  let badgeBg = '#FEE2E2';
  if (completedCount === 3) {
    badgeColor = tokens.colors.success;
    badgeBg = '#DCFCE7';
  } else if (completedCount === 2) {
    badgeColor = tokens.colors.warning;
    badgeBg = '#FEF3C7';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `2px solid ${tokens.colors.border}`,
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', gap: '4px' }}>
        {LANGUAGES.map((lang) => {
          const isActive = activeTab === lang.code;
          const isComplete = status[lang.code] !== false;

          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onTabChange(lang.code)}
              style={{
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? tokens.colors.primary700 : tokens.colors.textMuted,
                backgroundColor: isActive ? tokens.colors.primary50 : 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${tokens.colors.primary700}` : '2px solid transparent',
                marginBottom: '-2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: `${tokens.radii.sm}px ${tokens.radii.sm}px 0 0`,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{lang.native}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({lang.label})</span>
              <span
                title={isComplete ? 'Translation provided' : 'Translation missing / incomplete'}
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isComplete ? tokens.colors.success : tokens.colors.warning,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Completion Badge (3/3 green, 2/3 amber, 1/3 red) */}
      <div
        title={`${completedCount} of 3 translations provided`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '9999px',
          backgroundColor: badgeBg,
          color: badgeColor,
          fontSize: '0.75rem',
          fontWeight: '700',
          marginBottom: '4px',
        }}
      >
        <span>🌐</span>
        <span>{completedCount}/3 Translations</span>
      </div>
    </div>
  );
};
