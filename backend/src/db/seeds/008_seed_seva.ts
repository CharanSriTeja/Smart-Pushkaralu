import { withTransaction } from '../index.js';
import { logger } from '../../lib/logger.js';

const SEED_SEVA_VIDEOS = [
  {
    id: 'seva-live-harathi-01',
    youtube_id: 'dQw4w9WgXcQ',
    youtube_url: 'https://www.youtube.com/live/dQw4w9WgXcQ',
    title_en: 'Maha Pushkar Godavari Harathi - Live Evening Darshan',
    title_te: 'మహా పుష్కర గోదావరి హారతి - ప్రత్యక్ష ప్రసారం',
    title_hi: 'महा पुष्कर गोदावरी महा आरती - सीधा प्रसारण',
    description_en: 'Live streaming of sacred Godavari Nithya Harathi performed by Vedic priests at Pushkar Ghat, Rajahmundry.',
    description_te: 'రాజమండ్రి పుష్కర్ ఘాట్ వద్ద వేద పండితులచే నిర్వహించబడుతున్న దివ్య గోదావరి హారతి ప్రత్యక్ష ప్రసారం.',
    description_hi: 'पुष्कर घाट, राजमुंदरी पर वैदिक पुजारियों द्वारा पवित्र गोदावरी नित्य महा आरती का सीधा प्रसारण।',
    category: 'aarthi',
    ghat_id: 'pushkar-ghat-01',
    event_date: new Date().toISOString(),
    is_live: true,
    published: true,
    sort_order: 1,
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  },
  {
    id: 'seva-kotilingala-rudrabhishekam-02',
    youtube_id: 'C0DPdy98e4c',
    youtube_url: 'https://www.youtube.com/watch?v=C0DPdy98e4c',
    title_en: 'Sri Kotilingeswara Swamy Maha Rudrabhishekam',
    title_te: 'శ్రీ కోటిలింగేశ్వర స్వామి మహా రుద్రాభిషేకం',
    title_hi: 'श्री कोटिलिंगेश्वर स्वामी महा रुद्राभिषेक',
    description_en: 'Sacred Rudrabhishekam performed on the holy banks of Godavari during Pushkaralu festival.',
    description_te: 'పుష్కరాల సందర్భంగా గోదావరి తీరాన నిర్వహించిన పవిత్ర రుద్రాభిషేక దృశ్యాలు.',
    description_hi: 'पुष्करालु महोत्सव के दौरान गोदावरी के पावन तट पर आयोजित पवित्र रुद्राभिषेक।',
    category: 'pooja',
    ghat_id: 'kotilingala-ghat-02',
    event_date: '2026-11-02T04:30:00Z',
    is_live: false,
    published: true,
    sort_order: 2,
    thumbnail_url: 'https://img.youtube.com/vi/C0DPdy98e4c/hqdefault.jpg',
  },
  {
    id: 'seva-cultural-classical-03',
    youtube_id: '9bZkp7q19f0',
    youtube_url: 'https://youtu.be/9bZkp7q19f0',
    title_en: 'Pushkara Shobha: Kuchipudi Dance Festival at Saraswathi Ghat',
    title_te: 'పుష్కర శోభ: సరస్వతి ఘాట్ వద్ద కూచిపూడి నృత్యోత్సవం',
    title_hi: 'पुष्कर शोभा: सरस्वती घाट पर कुचिपुड़ी नृत्य महोत्सव',
    description_en: 'Grand cultural showcase celebrating Godavari river heritage featuring renowned classical artists.',
    description_te: 'గోదావరి నదీ వైభవాన్ని చాటిచెప్పే కూచిపూడి కళాకారుల శాస్త్రీయ నృత్య ప్రదర్శన.',
    description_hi: 'गोदावरी नदी की सांस्कृतिक विरासत को प्रदर्शित करने वाला भव्य कुचिपुड़ी शास्त्रीय नृत्य कार्यक्रम।',
    category: 'cultural',
    ghat_id: 'saraswathi-ghat-03',
    event_date: '2026-11-03T18:00:00Z',
    is_live: false,
    published: true,
    sort_order: 3,
    thumbnail_url: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
  },
  {
    id: 'seva-snanam-guide-04',
    youtube_id: 'kJQP7kiw5Fk',
    youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    title_en: 'Pushkara Punya Snanam Ritual Procedures & Guidelines',
    title_te: 'పుష్కర పుణ్య స్నాన విధి విధానాలు & సూచనలు',
    title_hi: 'पुष्कर पुण्य स्नान विधि और महत्वपूर्ण दिशा-निर्देश',
    description_en: 'Official priest guidance on the traditional rituals, sankalpam, and sacred bath timings.',
    description_te: 'పుష్కర పుణ్యస్నానం ఆచరించే పద్ధతులు, సంకల్పం మరియు ముఖ్య సూచనలపై పండితుల వివరణ.',
    description_hi: 'पुष्कर पुण्य स्नान करने की विधि, संकल्प एवं पवित्र स्नान समय पर विद्वानों का मार्गदर्शन।',
    category: 'snanam',
    ghat_id: 'pushkar-ghat-01',
    event_date: '2026-11-04T07:00:00Z',
    is_live: false,
    published: true,
    sort_order: 4,
    thumbnail_url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
  },
  {
    id: 'seva-draft-unpub-05',
    youtube_id: '3JZ_D3ELwOQ',
    youtube_url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    title_en: 'Upcoming: VIP Pushkar Bath Preparation Preview (Draft)',
    title_te: 'రాబోయే కార్యక్రమం: వీఐపీ ఘాట్ ఏర్పాట్లు (చిత్తుప్రతి)',
    title_hi: 'आगामी: वीआईपी घाट व्यवस्था पूर्वावलोकन (प्रारूप)',
    description_en: 'Internal preview video for administrative review.',
    description_te: 'పరిపాలనా సమీక్ష కోసం అంతర్గత వీడియో.',
    description_hi: 'प्रशासनिक समीक्षा के लिए आंतरिक वीडियो।',
    category: 'general',
    ghat_id: null,
    event_date: '2026-11-10T10:00:00Z',
    is_live: false,
    published: false,
    sort_order: 5,
    thumbnail_url: 'https://img.youtube.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
  },
];

