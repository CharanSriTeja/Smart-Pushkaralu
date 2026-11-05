import React from 'react';

export interface OldNewDiffViewerProps {
  oldValue: any;
  newValue: any;
}

export const OldNewDiffViewer: React.FC<OldNewDiffViewerProps> = ({ oldValue, newValue }) => {
  const formatJson = (val: any) => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'string') return val;
    return JSON.stringify(val, null, 2);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
      <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '6px', padding: '10px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#BE123C', marginBottom: '4px' }}>
          ◀ PREVIOUS VALUE (OLD)
        </div>
        <pre
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: '#881337',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {formatJson(oldValue)}
        </pre>
      </div>

      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '10px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D', marginBottom: '4px' }}>
          ▶ UPDATED VALUE (NEW)
        </div>
        <pre
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: '#14532D',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {formatJson(newValue)}
        </pre>
      </div>
    </div>
  );
};

