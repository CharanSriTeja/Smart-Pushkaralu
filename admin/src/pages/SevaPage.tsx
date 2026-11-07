import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SevaAdminPage } from './SevaAdminPage';

export const SevaPage: React.FC = () => {
  const { hasPermission } = useAuth();

  if (!hasPermission('seva.write') && !hasPermission('seva.manage')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your role lacks <code>seva.write</code> or <code>seva.manage</code> permission.</p>
      </div>
    );
  }

  return <SevaAdminPage />;
};

export default SevaPage;
