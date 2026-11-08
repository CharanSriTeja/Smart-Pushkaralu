import { StubApiResponse } from '../../../types/transport.js';

export interface BusRouteQuery {
  route_number?: string;
  operator?: string;
  ghat_id?: string;
}

export interface BusLiveQuery {
  route_id?: string;
  vehicle_no?: string;
}

export interface BusStopsQuery {
  route_id?: string;
  hub_id?: string;
}

export interface BusSpecialServicesQuery {
  operator?: string;
  origin?: string;
  destination_ghat_id?: string;
}

/**
 * Adapter interface for official RTC (APSRTC / TGSRTC) integrations.
 * Real-time GPS and ticketing integration will be activated once formal government
 * MoUs and secured API credentials are provided.
 */
export interface IBusApiAdapter {
  getRoutes(query?: BusRouteQuery): Promise<StubApiResponse>;
  getLiveTracking(query?: BusLiveQuery): Promise<StubApiResponse>;
  getStops(query?: BusStopsQuery): Promise<StubApiResponse>;
  getSpecialServices(query?: BusSpecialServicesQuery): Promise<StubApiResponse>;
}

export class OfficialApsrtcTgsrtcStubAdapter implements IBusApiAdapter {
  private readonly provider = 'official_rtc_api';
  private readonly policy =
    'Strict Compliance: Unofficial scraping or reverse-engineered APIs of state transport portals (APSRTC / TGSRTC) are strictly prohibited. Official direct API feeds are pending government dispatch clearance.';

  async getRoutes(_query?: BusRouteQuery): Promise<StubApiResponse> {
    return {
      status: 'integration_pending',
      provider: this.provider,
      message:
        'Official real-time bus routes API integration with APSRTC & TGSRTC is scheduled for deployment closer to Godavari Pushkaralu 2027. Use curated routes and official booking portals in the meantime.',
      is_stub: true,
      official_portal_url: 'https://www.apsrtconline.in',
      policy: this.policy,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  async getLiveTracking(_query?: BusLiveQuery): Promise<StubApiResponse> {
    return {
      status: 'integration_pending',
      provider: this.provider,
      message:
        'Official GPS live bus tracking API is awaiting live telemetry stream authorization from AP & TS state control rooms. Third-party scraping is strictly prohibited.',
      is_stub: true,
      official_portal_url: 'https://www.apsrtconline.in',
      policy: this.policy,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  async getStops(_query?: BusStopsQuery): Promise<StubApiResponse> {
    return {
      status: 'integration_pending',
      provider: this.provider,
      message:
        'Official geocoded bus stops API integration with RTC Central Database is pending official release. Verified intermediate stops are displayed in curated routes.',
      is_stub: true,
      official_portal_url: 'https://www.tgsrtcbus.in',
      policy: this.policy,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  async getSpecialServices(_query?: BusSpecialServicesQuery): Promise<StubApiResponse> {
    return {
      status: 'integration_pending',
      provider: this.provider,
      message:
        'Direct booking API integration for Pushkaralu Special Buses is pending RTC reservation gateway clearance. Check curated special services or book via the official APSRTC / TGSRTC portal links.',
      is_stub: true,
      official_portal_url: 'https://www.apsrtconline.in',
      policy: this.policy,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export const busApiAdapter = new OfficialApsrtcTgsrtcStubAdapter();

