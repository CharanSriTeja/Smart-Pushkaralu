import React from 'react';
import { RecordStatus } from '../types';

interface Props {
  recordStatus: RecordStatus;
  officialSourceUrl?: string | null;
}

export const TrustStatusBadge: React.FC<Props> = ({ recordStatus, officialSourceUrl }) => {
  // Strict rule: Must have recordStatus === 'officially_listed' AND officialSourceUrl must be present!
  const isOfficiallyApproved =
    recordStatus === 'officially_listed' &&
    typeof officialSourceUrl === 'string' &&
    officialSourceUrl.trim().length > 0;

  if (isOfficiallyApproved) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: '#DCFCE7',
        color: '#166534',
        border: '1px solid #86EFAC',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.3px'
      }}>
        ✓ Officially Listed
      </span>
    );
  }

  if (recordStatus === 'reported') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #FDE68A',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700'
      }}>
        👥 Community Reported
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
      border: '1px solid #FCA5A5',
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '700'
    }}>
      ⚠️ Unverified
    </span>
  );
};

