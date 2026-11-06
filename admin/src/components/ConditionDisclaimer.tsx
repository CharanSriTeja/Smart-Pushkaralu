import React from 'react';

export const ConditionDisclaimer: React.FC = () => {
  return (
    <div style={{
      backgroundColor: '#FFFBEB',
      border: '1.5px solid #FDE68A',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '20px' }}>⚠️</span>
      <div style={{ fontSize: '13px', color: '#92400E', lineHeight: '1.5' }}>
        <strong>Mandatory Pushkaralu Safety Protocol:</strong> River currents, water levels, and crowd movements can change suddenly.
        Never label a ghat as <em>"Officially Approved"</em> unless backed by an authentic government or district portal URL (.gov.in / .nic.in).
      </div>
    </div>
  );
};

