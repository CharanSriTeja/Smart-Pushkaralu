export interface LocalizedText {
  en: string;
  te?: string;
  hi?: string;
}

export type SupportedLanguage = 'en' | 'te' | 'hi';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface DeviceRegistrationPayload {
  fcmToken: string;
  language: SupportedLanguage;
  topics?: string[];
  platform?: 'android' | 'ios' | 'web';
}

export interface PublicSettings {
  places_cache_days: number;
  route_cache_days: number;
  corridor_km: number;
  default_language: string;
  sos_rate_limit_per_hour: number;
  [key: string]: any;
}

