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
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        borderBottom: `2px solid ${tokens.colors.border}`,
        marginBottom: '1rem',
      }}
    >
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
            {/* Completeness indicator badge */}
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
  );
};

