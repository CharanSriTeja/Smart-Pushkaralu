export interface LocalizedText {
  en: string;
  te?: string;
  hi?: string;
}

export type MockRole = 'super_admin' | 'editor' | 'viewer' | 'guest';

export interface AdminUser {
  id: string;
  phone: string;
  name: string;
  role: MockRole;
  permissions: string[];
  isSuperAdmin: boolean;
  token?: string;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string | null;
  admin_phone?: string | null;
  admin_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  source_url: string | null;
  reason: string | null;
  created_at: string;
}

export interface SettingRecord {
  key: string;
  value: any;
  updated_by?: string | null;
  updated_by_name?: string | null;
  updated_at?: string;
}

export interface ProviderUsage {
  provider: string;
  totalCalls: number;
  totalCost: number;
}

export interface DailyUsage {
  date: string;
  provider: string;
  count: number;
}

export interface UsageStats {
  monthlyQuota: number;
  currentMonthUsage: number;
  currentMonthCost: number;
  quotaRemaining: number;
  quotaPercentUsed: number;
  providers: ProviderUsage[];
  dailyUsage: DailyUsage[];
}

export interface EmergencyAlert {
  id: string;
  ghatId: string;
  ghatName: string;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  reportedAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
  latitude?: number;
  longitude?: number;
}

