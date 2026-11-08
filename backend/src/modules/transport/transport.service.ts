import { query } from '../../db/index.js';
import {
  TransportRepository,
  transportRepository,
} from './transport.repository.js';
import {
  calculateHaversineDistanceMeters,
  calculateTravelEstimates,
} from '../../services/distance.service.js';
import {
  BusTransportResponse,
  RailTransportResponse,
  ShuttleTransportResponse,
  HubWithDistance,
  RailStationWithDistance,
} from '../../types/transport.js';

// Default central Pushkar Ghat coordinates for distance calculations if no ghat is selected
const DEFAULT_GHAT = {
  id: '00000000-0000-0000-0000-000000000001',
  name: {
    en: 'Pushkar Ghat (Rajahmundry)',
    te: 'పుష్కర్ ఘాట్ (రాజమండ్రి)',
    hi: 'पुष्कर घाट (राजमंड्री)',
  },
  lat: 17.0005,
  lng: 81.7766,
};

export class TransportService {
  constructor(private repo: TransportRepository = transportRepository) {}

  /**
   * Resolves target ghat coordinates either by DB lookup or fallback
   */
  async resolveGhat(ghatId?: string): Promise<{ id: string; name: any; lat: number; lng: number } | null> {
    if (!ghatId) return DEFAULT_GHAT;

    try {
      const { rows } = await query<any>(
        'SELECT id, name, lat, lng FROM ghats WHERE id = $1 LIMIT 1',
        [ghatId]
      );
      if (rows && rows.length > 0) {
        return {
          id: rows[0].id,
          name: rows[0].name,
          lat: Number(rows[0].lat),
          lng: Number(rows[0].lng),
        };
      }
    } catch {
      // fallback
    }

    return DEFAULT_GHAT;
  }

  /**
   * Public Bus Transport Overview
   */
  async getBusTransport(ghatId?: string): Promise<BusTransportResponse> {
    const targetGhat = await this.resolveGhat(ghatId);
    const refLat = targetGhat ? targetGhat.lat : DEFAULT_GHAT.lat;
    const refLng = targetGhat ? targetGhat.lng : DEFAULT_GHAT.lng;

    const [allHubs, allRoutes, specialServices, officialLinks] = await Promise.all([
      this.repo.getHubs({ is_active: true }),
      this.repo.getBusRoutes({ is_active: true }),
      this.repo.getSpecialServices({ is_active: true }),
      this.repo.getExternalLinks({ category: 'bus', is_active: true }),
    ]);

    // Filter hubs relevant to bus transit and calculate real-time distance
    const busHubs: HubWithDistance[] = allHubs
      .filter((h) => h.hub_type === 'bus_stand' || h.hub_type === 'parking')
      .map((h) => {
        const est = calculateTravelEstimates(refLat, refLng, Number(h.lat), Number(h.lng));
        return {
          ...h,
          distance_m: est.distance_m,
          distance_km: est.distance_km,
          driving_time_minutes: est.driving_time_minutes,
          walking_time_minutes: est.walking_time_minutes,
          google_maps_url: est.google_maps_url,
        };
      })
      .sort((a, b) => a.distance_m - b.distance_m);

    return {
      ghat: targetGhat,
      hubs: busHubs,
      routes: allRoutes,
      special_services: specialServices,
      official_links: officialLinks,
      disclaimer: {
        en: 'Notice: During Godavari Pushkaralu, APSRTC and TGSRTC bus routes, pickup points, and frequency are dynamically managed by district traffic authorities. Conditions and diversions can change suddenly.',
        te: 'ముఖ్య గమనిక: గోదావరి పుష్కరాల సమయంలో ఆర్టీసీ బస్సు రూట్లు, బోర్డింగ్ పాయింట్లు మరియు రవాణా కారిడార్లు పోలీసులు ఎప్పటికప్పుడు మార్చవచ్చు. సమయాలు ఆకస్మికంగా మారే అవకాశం ఉంది.',
        hi: 'महत्वपूर्ण सूचना: गोदावरी पुष्करालु के दौरान आरटीसी बस मार्ग, बोर्डिंग पॉइंट और समय सारिणी पुलिस एवं यातायात नियंत्रण के अनुसार अचानक बदल सकते हैं।',
      },
    };
  }

