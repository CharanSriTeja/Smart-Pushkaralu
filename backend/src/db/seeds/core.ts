import { pool, withTransaction } from '../index.js';
import { getAdminPhoneList } from '../../config/env.js';

export async function seedCore(): Promise<void> {
  console.log('[Seed:Core] Starting production-safe core database seeding...');

  await withTransaction(async (client) => {
    // 1. ROLES
    await client.query(`
      INSERT INTO roles (name) VALUES 
        ('super_admin'),
        ('editor'),
        ('viewer')
      ON CONFLICT (name) DO NOTHING;
    `);

    // 2. PERMISSIONS
    const permissions = [
      'ghats.read', 'ghats.create', 'ghats.update', 'ghats.publish', 'ghats.delete',
      'crowd.override',
      'notices.publish',
      'news.publish', 'news.delete',
      'issues.read', 'issues.update',
      'places.read', 'places.create', 'places.update', 'places.delete', 'places.cache',
      'routes.manage',
      'sos.read', 'sos.update',
      'transport.read', 'transport.write', 'transport.delete',
      'seva.read', 'seva.write', 'seva.manage', 'seva.publish',
      'settings.write',
      'audit.read'
    ];

    for (const perm of permissions) {
      await client.query(
        `INSERT INTO permissions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [perm]
      );
    }

    // 3. ROLE PERMISSIONS
    // super_admin gets all permissions
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'super_admin'
      ON CONFLICT DO NOTHING;
    `);

    // editor gets content permissions
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'editor'
        AND p.name IN (
          'ghats.read', 'ghats.create', 'ghats.update', 'ghats.publish',
          'notices.publish', 'news.publish',
          'issues.read', 'issues.update',
          'places.read', 'places.create', 'places.update',
          'routes.manage',
          'transport.read', 'transport.write',
          'seva.read', 'seva.write', 'seva.manage', 'seva.publish'
        )
      ON CONFLICT DO NOTHING;
    `);

    // viewer gets read permissions
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'viewer'
        AND p.name IN ('ghats.read', 'issues.read', 'places.read', 'transport.read', 'seva.read', 'audit.read')
      ON CONFLICT DO NOTHING;
    `);

    // 4. CORE PRODUCTION SETTINGS
    const defaultSettings: Array<{ key: string; value: any }> = [
      { key: 'default_language', value: 'en' },
      { key: 'available_languages', value: ['en', 'te', 'hi'] },
      { key: 'places_cache_days', value: 7 },
      { key: 'route_cache_days', value: 1 },
      { key: 'corridor_km', value: 3 },
      { key: 'corridor_km_max', value: 5 },
      { key: 'sos_rate_limit_per_hour', value: 10 },
      { key: 'sos_default_number', value: '112' },
      { key: 'routes.provider_daily_limit', value: 1800 },
      { key: 'routes.provider_per_minute_limit', value: 35 },
      {
        key: 'trip_checklist_template',
        value: [
          {
            id: 'id_card',
            label: {
              en: 'Government-issued Photo ID (Aadhaar / Voter ID / Passport)',
              te: 'ప్రభుత్వ గుర్తింపు కార్డు (ఆధార్ / ఓటర్ ఐడీ / పాస్‌పోర్ట్)',
              hi: 'सरकारी फोटो पहचान पत्र (आधार / मतदाता पहचान पत्र / पासपोर्ट)'
            },
            required: true
          },
          {
            id: 'dry_clothes',
            label: {
              en: 'Extra set of dry cotton clothes for holy bath',
              te: 'పుణ్యస్నానం అనంతరం ధరించడానికి అదనపు పొడి కాటన్ దుస్తులు',
              hi: 'पवित्र स्नान के बाद पहनने के लिए अतिरिक्त सूखे सूती वस्त्र'
            },
            required: true
          },
          {
            id: 'water_bottle',
            label: {
              en: 'Reusable drinking water bottle',
              te: 'పునర్వినియోగ తాగునీటి బాటిల్',
              hi: 'पुनः प्रयोज्य पीने के पानी की बोतल'
            },
            required: false
          },
          {
            id: 'medicines',
            label: {
              en: 'Personal prescription medicines & ORS packets',
              te: 'వ్యక్తిగత అవసరమైన మందులు మరియు ఓఆర్ఎస్ ప్యాకెట్లు',
              hi: 'व्यक्तिगत आवश्यक दवाइयां एवं ओआरएस पैकेट'
            },
            required: false
          },
          {
            id: 'emergency_contacts',
            label: {
              en: 'Handwritten emergency phone numbers note',
              te: 'చేతితో రాసిన అత్యవసర ఫోన్ నంబర్ల చీటీ',
              hi: 'हाथ से लिखे आवश्यक फोन नंबरों की पर्ची'
            },
            required: true
          }
        ]
      },
      {
        key: 'trip_advisory_template',
        value: [
          {
            id: 'barrage_safety',
            title: {
              en: 'River Current & Railing Safety',
              te: 'నదీ ప్రవాహం మరియు రక్షణ రెయిలింగ్ భద్రత',
              hi: 'नदी का बहाव एवं सुरक्षा रेलिंग निर्देश'
            },
            description: {
              en: 'Always bathe within the designated iron safety railings. Deep-water swimming and selfie-taking in strong river currents are strictly prohibited.',
              te: 'ఎల్లప్పుడూ నిర్ణీత ఇనుప రక్షణ రెయిలింగ్ పరిధిలోనే స్నానం చేయండి. నదిలో లోతుకు వెళ్లడం లేదా ప్రమాదకరంగా సెల్ఫీలు తీసుకోవడం నిషేధం.',
              hi: 'हमेशा निर्धारित सुरक्षा रेलिंग के भीतर ही स्नान करें। गहरे पानी में तैरना और सेल्फी लेना सख्त वर्जित है।'
            }
          },
          {
            id: 'elderly_children',
            title: {
              en: 'Children & Senior Citizen Care',
              te: 'పిల్లలు మరియు వయోవృద్ధుల సంరక్షణ',
              hi: 'बच्चों एवं वरिष्ठ नागरिकों की सुरक्षा'
            },
            description: {
              en: 'Place an identity card with name and contact numbers in the pockets of elderly pilgrims and children at all times in crowded ghats.',
              te: 'రద్దీ ప్రదేశాలలో వయోవృద్ధులు, పిల్లల జేబుల్లో పేరు మరియు ఫోన్ నంబర్ రాసిన కార్డును ఉంచండి.',
              hi: 'भीड़भाड़ वाले घाटों में बच्चों और बुजुर्गों की जेब में नाम व फोन नंबर वाली पर्ची अवश्य रखें।'
            }
          }
        ]
      }
    ];

    for (const setting of defaultSettings) {
      await client.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [setting.key, JSON.stringify(setting.value)]
      );
    }

    // 5. THE ONLY BUILT-IN EMERGENCY CONTACT: 112
    await client.query(`
      INSERT INTO emergency_contacts (label, phone, kind, sort_order, active)
      VALUES (
        '{"en": "National Emergency Helpline (Police / Medical / Fire)", "te": "జాతీయ అత్యవసర సహాయ కేంద్రం 112", "hi": "राष्ट्रीय आपातकालीन हेल्पलाइन 112"}'::jsonb,
        '112',
        'control_room',
        1,
        true
      )
      ON CONFLICT DO NOTHING;
    `);

    // 6. SEED FIRST SUPER ADMIN FROM ADMIN_PHONES
    const adminPhones = getAdminPhoneList();
    if (adminPhones.length > 0) {
      const { rows: roleRows } = await client.query(
        "SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1"
      );
      if (roleRows.length > 0) {
        const superAdminRoleId = roleRows[0].id;
        for (const phone of adminPhones) {
          const { rows: userRows } = await client.query(
            'SELECT id FROM users WHERE phone = $1 LIMIT 1',
            [phone]
          );
          let userId: string;
          if (userRows.length === 0) {
            const { rows: newUserRows } = await client.query(
              `INSERT INTO users (firebase_uid, phone, name, language)
               VALUES ($1, $2, 'Super Admin', 'en')
               RETURNING id`,
              [`superadmin_${phone.replace(/\D/g, '')}`, phone]
            );
            userId = newUserRows[0].id;
          } else {
            userId = userRows[0].id;
          }

          await client.query(
            `INSERT INTO admins (user_id, role, role_id)
             VALUES ($1, 'super_admin', $2)
             ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', role_id = $2`,
            [userId, superAdminRoleId]
          );
          console.log(`[Seed:Core] Configured super_admin for phone ${phone}`);
        }
      }
    }
  });

  console.log('[Seed:Core] Core production seeds applied successfully.');
}

if (process.argv[1]?.endsWith('core.ts')) {
  seedCore()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed:Core] Failed:', err);
      await pool.end();
      process.exit(1);
    });
}

