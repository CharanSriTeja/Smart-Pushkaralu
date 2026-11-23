import { pool, withTransaction } from '../index.js';

export interface SeedGhat {
  name: { en: string; te: string; hi: string };
  river: string;
  district: string;
  state: string;
  lat: number | null;
  lng: number | null;
  nearest_town: { en: string; te: string; hi: string };
  nearest_railway_station: { en: string; te: string; hi: string };
  nearest_bus_stand: { en: string; te: string; hi: string };
  official_source_url: string | null;
  verified_at: string | null;
  record_status: 'officially_listed' | 'reported' | 'unverified';
  bathing_status: 'allowed' | 'restricted' | 'closed' | 'unknown';
  crowd_level: 'low' | 'medium' | 'high' | 'very_high' | 'unknown';
  publish_status: 'draft' | 'published' | 'hidden';
  description: { en: string; te: string; hi: string };
  max_capacity: number | null;
  sources: Array<{
    source_url: string;
    source_name: string;
    source_type: 'government' | 'district_portal' | 'police_dept' | 'devasthanam' | 'media' | 'community' | 'other';
    is_official: boolean;
    notes?: string;
  }>;
  facilities: Array<never>;
  aarti_timings: Array<never>;
  notices?: Array<never>;
}

const EAST_GODAVARI_GHATS = [
  'Kotilingala Ghat',
  'Pushkar Ghat',
  'Saraswati Ghat',
  'Gowthami Ghat',
  'Tummalapalli Vari Revu',
  'Sri Narasimha Nagar Ghat',
  'Dowleshwaram Barrage Ghat',
  'Venkateswara Ghat',
  'Goshpada Kshetram (Main Kovvur Ghat)',
  'Subrahmanyeswara Ghat',
  'Nagareswaram Ghat',
  'Purushottapatnam Ghat',
  'Seethanagaram Ghat',
  'Pattiseema Ghat',
  'Vangalapudi Ghat',
];

const UNKNOWN_TEXT = {
  en: 'Not provided in the source register',
  te: 'మూల నమోదులో సమాచారం అందుబాటులో లేదు',
  hi: 'स्रोत रजिस्टर में जानकारी उपलब्ध नहीं है',
};

export const GODAVARI_GHATS_SEED: SeedGhat[] = EAST_GODAVARI_GHATS.map((name) => ({
  name: { en: name, te: name, hi: name },
  river: 'Godavari',
  district: 'East Godavari',
  state: 'Andhra Pradesh',
  lat: null,
  lng: null,
  nearest_town: UNKNOWN_TEXT,
  nearest_railway_station: UNKNOWN_TEXT,
  nearest_bus_stand: UNKNOWN_TEXT,
  official_source_url: null,
  verified_at: null,
  record_status: 'officially_listed',
  bathing_status: 'unknown',
  crowd_level: 'unknown',
  publish_status: 'published',
  description: {
    en: 'This ghat name is listed in the East Godavari district allocation register photographed for the project. Coordinates and operational details require separate verification.',
    te: 'ఈ ఘాట్ పేరు ప్రాజెక్ట్ కోసం ఫోటో తీసిన East Godavari జిల్లా రిజిస్టర్‌లో నమోదు చేయబడింది. స్థాన నిర్దేశాంకాలు మరియు కార్యకలాప వివరాలు విడిగా నిర్ధారించాలి.',
    hi: 'यह घाट नाम परियोजना हेतु ली गई East Godavari जिला रजिस्टर फोटो में दर्ज है। निर्देशांक और संचालन विवरण अलग से सत्यापित किए जाने आवश्यक हैं.',
  },
  max_capacity: null,
  sources: [],
  facilities: [],
  aarti_timings: [],
  notices: [],
}));

export async function runGhatSeeds(): Promise<void> {
  console.log('[Seed] Resetting ghats from the photographed district register...');

  await withTransaction(async (client) => {
    await client.query('DELETE FROM ghats');
    await client.query("UPDATE news_posts SET ghat_ids = '{}'::uuid[]");

    for (const ghat of GODAVARI_GHATS_SEED) {
      const insertRes = await client.query(
        `INSERT INTO ghats (
          name, river, district, state, lat, lng,
          nearest_town, nearest_railway_station, nearest_bus_stand,
          official_source_url, verified_at, record_status,
          bathing_status, crowd_level, publish_status,
          description, max_capacity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id`,
        [
          JSON.stringify(ghat.name),
          ghat.river,
          ghat.district,
          ghat.state,
          ghat.lat,
          ghat.lng,
          JSON.stringify(ghat.nearest_town),
          JSON.stringify(ghat.nearest_railway_station),
          JSON.stringify(ghat.nearest_bus_stand),
          ghat.official_source_url,
          ghat.verified_at,
          ghat.record_status,
          ghat.bathing_status,
          ghat.crowd_level,
          ghat.publish_status,
          JSON.stringify(ghat.description),
          ghat.max_capacity,
        ]
      );

      const ghatId = insertRes.rows[0].id;
      await client.query(
        `INSERT INTO crowd_status (ghat_id, current_level, source_type, confidence_score, note)
         VALUES ($1, 'unknown', 'default', 0.00, $2)
         ON CONFLICT (ghat_id) DO UPDATE SET
           current_level = 'unknown',
           source_type = 'default',
           confidence_score = 0.00,
           note = EXCLUDED.note,
           updated_at = CURRENT_TIMESTAMP`,
        [
          ghatId,
          JSON.stringify({
            en: 'Crowd status not provided in the source register',
            te: 'మూల నమోదులో రద్దీ స్థితి అందుబాటులో లేదు',
            hi: 'स्रोत रजिस्टर में भीड़ की स्थिति उपलब्ध नहीं है',
          }),
        ]
      );
    }

    await client.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (
         'ghat_register_2027',
         $1::jsonb,
         CURRENT_TIMESTAMP
       )
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = CURRENT_TIMESTAMP`,
      [
        JSON.stringify({
          source: 'Photographed Godavari Pushkarams 2027 ghat name register',
          stated_total: 440,
          districts: [
            { district: 'Dr. B.R. Ambedkar Konaseema', planned: 174, source_photo_value: 175 },
            { district: 'Kakinada', planned: 89 },
            { district: 'East Godavari', planned: 82 },
            { district: 'Eluru', planned: 44 },
            { district: 'West Godavari', planned: 40 },
            { district: 'Polavaram', planned: 11 },
          ],
          reconciled_total: 440,
          named_records_loaded: 15,
          unnamed_placeholders_loaded: 0,
          coordinates_pending: true,
        }),
      ]
    );
  });

  console.log('[Seed] Reset complete: 15 verified East Godavari names loaded.');
}

if (process.argv[1]?.includes('001_seed_ghats')) {
  runGhatSeeds()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] Failed:', err);
      await pool.end();
      process.exit(1);
    });
}
