import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { Layout } from '../src/components/Layout';
import { TranslatableInput } from '../src/components/TranslatableInput';
import { OldNewDiffViewer } from '../src/components/OldNewDiffViewer';
import { PushkaraluSocketClient } from '../src/services/socket';

describe('Module 11 - Platform Support (Part C Admin Web Shell)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Permission-Aware Menu & Dev Auth Provider', () => {
    it('renders all navigation items for super_admin role', () => {
      localStorage.setItem('sp_admin_role', 'super_admin');

      render(
        <AuthProvider>
          <MemoryRouter>
            <Layout />
          </MemoryRouter>
        </AuthProvider>
      );

      // Super Admin should see all 9 links
      expect(screen.getByText('Dashboard')).toBeDefined();
      expect(screen.getByText('SOS Command Live')).toBeDefined();
      expect(screen.getByText('Ghats Management')).toBeDefined();
      expect(screen.getByText('News & Advisories')).toBeDefined();
      expect(screen.getByText('Seva & Volunteers')).toBeDefined();
      expect(screen.getByText('Grievance / Issues')).toBeDefined();
      expect(screen.getByText('Audit Trail')).toBeDefined();
      expect(screen.getByText('Settings Editor')).toBeDefined();
      expect(screen.getByText('API Quota & Usage')).toBeDefined();
    });

    it('filters navigation items for editor role (only permitted items)', () => {
      localStorage.setItem('sp_admin_role', 'editor');

      render(
        <AuthProvider>
          <MemoryRouter>
            <Layout />
          </MemoryRouter>
        </AuthProvider>
      );

      // Editor has: ghats.write, news.publish, seva.write
      expect(screen.getByText('Dashboard')).toBeDefined();
      expect(screen.getByText('Ghats Management')).toBeDefined();
      expect(screen.getByText('News & Advisories')).toBeDefined();
      expect(screen.getByText('Seva & Volunteers')).toBeDefined();

      // Should NOT see admin/audit/settings
      expect(screen.queryByText('Audit Trail')).toBeNull();
      expect(screen.queryByText('Settings Editor')).toBeNull();
      expect(screen.queryByText('API Quota & Usage')).toBeNull();
    });

    it('filters navigation items for viewer role (only audit.read)', () => {
      localStorage.setItem('sp_admin_role', 'viewer');

      render(
        <AuthProvider>
          <MemoryRouter>
            <Layout />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Dashboard')).toBeDefined();
      expect(screen.getByText('Audit Trail')).toBeDefined();

      // Disallowed items
      expect(screen.queryByText('Ghats Management')).toBeNull();
      expect(screen.queryByText('Settings Editor')).toBeNull();
      expect(screen.queryByText('News & Advisories')).toBeNull();
    });

    it('switches roles dynamically via switcher dropdown', () => {
      const TestConsumer = () => {
        const { user, mockRole, setMockRole } = useAuth();
        return (
          <div>
            <div data-testid="active-role">{mockRole}</div>
            <div data-testid="is-super">{user.isSuperAdmin ? 'yes' : 'no'}</div>
            <button onClick={() => setMockRole('editor')}>Switch to Editor</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('active-role').textContent).toBe('super_admin');
      expect(screen.getByTestId('is-super').textContent).toBe('yes');

      // Click to switch
      fireEvent.click(screen.getByText('Switch to Editor'));

      expect(screen.getByTestId('active-role').textContent).toBe('editor');
      expect(screen.getByTestId('is-super').textContent).toBe('no');
    });
  });

  describe('2. TranslatableInput Component', () => {
    it('renders tabs and displays missing vs filled indicators', () => {
      const initialValue = {
        en: 'Pushkar Ghat Steps',
        te: 'పుష్కర ఘాట్ మెట్లు',
        hi: '',
      };
      const handleChange = vi.fn();

      render(
        <TranslatableInput
          label="Ghat Title"
          value={initialValue}
          onChange={handleChange}
          requiredLanguages={['en', 'hi']}
        />
      );

      // Check tab indicators
      expect(screen.getByText('Ghat Title')).toBeDefined();
      expect(screen.getAllByText('✓ Filled').length).toBe(2); // EN and TE are filled
      expect(screen.getByText('⚠️ Required')).toBeDefined(); // HI is missing but required

      // Switch to Hindi tab
      fireEvent.click(screen.getByText('हिन्दी (HI)'));

      // Type Hindi text
      const input = screen.getByPlaceholderText('Enter translation in Hindi...');
      fireEvent.change(input, { target: { value: 'पुष्कर घाट की सीढ़ियां' } });

      expect(handleChange).toHaveBeenCalledWith({
        en: 'Pushkar Ghat Steps',
        te: 'పుష్కర ఘాట్ మెట్లు',
        hi: 'पुष्कर घाट की सीढ़ियां',
      });
    });

    it('toggles between tabs view and side-by-side view', () => {
      const val = { en: 'Hello' };
      const handleChange = vi.fn();

      render(
        <TranslatableInput
          label="Title"
          value={val}
          onChange={handleChange}
        />
      );

      const toggleBtn = screen.getByText('⊞ Side-by-Side View');
      fireEvent.click(toggleBtn);

      // Now in split view, toggle button text changes
      expect(screen.getByText('⊟ Tabs View')).toBeDefined();
    });
  });

  describe('3. Old vs New Diff Viewer Component', () => {
    it('renders formatted old and new JSON side by side', () => {
      const oldVal = { corridor_km: 3, active: true };
      const newVal = { corridor_km: 5, active: true };

      render(<OldNewDiffViewer oldValue={oldVal} newValue={newVal} />);

      expect(screen.getByText(/PREVIOUS VALUE \(OLD\)/i)).toBeDefined();
      expect(screen.getByText(/UPDATED VALUE \(NEW\)/i)).toBeDefined();
      expect(screen.getByText(/"corridor_km": 3/)).toBeDefined();
      expect(screen.getByText(/"corridor_km": 5/)).toBeDefined();
    });
  });

  describe('4. Socket.io Client Wrapper (SOS Dashboard & Mock Mode)', () => {
    it('registers alert listener and receives simulated alerts in mock mode', async () => {
      const client = new PushkaraluSocketClient('http://localhost:4000', true);

      let receivedAlert: any = null;
      client.onAlert((alert) => {
        receivedAlert = alert;
      });

      // Trigger simulated incident
      const manual = client.triggerSimulatedAlert({
        ghatName: 'Pushkar Ghat',
        message: 'Water surge alert',
        severity: 'critical',
      });

      expect(receivedAlert).not.toBeNull();
      expect(receivedAlert.ghatName).toBe('Pushkar Ghat');
      expect(receivedAlert.message).toBe('Water surge alert');
      expect(receivedAlert.severity).toBe('critical');
      expect(receivedAlert.status).toBe('active');
      expect(receivedAlert.latitude).toBeDefined();

      client.disconnect();
    });
  });
});