export async function runSevaSeeds() {
  logger.info('[Seed] Seeding Module 10 Virtual Seva videos...');

  try {
    await withTransaction(async (client) => {
      for (const video of SEED_SEVA_VIDEOS) {
        await client.query(
          `INSERT INTO seva_videos (
            id, youtube_id, youtube_url, title_en, title_te, title_hi,
            description_en, description_te, description_hi, category,
            ghat_id, event_date, is_live, published, sort_order, thumbnail_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            youtube_id = EXCLUDED.youtube_id,
            youtube_url = EXCLUDED.youtube_url,
            title_en = EXCLUDED.title_en,
            title_te = EXCLUDED.title_te,
            title_hi = EXCLUDED.title_hi,
            description_en = EXCLUDED.description_en,
            description_te = EXCLUDED.description_te,
            description_hi = EXCLUDED.description_hi,
            category = EXCLUDED.category,
            ghat_id = EXCLUDED.ghat_id,
            event_date = EXCLUDED.event_date,
            is_live = EXCLUDED.is_live,
            published = EXCLUDED.published,
            sort_order = EXCLUDED.sort_order,
            thumbnail_url = EXCLUDED.thumbnail_url,
            updated_at = NOW()`,
          [
            video.id,
            video.youtube_id,
            video.youtube_url,
            video.title_en,
            video.title_te,
            video.title_hi,
            video.description_en,
            video.description_te,
            video.description_hi,
            video.category,
            video.ghat_id,
            video.event_date,
            video.is_live,
            video.published,
            video.sort_order,
            video.thumbnail_url,
          ]
        );
      }
    });

    logger.info(`[Seed] Successfully seeded ${SEED_SEVA_VIDEOS.length} Seva videos.`);
  } catch (err: any) {
    logger.error({ err }, '[Seed] Failed to seed Seva videos');
  }
}

if (process.argv[1] && process.argv[1].endsWith('008_seed_seva.ts')) {
  runSevaSeeds().then(() => process.exit(0));
}

