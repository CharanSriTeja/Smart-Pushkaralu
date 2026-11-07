import * as SecureStore from 'expo-secure-store';
import { API_V1_URL } from './api';
import {
  BusTransportData,
  RailTransportData,
  ShuttleTransportData,
} from '../types/transport';

const TRANSPORT_CACHE_PREFIX = 'sp_offline_transport_';

export class TransportService {
  /**
   * Fetches Bus transit hubs, routes, special fleets, and official links
   */
  static async getBusTransport(
    ghatId?: string
  ): Promise<{ data: BusTransportData; isOffline: boolean }> {
    const key = `${TRANSPORT_CACHE_PREFIX}bus_${ghatId || 'default'}`;
    const url = `${API_V1_URL}/transport/bus${ghatId ? `?ghat_id=${ghatId}` : ''}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const data: BusTransportData = json.data;
        SecureStore.setItemAsync(key, JSON.stringify(data)).catch(() => {});
        return { data, isOffline: false };
      }
    } catch (err) {
      console.warn('[TransportService] Network fetch failed, trying offline cache:', err);
    }

    // Offline cache fallback
    try {
      const cached = await SecureStore.getItemAsync(key);
      if (cached) {
        return { data: JSON.parse(cached), isOffline: true };
      }
    } catch (cacheErr) {
      console.warn('[TransportService] Cache read error:', cacheErr);
    }

    // Default curated fallback
    return {
      data: {
        ghat: null,
        hubs: [
          {
            id: 'fallback-hub-1',
            name: { en: 'Rajahmundry Central Bus Station (APSRTC)', te: 'రాజమండ్రి సెంట్రల్ బస్ స్టేషన్ (ఆర్టీసీ)', hi: 'राजमंड्री सेंट्रल बस स्टेशन' },
            hub_type: 'bus_stand',
            operator: 'APSRTC',
            code: 'RJY-CBS',
            lat: 17.0095,
            lng: 81.7892,
            is_active: true,
            distance_m: 1650,
            distance_km: 1.7,
            driving_time_minutes: 8,
            walking_time_minutes: 22,
            google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=17.0095,81.7892',
          },
        ],
        routes: [
          {
            id: 'fallback-rt-1',
            route_number: 'Route 101',
            operator: 'APSRTC',
            origin: { en: 'RTC Complex', te: 'ఆర్టీసీ కాంప్లెక్స్', hi: 'आरटीसी कॉम्प्लेक्स' },
            destination: { en: 'Pushkar Ghat', te: 'పుష్కర్ ఘాట్', hi: 'पुष्कर घाट' },
            via_stops: ['Morampudi', 'Danavaipeta'],
            frequency_minutes: 10,
            bus_type: 'ordinary',
            is_active: true,
          },
        ],
        special_services: [
          {
            id: 'fallback-spl-1',
            service_code: 'PUSH-SPL-HYD-01',
            service_title: { en: 'APSRTC Pushkaralu Special: Hyderabad to Rajahmundry', te: 'ఆర్టీసీ పుష్కరాల ప్రత్యేక బస్సు: హైదరాబాద్ - రాజమండ్రి' },
            operator: 'APSRTC',
            origin_city: { en: 'Hyderabad (MGBS)' },
            destination_town: { en: 'Rajahmundry' },
            operating_dates: { start_date: '2027-07-14', end_date: '2027-07-25' },
            booking_url: 'https://www.apsrtconline.in',
            is_active: true,
          },
        ],
        official_links: [
          {
            id: 'fallback-link-1',
            category: 'bus',
            key: 'apsrtc_booking',
            title: { en: 'APSRTC Official Ticket Booking', te: 'ఆర్టీసీ అధికారిక టికెట్ బుకింగ్', hi: 'एपीएसआरटीसी आधिकारिक टिकट बुकिंग' },
            url: 'https://www.apsrtconline.in',
            official_authority: 'APSRTC (Govt. of AP)',
            is_verified: true,
            sort_order: 1,
          },
          {
            id: 'fallback-link-2',
            category: 'bus',
            key: 'tgsrtc_booking',
            title: { en: 'TGSRTC Official Portal', te: 'టిజిఎస్ఆర్టీసీ అధికారిక పోర్టల్', hi: 'टीजीएसआरटीसी आधिकारिक पोर्टल' },
            url: 'https://www.tgsrtcbus.in',
            official_authority: 'TGSRTC (Govt. of Telangana)',
            is_verified: true,
            sort_order: 2,
          },
        ],
        disclaimer: {
          en: 'Notice: During Godavari Pushkaralu, APSRTC and TGSRTC bus routes, pickup points, and frequency are dynamically managed by district traffic authorities. Conditions and diversions can change suddenly.',
          te: 'ముఖ్య గమనిక: గోదావరి పుష్కరాల సమయంలో ఆర్టీసీ బస్సు రూట్లు, బోర్డింగ్ పాయింట్లు మరియు రవాణా కారిడార్లు పోలీసులు ఎప్పటికప్పుడు మార్చవచ్చు. సమయాలు ఆకస్మికంగా మారే అవకాశం ఉంది.',
          hi: 'महत्वपूर्ण सूचना: गोदावरी पुष्करालु के दौरान आरटीसी बस मार्ग, बोर्डिंग पॉइंट और समय सारिणी पुलिस एवं यातायात नियंत्रण के अनुसार अचानक बदल सकते हैं।',
        },
      },
      isOffline: true,
    };
  }

  /**
   * Fetches Railway stations, platform halts, and CRIS / NTES official links
   */
  static async getRailTransport(
    ghatId?: string
  ): Promise<{ data: RailTransportData; isOffline: boolean }> {
    const key = `${TRANSPORT_CACHE_PREFIX}rail_${ghatId || 'default'}`;
    const url = `${API_V1_URL}/transport/rail${ghatId ? `?ghat_id=${ghatId}` : ''}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const data: RailTransportData = json.data;
        SecureStore.setItemAsync(key, JSON.stringify(data)).catch(() => {});
        return { data, isOffline: false };
      }
    } catch (err) {
      console.warn('[TransportService] Network fetch failed, trying offline cache:', err);
    }

    try {
      const cached = await SecureStore.getItemAsync(key);
      if (cached) {
        return { data: JSON.parse(cached), isOffline: true };
      }
    } catch (cacheErr) {
      console.warn('[TransportService] Cache read error:', cacheErr);
    }

    return {
      data: {
        ghat: null,
        stations: [
          {
            id: 'fallback-rail-1',
            station_code: 'RJY',
            station_name: { en: 'Rajahmundry Railway Station', te: 'రాజమండ్రి రైల్వే స్టేషన్', hi: 'राजमंड्री रेलवे स्टेशन' },
            division: 'Vijayawada (BZA)',
            zone: 'SCR',
            total_platforms: 5,
            has_pushkaralu_special_trains: true,
            helpdesk_phone: '+91 883 2463131',
            official_enquiry_url: 'https://enquiry.indianrail.gov.in',
            lat: 16.9934,
            lng: 81.7821,
            is_active: true,
            distance_m: 1100,
            distance_km: 1.1,
            driving_time_minutes: 5,
            walking_time_minutes: 15,
            google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=16.9934,81.7821',
          },
          {
            id: 'fallback-rail-2',
            station_code: 'GVN',
            station_name: { en: 'Godavari Railway Halt', te: 'గోదావరి రైల్వే హాల్ట్', hi: 'गोदावरी रेलवे हॉल्ट' },
            division: 'Vijayawada (BZA)',
            zone: 'SCR',
            total_platforms: 2,
            has_pushkaralu_special_trains: true,
            helpdesk_phone: '139',
            official_enquiry_url: 'https://enquiry.indianrail.gov.in',
            lat: 17.0022,
            lng: 81.7745,
            is_active: true,
            distance_m: 350,
            distance_km: 0.4,
            driving_time_minutes: 2,
            walking_time_minutes: 5,
            google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=17.0022,81.7745',
          },
        ],
        official_links: [
          {
            id: 'fallback-rail-l1',
            category: 'rail',
            key: 'rail_ntes_enquiry',
            title: { en: 'NTES National Train Enquiry System', te: 'ఎన్‌టీఈఎస్ జాతీయ రైలు విచారణ వ్యవస్థ', hi: 'एनटीईएस राष्ट्रीय रेल पूछताछ प्रणाली' },
            url: 'https://enquiry.indianrail.gov.in',
            official_authority: 'Centre for Railway Information Systems (CRIS)',
            is_verified: true,
            sort_order: 1,
          },
          {
            id: 'fallback-rail-l2',
            category: 'rail',
            key: 'irctc_seat_avail',
            title: { en: 'IRCTC Seat Availability & Booking', te: 'ఐఆర్‌సిటిసి సీట్ లభ్యత & బుకింగ్', hi: 'आईआरसीटीसी सीट उपलब्धता और बुकिंग' },
            url: 'https://www.irctc.co.in',
            official_authority: 'IRCTC (Indian Railways)',
            is_verified: true,
            sort_order: 2,
          },
          {
            id: 'fallback-rail-l3',
            category: 'rail',
            key: 'rail_pnr_status',
            title: { en: 'Indian Railways Official PNR Status', te: 'భారతీయ రైల్వే అధికారిక పీఎన్‌ఆర్ స్థితి', hi: 'भारतीय रेलवे आधिकारिक पीएनआर स्थिति' },
            url: 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html',
            official_authority: 'Indian Railways',
            is_verified: true,
            sort_order: 3,
          },
          {
            id: 'fallback-rail-l4',
            category: 'rail',
            key: 'rail_live_status',
            title: { en: 'Live Train Running Status (NTES)', te: 'లైవ్ రైలు నడుస్తున్న స్థితి (NTES)', hi: 'लाइव ट्रेन रनिंग स्टेटस (एनटीईएस)' },
            url: 'https://enquiry.indianrail.gov.in/mntes/',
            official_authority: 'NTES / Indian Railways',
            is_verified: true,
            sort_order: 4,
          },
          {
            id: 'fallback-rail-l5',
            category: 'rail',
            key: 'rail_madad_helpline',
            title: { en: 'RailMadad & Emergency Helpline 139', te: 'రైల్ మదద్ & అత్యవసర హెల్ప్‌లైన్ 139', hi: 'रेल मदद और आपातकालीन हेल्पलाइन 139' },
            url: 'https://railmadad.indianrailways.gov.in',
            official_authority: 'Ministry of Railways (Govt. of India)',
            is_verified: true,
            sort_order: 5,
          },
        ],
        disclaimer: {
          en: 'Railway Advisory: South Central Railway (SCR) operates dedicated Pushkaralu special express trains. Verify actual platform numbers and delays on official NTES or Station Enquiry. Unofficial IRCTC scrapers are strictly prohibited.',
          te: 'రైల్వే సమాచారం: దక్షిణ మధ్య రైల్వే పుష్కరాల ప్రత్యేక ఎక్స్‌ప్రెస్ రైళ్లను నడుపుతోంది. దయచేసి ప్లాట్‌ఫారమ్ నంబర్లు మరియు ఆలస్య సమయాలను అధికారిక NTES లేదా స్టేషన్ విచారణ ద్వారా సరిచూసుకోండి.',
          hi: 'रेलवे सलाह: दक्षिण मध्य रेलवे विशेष पुष्करालु ट्रेनें चला रहा है। कृपया वास्तविक प्लेटफॉर्म नंबर और आगमन समय की पुष्टि आधिकारिक एनटीईएस या स्टेशन पूछताछ से करें।',
        },
      },
      isOffline: true,
    };
  }

  /**
   * Fetches Free pilgrim shuttles connecting satellite parkings to ghats
   */
  static async getShuttleTransport(
    ghatId?: string
  ): Promise<{ data: ShuttleTransportData; isOffline: boolean }> {
    const key = `${TRANSPORT_CACHE_PREFIX}shuttles_${ghatId || 'default'}`;
    const url = `${API_V1_URL}/transport/shuttles${ghatId ? `?ghat_id=${ghatId}` : ''}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const data: ShuttleTransportData = json.data;
        SecureStore.setItemAsync(key, JSON.stringify(data)).catch(() => {});
        return { data, isOffline: false };
      }
    } catch (err) {
      console.warn('[TransportService] Network fetch failed, trying offline cache:', err);
    }

    try {
      const cached = await SecureStore.getItemAsync(key);
      if (cached) {
        return { data: JSON.parse(cached), isOffline: true };
      }
    } catch (cacheErr) {
      console.warn('[TransportService] Cache read error:', cacheErr);
    }

    return {
      data: {
        ghat: null,
        shuttle_routes: [
          {
            id: 'fallback-shuttle-1',
            route_code: 'SHTL-GREEN-01',
            route_name: { en: 'Green Line Free Shuttle: Morampudi Satellite Parking to Pushkar Ghat', te: 'గ్రీన్ లైన్ ఉచిత షటిల్: మొరంపూడి పార్కింగ్ నుండి పుష్కర్ ఘాట్' },
            origin_name: { en: 'Morampudi Satellite Parking' },
            destination_name: { en: 'Pushkar Ghat South Gate' },
            shuttle_type: 'free',
            fare: 0.0,
            frequency_minutes: 8,
            operating_hours: { start: '04:00', end: '23:30', frequency_peak_mins: 5 },
            accessible_for_elderly_disabled: true,
            color_code: '#2E7D32',
            is_active: true,
            stops: [
              { id: 'st-1', stop_order: 1, stop_name: { en: 'Morampudi Parking Ground' }, lat: 17.0125, lng: 81.7915, is_major_boarding_point: true },
              { id: 'st-2', stop_order: 2, stop_name: { en: 'Danavaipeta Junction' }, lat: 17.0065, lng: 81.7842, is_major_boarding_point: false },
              { id: 'st-3', stop_order: 3, stop_name: { en: 'Pushkar Ghat Drop-off' }, lat: 17.0008, lng: 81.7769, is_major_boarding_point: true },
            ],
          },
        ],
        official_links: [],
        disclaimer: {
          en: 'Free Shuttle Advisory: Municipal battery carts and dedicated green corridor buses operate continuously between satellite parkings and ghat entrances. Priority is granted to senior citizens, pregnant women, and persons with disabilities.',
          te: 'ఉచిత షటిల్ సమాచారం: శాటిలైట్ పార్కింగ్‌ల నుండి ఘాట్ ప్రవేశాల వరకు ఉచిత ఎలక్ట్రిక్ కార్ట్స్ మరియు బస్సులు నిరంతరం నడుస్తాయి. వృద్ధులు, గర్భిణీలు మరియు దివ్యాంగులకు ప్రాధాన్యత ఇవ్వబడుతుంది.',
          hi: 'मुफ्त शटल सूचना: सैटेलाइट पार्किंग और घाटों के बीच मुफ्त इलेक्ट्रिक कार्ट और बसें लगातार चलती हैं। वरिष्ठ नागरिकों और दिव्यांगों को प्राथमिकता दी जाती है।',
        },
      },
      isOffline: true,
    };
  }
}

