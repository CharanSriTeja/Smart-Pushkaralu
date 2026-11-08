import * as SecureStore from 'expo-secure-store';
import { API_V1_URL } from './api';
import { SevaFeedResponse, SevaVideoItem, LocalizedSevaString } from '../types/seva';

const SEVA_CACHE_PREFIX = 'sp_offline_seva_';

const CURATED_FALLBACK_VIDEOS: SevaVideoItem[] = [
  {
    id: 'seva-live-harathi-01',
    youtube_id: 'dQw4w9WgXcQ',
    youtube_url: 'https://www.youtube.com/live/dQw4w9WgXcQ',
    title_en: 'Maha Pushkar Godavari Harathi - Live Evening Darshan',
    title_te: 'మహా పుష్కర గోదావరి హారతి - ప్రత్యక్ష ప్రసారం',
    title_hi: 'महा पुष्कर गोदावरी महा आरती - सीधा प्रसारण',
    title: {
      en: 'Maha Pushkar Godavari Harathi - Live Evening Darshan',
      te: 'మహా పుష్కర గోదావరి హారతి - ప్రత్యక్ష ప్రసారం',
      hi: 'महा पुष्कर गोदावरी महा आरती - सीधा प्रसारण',
    },
    description_en: 'Live streaming of sacred Godavari Nithya Harathi performed by Vedic priests at Pushkar Ghat, Rajahmundry.',
    description_te: 'రాజమండ్రి పుష్కర్ ఘాట్ వద్ద వేద పండితులచే నిర్వహించబడుతున్న దివ్య గోదావరి హారతి ప్రత్యక్ష ప్రసారం.',
    description_hi: 'पुष्कर घाट, राजमुंदरी पर वैदिक पुजारियों द्वारा पवित्र गोदावरी नित्य महा आरती का सीधा प्रसारण।',
    description: {
      en: 'Live streaming of sacred Godavari Nithya Harathi performed by Vedic priests at Pushkar Ghat, Rajahmundry.',
      te: 'రాజమండ్రి పుష్కర్ ఘాట్ వద్ద వేద పండితులచే నిర్వహించబడుతున్న దివ్య గోదావరి హారతి ప్రత్యక్ష ప్రసారం.',
      hi: 'पुष्कर घाट, राजमुंदरी पर वैदिक पुजारियों द्वारा पवित्र गोदावरी नित्य महा आरती का सीधा प्रसारण।',
    },
    category: 'aarthi',
    ghat_id: 'pushkar-ghat-01',
    ghat_name: {
      en: 'Pushkar Ghat, Rajahmundry',
      te: 'పుష్కర్ ఘాట్, రాజమండ్రి',
      hi: 'पुष्कर घाट, राजमुंदरी',
    },
    event_date: '2026-11-01T18:00:00Z',
    is_live: true,
    published: true,
    sort_order: 1,
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    created_at: '2026-11-01T06:00:00Z',
    updated_at: '2026-11-01T06:00:00Z',
  },
  {
    id: 'seva-kotilingala-rudrabhishekam-02',
    youtube_id: 'C0DPdy98e4c',
    youtube_url: 'https://www.youtube.com/watch?v=C0DPdy98e4c',
    title_en: 'Sri Kotilingeswara Swamy Maha Rudrabhishekam',
    title_te: 'శ్రీ కోటిలింగేశ్వర స్వామి మహా రుద్రాభిషేకం',
    title_hi: 'श्री कोटिलिंगेश्वर स्वामी महा रुद्राभिषेक',
    title: {
      en: 'Sri Kotilingeswara Swamy Maha Rudrabhishekam',
      te: 'శ్రీ కోటిలింగేశ్వర స్వామి మహా రుద్రాభిషేకం',
      hi: 'श्री कोटिलिंगेश्वर स्वामी महा रुद्राभिषेक',
    },
    description_en: 'Sacred Rudrabhishekam performed on the holy banks of Godavari during Pushkaralu festival.',
    description_te: 'పుష్కరాల సందర్భంగా గోదావరి తీరాన నిర్వహించిన పవిత్ర రుద్రాభిషేక దృశ్యాలు.',
    description_hi: 'पुष्करालु महोत्सव के दौरान गोदावरी के पावन तट पर आयोजित पवित्र रुद्राभिषेक।',
    description: {
      en: 'Sacred Rudrabhishekam performed on the holy banks of Godavari during Pushkaralu festival.',
      te: 'పుష్కరాల సందర్భంగా గోదావరి తీరాన నిర్వహించిన పవిత్ర రుద్రాభిషేక దృశ్యాలు.',
      hi: 'पुष्करालु महोत्सव के दौरान गोदावरी के पावन तट पर आयोजित पवित्र रुद्राभिषेक।',
    },
    category: 'pooja',
    ghat_id: 'kotilingala-ghat-02',
    ghat_name: {
      en: 'Kotilingala Ghat, Rajahmundry',
      te: 'కోటిలింగాల ఘాట్, రాజమండ్రి',
      hi: 'कोटिशिंगला घाट, राजमुंदरी',
    },
    event_date: '2026-11-02T04:30:00Z',
    is_live: false,
    published: true,
    sort_order: 2,
    thumbnail_url: 'https://img.youtube.com/vi/C0DPdy98e4c/hqdefault.jpg',
    created_at: '2026-11-02T05:00:00Z',
    updated_at: '2026-11-02T05:00:00Z',
  },
  {
    id: 'seva-cultural-classical-03',
    youtube_id: '9bZkp7q19f0',
    youtube_url: 'https://youtu.be/9bZkp7q19f0',
    title_en: 'Pushkara Shobha: Kuchipudi Dance Festival at Saraswathi Ghat',
    title_te: 'పుష్కర శోభ: సరస్వతి ఘాట్ వద్ద కూచిపూడి నృత్యోత్సవం',
    title_hi: 'पुष्कर शोभा: सरस्वती घाट पर कुचिपुड़ी नृत्य महोत्सव',
    title: {
      en: 'Pushkara Shobha: Kuchipudi Dance Festival at Saraswathi Ghat',
      te: 'పుష్కర శోభ: సరస్వతి ఘాట్ వద్ద కూచిపూడి నృత్యోత్సవం',
      hi: 'पुष्कर शोभा: सरस्वती घाट पर कुचिपुड़ी नृत्य महोत्सव',
    },
    description_en: 'Grand cultural showcase celebrating Godavari river heritage featuring renowned classical artists.',
    description_te: 'గోదావరి నదీ వైభవాన్ని చాటిచెప్పే కూచిపూడి కళాకారుల శాస్త్రీయ నృత్య ప్రదర్శన.',
    description_hi: 'गोदावरी नदी की सांस्कृतिक विरासत को प्रदर्शित करने वाला भव्य कुचिपुड़ी शास्त्रीय नृत्य कार्यक्रम।',
    description: {
      en: 'Grand cultural showcase celebrating Godavari river heritage featuring renowned classical artists.',
      te: 'గోదావరి నదీ వైభవాన్ని చాటిచెప్పే కూచిపూడి కళాకారుల శాస్త్రీయ నృత్య ప్రదర్శన.',
      hi: 'गोदावरी नदी की सांस्कृतिक विरासत को प्रदर्शित करने वाला भव्य कुचिपुड़ी शास्त्रीय नृत्य कार्यक्रम।',
    },
    category: 'cultural',
    ghat_id: 'saraswathi-ghat-03',
    ghat_name: {
      en: 'Saraswathi Ghat, Rajahmundry',
      te: 'సరస్వతి ఘాట్, రాజమండ్రి',
      hi: 'सरस्वती घाट, राजमुंदरी',
    },
    event_date: '2026-11-03T18:00:00Z',
    is_live: false,
    published: true,
    sort_order: 3,
    thumbnail_url: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
    created_at: '2026-11-03T19:00:00Z',
    updated_at: '2026-11-03T19:00:00Z',
  },
  {
    id: 'seva-snanam-guide-04',
    youtube_id: 'kJQP7kiw5Fk',
    youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    title_en: 'Pushkara Punya Snanam Ritual Procedures & Guidelines',
    title_te: 'పుష్కర పుణ్య స్నాన విధి విధానాలు & సూచనలు',
    title_hi: 'पुष्कर पुण्य स्नान विधि और महत्वपूर्ण दिशा-निर्देश',
    title: {
      en: 'Pushkara Punya Snanam Ritual Procedures & Guidelines',
      te: 'పుష్కర పుణ్య స్నాన విధి విధానాలు & సూచనలు',
      hi: 'पुष्कर पुण्य स्नान विधि और महत्वपूर्ण दिशा-निर्देश',
    },
    description_en: 'Official priest guidance on the traditional rituals, sankalpam, and sacred bath timings.',
    description_te: 'పుష్కర పుణ్యస్నానం ఆచరించే పద్ధతులు, సంకల్పం మరియు ముఖ్య సూచనలపై పండితుల వివరణ.',
    description_hi: 'पुष्कर पुण्य स्नान करने की विधि, संकल्प एवं पवित्र स्नान समय पर विद्वानों का मार्गदर्शन।',
    description: {
      en: 'Official priest guidance on the traditional rituals, sankalpam, and sacred bath timings.',
      te: 'పుష్కర పుణ్యస్నానం ఆచరించే పద్ధతులు, సంకల్పం మరియు ముఖ్య సూచనలపై పండితుల వివరణ.',
      hi: 'पुष्कर पुण्य स्नान करने की विधि, संकल्प एवं पवित्र स्नान समय पर विद्वानों का मार्गदर्शन।',
    },
    category: 'snanam',
    ghat_id: 'pushkar-ghat-01',
    ghat_name: {
      en: 'Pushkar Ghat, Rajahmundry',
      te: 'పుష్కర్ ఘాట్, రాజమండ్రి',
      hi: 'पुष्कर घाट, राजमुंदरी',
    },
    event_date: '2026-11-04T07:00:00Z',
    is_live: false,
    published: true,
    sort_order: 4,
    thumbnail_url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    created_at: '2026-11-04T08:00:00Z',
    updated_at: '2026-11-04T08:00:00Z',
  },
];

