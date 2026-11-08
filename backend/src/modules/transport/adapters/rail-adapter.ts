import { StubApiResponse } from '../../../types/transport.js';

export interface RailNearbyStationsQuery {
  lat?: number;
  lng?: number;
  ghat_id?: string;
  radius_km?: number;
}

export interface RailTrainsQuery {
  origin_station?: string;
  destination_station?: string;
  date?: string;
}

export interface RailScheduleQuery {
  train_number?: string;
}

export interface RailAvailabilityQuery {
  train_number?: string;
  date?: string;
  class_code?: string;
  quota?: string;
}

/**
 * Adapter interface for official Indian Railways (CRIS / NTES / IRCTC) integrations.
 * Indian Railways policy requires direct authorized access via CRIS (Centre for Railway Information Systems).
 * Scraping and unofficial third-party APIs are strictly disabled for security, legal, and pilgrim safety reasons.
 */
export interface IRailApiAdapter {
  getNearbyStations(query?: RailNearbyStationsQuery): Promise<StubApiResponse>;
  getTrains(query?: RailTrainsQuery): Promise<StubApiResponse>;
  getSchedule(query?: RailScheduleQuery): Promise<StubApiResponse>;
  getAvailability(query?: RailAvailabilityQuery): Promise<StubApiResponse>;
}

export class OfficialCrisRailStubAdapter implements IRailApiAdapter {
  private readonly provider = 'official_cris_irctc';
  private readonly policy =
    'Strict Compliance: Under Indian Railways and CRIS data policy, scraping IRCTC/NTES endpoints or using unauthorized third-party proxy APIs is strictly prohibited. Only verified official links and authorized government gateways are supported.';

  async getNearbyStations(_query?: RailNearbyStationsQuery): Promise<StubApiResponse> {
    return {
      status: 'integration_pending',
      provider: this.provider,
      message:
        'Live train tracking and nearby station dispatch feed integration with CRIS / South Central Railway (SCR) is in progress. Verified station details and distances are provided from our curated railway database.',
      is_stub: true,
      official_portal_url: 'https://enquiry.indianrail.gov.in',
      policy: this.policy,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  async getTrains(_query?: RailTrainsQuery): Promise<StubApiResponse> {
    return {
      status: 'integration_pending',
      provider: this.provider,
      message:
        'Direct train search API integration with Indian Railways CRIS gateway is pending. Please verify Godavari Pushkaralu special express trains on National Train Enquiry System (NTES).',
      is_stub: true,
      official_portal_url: 'https://enquiry.indianrail.gov.in',
      policy: this.policy,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  async getSchedule(_query?: RailScheduleQuery): Promise<StubApiResponse> {
    return {
      status: 'integration_pending',
      provider: this.provider,
      message:
        'Official train timetable and platform schedule API integration is awaiting SCR Pushkaralu special timetable notification. Use official NTES running status for real-time arrival info.',
      is_stub: true,
      official_portal_url: 'https://enquiry.indianrail.gov.in/mntes/',
      policy: this.policy,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  async getAvailability(_query?: RailAvailabilityQuery): Promise<StubApiResponse> {
    return {
      status: 'integration_pending',
      provider: this.provider,
      message:
        'Live seat availability and PNR enquiry requires direct user authentication on IRCTC. Unofficial reverse-engineered IRCTC scrapers are strictly blocked. Please use the official IRCTC link provided.',
      is_stub: true,
      official_portal_url: 'https://www.irctc.co.in',
      policy: this.policy,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export const railApiAdapter = new OfficialCrisRailStubAdapter();

