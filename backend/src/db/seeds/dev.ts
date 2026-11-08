import { pool, withTransaction } from '../index.js';
import { env } from '../../config/env.js';

export async function seedDev(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('[Seed:Dev] Refusing to seed demo data in production environment!');
  }

  if (!env.SEED_DEMO) {
    console.log('[Seed:Dev] SEED_DEMO is false or not set. Skipping dev seed.');
    return;
  }

  console.log('[Seed:Dev] Seeding UI testing demo data (all rows tagged is_demo=true)...');

  await withTransaction(async (client) => {
    // 1. [DEMO] Ghat
    const ghatRes = await client.query(
      `INSERT INTO ghats (
        name, river, district, state, lat, lng,
        nearest_town, nearest_railway_station, nearest_bus_stand,
        bathing_status, crowd_level, publish_status,
        description, max_capacity, is_demo
      ) VALUES (
        $1, 'Godavari', 'East Godavari', 'Andhra Pradesh', 17.0010, 81.7750,
        $2, $3, $4,
        'allowed', 'low', 'published',
        $5, 5000, true
      ) RETURNING id`,
      [
        JSON.stringify({ en: '[DEMO] Saraswati Pushkar Ghat', te: '[DEMO] సరస్వతి పుష్కర ఘాట్', hi: '[DEMO] सरस्वती पुष्कर घाट' }),
        JSON.stringify({ en: 'Rajahmundry', te: 'రాజమండ్రి', hi: 'राजमुंदरी' }),
        JSON.stringify({ en: 'Godavari Station (GVN)', te: 'గోదావరి స్టేషన్', hi: 'गोदावरी स्टेशन' }),
        JSON.stringify({ en: 'Kotipalli Bus Stand', te: 'కోటిపల్లి బస్ స్టాండ్', hi: 'कोटिपल्ली बस स्टैंड' }),
        JSON.stringify({ en: 'Demo ghat for local UI and screen layout verification.', te: 'యూఐ పరీక్ష కోసం డెమో ఘాట్.', hi: 'यूआई परीक्षण हेतु डेमो घाट।' }),
      ]
    );
    const demoGhatId = ghatRes.rows[0].id;

    // 2. [DEMO] News Bulletin
    await client.query(
      `INSERT INTO news_posts (
        title, content, summary, category, priority,
        ghat_ids, is_official, is_pinned, publish_status,
        published_at, is_demo
      ) VALUES (
        $1, $2, $3, 'advisory', 'normal',
        $4, true, false, 'published',
        NOW(), true
      )`,
      [
        JSON.stringify({
          en: '[DEMO] Morning Flow Advisory for Pilgrims',
          te: '[DEMO] భక్తులకు ఉదయం ప్రవాహ సూచన',
          hi: '[DEMO] श्रद्धालुओं के लिए प्रातःकालीन परामर्श',
        }),
        JSON.stringify({
          en: '[DEMO DATA] River water levels remain calm and well within safety markers across all designated bathing sectors.',
          te: '[డెమో డేటా] అన్ని స్నాన ఘాట్ల వద్ద నీటి మట్టం సాధారణంగా మరియు సురక్షితంగా ఉంది.',
          hi: '[डेमो डेटा] सभी निर्धारित स्नान घाटों पर नदी का जलस्तर सामान्य और सुरक्षा मानकों के भीतर है।',
        }),
        JSON.stringify({
          en: '[DEMO] River water levels remain calm and well within safety markers.',
          te: '[డెమో] నీటి మట్టం సాధారణంగా ఉంది.',
          hi: '[डेमो] जलस्तर सामान्य और सुरक्षित है।',
        }),
        [demoGhatId],
      ]
    );

    // 3. [DEMO] Grievance / Issue
    await client.query(
      `INSERT INTO issues (
        category, title, description, lat, lng,
        ghat_id, status, is_demo
      ) VALUES (
        'sanitation',
        '[DEMO] Changing room maintenance inspection',
        '[DEMO DATA] Regular maintenance check scheduled for North enclosure.',
        17.0010, 81.7750,
        $1, 'open', true
      )`,
      [demoGhatId]
    );

    // 4. [DEMO] Transport Hub
    const hubRes = await client.query(
      `INSERT INTO transport_hubs (
        name, hub_type, operator, code, phone,
        lat, lng, is_active, is_demo
      ) VALUES (
        $1, 'bus_stand', 'APSRTC', 'DEMO-CBS', '+91 883 0000000',
        17.0090, 81.7890, true, true
      ) RETURNING id`,
      [
        JSON.stringify({
          en: '[DEMO] Central Bus Terminal',
          te: '[DEMO] సెంట్రల్ బస్ టెర్మినల్',
          hi: '[DEMO] सेंट्रल बस टर्मिनल',
        }),
      ]
    );
    const demoHubId = hubRes.rows[0].id;

    // 5. [DEMO] Shuttle Route
    await client.query(
      `INSERT INTO shuttle_routes (
        route_code, route_name, shuttle_type, fare,
        frequency_minutes, accessible_for_elderly_disabled,
        color_code, is_active, is_demo
      ) VALUES (
        'DEMO-SHTL-01',
        $1,
        'free', 0, 10, true, '#16A34A', true, true
      )`,
      [
        JSON.stringify({
          en: '[DEMO] Circular Pilgrim Shuttle Service',
          te: '[DEMO] సర్క్యులర్ భక్త షటిల్ సర్వీస్',
          hi: '[DEMO] सर्कुलर तीर्थयात्री शटल सेवा',
        }),
      ]
    );
  });

  console.log('[Seed:Dev] Demo data seeded successfully.');
}

if (process.argv[1]?.endsWith('dev.ts')) {
  seedDev()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed:Dev] Failed:', err);
      await pool.end();
      process.exit(1);
    });
}