export class SevaService {
  /**
   * Fetches published Seva videos with optional category, ghat, and live filters.
   * Employs offline caching via SecureStore and curated fallbacks on weak networks.
   */
  static async getVideos(filters?: {
    category?: string;
    ghat?: string;
    live?: boolean;
  }): Promise<{ data: SevaVideoItem[]; meta: any; isOffline: boolean }> {
    const query = new URLSearchParams();
    if (filters?.category && filters.category !== 'all') query.append('category', filters.category);
    if (filters?.ghat) query.append('ghat', filters.ghat);
    if (typeof filters?.live === 'boolean') query.append('live', String(filters.live));

    const cacheKey = `${SEVA_CACHE_PREFIX}${query.toString() || 'all'}`;
    const url = `${API_V1_URL}/seva${query.toString() ? `?${query.toString()}` : ''}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json: SevaFeedResponse = await res.json();
        SecureStore.setItemAsync(cacheKey, JSON.stringify(json)).catch(() => {});
        return {
          data: json.data,
          meta: json.meta,
          isOffline: false,
        };
      }
    } catch (err) {
      console.warn('[SevaService] Network fetch failed, trying offline cache:', err);
    }

    // Try reading from offline cache
    try {
      const cached = await SecureStore.getItemAsync(cacheKey);
      if (cached) {
        const parsed: SevaFeedResponse = JSON.parse(cached);
        return {
          data: parsed.data,
          meta: parsed.meta,
          isOffline: true,
        };
      }
    } catch (cacheErr) {
      console.warn('[SevaService] Cache read error:', cacheErr);
    }

    // Filter from curated offline defaults
    let filtered = CURATED_FALLBACK_VIDEOS.filter((v) => {
      if (filters?.category && filters.category !== 'all' && v.category !== filters.category) return false;
      if (filters?.ghat && v.ghat_id !== filters.ghat) return false;
      if (typeof filters?.live === 'boolean' && v.is_live !== filters.live) return false;
      return true;
    });

    return {
      data: filtered,
      meta: {
        total: filtered.length,
        live_count: filtered.filter((v) => v.is_live).length,
      },
      isOffline: true,
    };
  }

  /**
   * Helper to resolve localized text according to current app language with strict English fallback
   */
  static getLocalizedText(
    localized: LocalizedSevaString | undefined | null,
    lang: string = 'en',
    fallbackEn: string = ''
  ): string {
    if (!localized) return fallbackEn;
    if (lang === 'te' && localized.te) return localized.te;
    if (lang === 'hi' && localized.hi) return localized.hi;
    return localized.en || fallbackEn;
  }
}