  /**
   * Public Rail Transport Overview
   */
  async getRailTransport(ghatId?: string): Promise<RailTransportResponse> {
    const targetGhat = await this.resolveGhat(ghatId);
    const refLat = targetGhat ? targetGhat.lat : DEFAULT_GHAT.lat;
    const refLng = targetGhat ? targetGhat.lng : DEFAULT_GHAT.lng;

    const [allStations, officialLinks] = await Promise.all([
      this.repo.getRailStations({ is_active: true }),
      this.repo.getExternalLinks({ category: 'rail', is_active: true }),
    ]);

    const stationsWithDistance: RailStationWithDistance[] = allStations
      .map((stn) => {
        const est = calculateTravelEstimates(refLat, refLng, Number(stn.lat), Number(stn.lng));
        return {
          ...stn,
          distance_m: est.distance_m,
          distance_km: est.distance_km,
          driving_time_minutes: est.driving_time_minutes,
          walking_time_minutes: est.walking_time_minutes,
          google_maps_url: est.google_maps_url,
        };
      })
      .sort((a, b) => a.distance_m - b.distance_m);

    return {
      ghat: targetGhat,
      stations: stationsWithDistance,
      official_links: officialLinks,
      disclaimer: {
        en: 'Railway Advisory: South Central Railway (SCR) operates dedicated Pushkaralu special express trains. Verify actual platform numbers and delays on official NTES or Station Enquiry. Unofficial IRCTC scrapers are strictly prohibited.',
        te: 'రైల్వే సమాచారం: దక్షిణ మధ్య రైల్వే పుష్కరాల ప్రత్యేక ఎక్స్‌ప్రెస్ రైళ్లను నడుపుతోంది. దయచేసి ప్లాట్‌ఫారమ్ నంబర్లు మరియు ఆలస్య సమయాలను అధికారిక NTES లేదా స్టేషన్ విచారణ ద్వారా సరిచూసుకోండి.',
        hi: 'रेलवे सलाह: दक्षिण मध्य रेलवे विशेष पुष्करालु ट्रेनें चला रहा है। कृपया वास्तविक प्लेटफॉर्म नंबर और आगमन समय की पुष्टि आधिकारिक एनटीईएस या स्टेशन पूछताछ से करें।',
      },
    };
  }

  /**
   * Public Free Pilgrimage Shuttles Overview
   */
  async getShuttlesTransport(ghatId?: string): Promise<ShuttleTransportResponse> {
    const targetGhat = await this.resolveGhat(ghatId);
    const [allShuttles, officialLinks] = await Promise.all([
      this.repo.getShuttleRoutes({
        destination_ghat_id: ghatId,
        is_active: true,
      }),
      this.repo.getExternalLinks({ category: 'shuttle', is_active: true }),
    ]);

    return {
      ghat: targetGhat,
      shuttle_routes: allShuttles,
      official_links: officialLinks,
      disclaimer: {
        en: 'Free Shuttle Advisory: Municipal battery carts and dedicated green corridor buses operate continuously between satellite parkings and ghat entrances. Priority is granted to senior citizens, pregnant women, and persons with disabilities.',
        te: 'ఉచిత షటిల్ సమాచారం: శాటిలైట్ పార్కింగ్‌ల నుండి ఘాట్ ప్రవేశాల వరకు ఉచిత ఎలక్ట్రిక్ కార్ట్స్ మరియు బస్సులు నిరంతరం నడుస్తాయి. వృద్ధులు, గర్భిణీలు మరియు దివ్యాంగులకు ప్రాధాన్యత ఇవ్వబడుతుంది.',
        hi: 'मुफ्त शटल सूचना: सैटेलाइट पार्किंग और घाटों के बीच मुफ्त इलेक्ट्रिक कार्ट और बसें लगातार चलती हैं। वरिष्ठ नागरिकों और दिव्यांगों को प्राथमिकता दी जाती है।',
      },
    };
  }

  // ==========================================
  // REPOSITORY ACCESSORS FOR ADMIN
  // ==========================================
  getRepo(): TransportRepository {
    return this.repo;
  }
}

export const transportService = new TransportService();

