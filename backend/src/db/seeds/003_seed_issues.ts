import { query, pool } from '../index.js';

export async function seedIssues() {
  console.log('[Seed] Seeding sample Godavari Pushkaralu 2027 issue reports & timelines...');

  // Get some ghat IDs if available
  const ghatsRes = await query<{ id: string; name: any; lat: number; lng: number }>('SELECT id, name, lat, lng FROM ghats LIMIT 5');
  const ghats = ghatsRes.rows;

  const existingRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM issue_reports');
  if (parseInt(existingRes.rows[0]?.count || '0', 10) > 0) {
    console.log('[Seed] issue_reports table already has records. Skipping initial seeding.');
    return;
  }

  const kotiGhat = ghats[0] || { id: null, lat: 16.989065, lng: 81.775412 };
  const pushkarGhat = ghats[1] || { id: null, lat: 17.004921, lng: 81.779834 };
  const saraswathiGhat = ghats[2] || { id: null, lat: 16.985412, lng: 81.772341 };

  const sampleIssues = [
    {
      ticket_no: 'SP-2027-SN84K1',
      category: 'sanitation',
      description: 'Accumulation of discarded cloth packaging and food boxes near Kotilingala main bathing ramp.',
      photo_url: null,
      location_type: 'gps',
      lat: Number(kotiGhat.lat) || 16.989065,
      lng: Number(kotiGhat.lng) || 81.775412,
      qr_zone_id: 'ZONE-KOTI-A',
      ghat_id: kotiGhat.id,
      status: 'in_progress',
      priority: 'high',
      reporter_phone: '+919876543210',
      device_fingerprint: 'demo-dev-1',
      duplicate_count: 2,
      updates: [
        {
          status: 'submitted',
          public_note: 'Issue reported by pilgrim and acknowledged by control desk.',
          internal_note: 'Pilgrim reported via mobile app at Zone A.',
        },
        {
          status: 'under_review',
          public_note: 'Sanitation supervisor deployed inspection team to Kotilingala Sector 1.',
          internal_note: 'Sanitation Inspector Murthy notified on duty channel.',
        },
        {
          status: 'in_progress',
          public_note: 'Sanitation squad on site with disposal vehicle. Clearing in progress.',
          internal_note: 'Squad #4 assigned. Estimated clearing time 20 minutes.',
        },
      ],
    },
    {
      ticket_no: 'SP-2027-WT29M7',
      category: 'water',
      description: 'Drinking water dispenser unit #3 tap 2 is leaking continuously, causing muddy puddles.',
      photo_url: null,
      location_type: 'qr_zone',
      lat: Number(pushkarGhat.lat) || 17.004921,
      lng: Number(pushkarGhat.lng) || 81.779834,
      qr_zone_id: 'QR-DISPENSER-PUSHKAR-03',
      ghat_id: pushkarGhat.id,
      status: 'resolved',
      priority: 'medium',
      reporter_phone: '+919123456789',
      device_fingerprint: 'demo-dev-2',
      duplicate_count: 0,
      updates: [
        {
          status: 'submitted',
          public_note: 'Drinking water maintenance ticket created.',
          internal_note: 'Tap leakage reported near Pushkar Ghat gate 2.',
        },
        {
          status: 'in_progress',
          public_note: 'Plumbing response team arrived with replacement valve.',
          internal_note: 'RWS plumbing team on site.',
        },
        {
          status: 'resolved',
          public_note: 'Tap replaced and water flow restored with zero leakage.',
          internal_note: 'Valve replaced with heavy-duty brass fitting. Tested OK.',
        },
      ],
    },
    {
      ticket_no: 'SP-2027-LT55P9',
      category: 'lighting',
      description: 'Two floodlights in the changing room area are flickering intermittently.',
      photo_url: null,
      location_type: 'map_pin',
      lat: Number(saraswathiGhat.lat) || 16.985412,
      lng: Number(saraswathiGhat.lng) || 81.772341,
      qr_zone_id: null,
      ghat_id: saraswathiGhat.id,
      status: 'submitted',
      priority: 'medium',
      reporter_phone: null,
      device_fingerprint: 'guest-pilgrim-99',
      duplicate_count: 0,
      updates: [
        {
          status: 'submitted',
          public_note: 'Grievance submitted and routed to electrical control room.',
          internal_note: 'Guest pilgrim report via QR scan poster.',
        },
      ],
    },
    {
      ticket_no: 'SP-2027-CR72X3',
      category: 'crowd',
      description: 'Cloak room queue bottlenecking entrance corridor; crowd marshals needed for line management.',
      photo_url: null,
      location_type: 'gps',
      lat: Number(kotiGhat.lat) + 0.0003 || 16.989365,
      lng: Number(kotiGhat.lng) || 81.775412,
      qr_zone_id: 'CLOAK-NORTH',
      ghat_id: kotiGhat.id,
      status: 'under_review',
      priority: 'urgent',
      reporter_phone: '+919988776655',
      device_fingerprint: 'demo-dev-3',
      duplicate_count: 1,
      updates: [
        {
          status: 'submitted',
          public_note: 'Crowd management report received.',
          internal_note: 'Cloakroom bottleneck flagged by pilgrim.',
        },
        {
          status: 'under_review',
          public_note: 'Security control room reviewing CCTV feed to dispatch crowd marshals.',
          internal_note: 'Police sub-inspector alerted on wireless.',
        },
      ],
    },
    {
      ticket_no: 'SP-2027-RD31Q8',
      category: 'road',
      description: 'Temporary wooden barricade plank loose near foot ramp entrance.',
      photo_url: null,
      location_type: 'gps',
      lat: Number(pushkarGhat.lat) - 0.0002 || 17.004721,
      lng: Number(pushkarGhat.lng) || 81.779834,
      qr_zone_id: null,
      ghat_id: pushkarGhat.id,
      status: 'resolved',
      priority: 'high',
      reporter_phone: null,
      device_fingerprint: 'demo-dev-4',
      duplicate_count: 0,
      updates: [
        {
          status: 'submitted',
          public_note: 'Pathway barricade maintenance report logged.',
          internal_note: 'R&B engineering team notified.',
        },
        {
          status: 'in_progress',
          public_note: 'Carpentry squad repairing barricade supports.',
          internal_note: 'Reinforcing with steel clamps.',
        },
        {
          status: 'resolved',
          public_note: 'Barricade secured and inspected for pilgrim safety.',
          internal_note: 'Inspection complete. Safe for pedestrian flow.',
        },
      ],
    },
  ];

  for (const item of sampleIssues) {
    const { rows: issueRows } = await query<{ id: string }>(
      `INSERT INTO issue_reports (
        ticket_no, category, description, photo_url, location_type,
        lat, lng, qr_zone_id, ghat_id, status, priority,
        reporter_phone, device_fingerprint, duplicate_count,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14,
        CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP
      ) RETURNING id`,
      [
        item.ticket_no,
        item.category,
        item.description,
        item.photo_url,
        item.location_type,
        item.lat,
        item.lng,
        item.qr_zone_id,
        item.ghat_id,
        item.status,
        item.priority,
        item.reporter_phone,
        item.device_fingerprint,
        item.duplicate_count,
      ]
    );

    const issueId = issueRows[0].id;

    for (let i = 0; i < item.updates.length; i++) {
      const upd = item.updates[i];
      await query(
        `INSERT INTO issue_updates (
          issue_id, status, public_note, internal_note, resolution_photo_url, created_at
        ) VALUES ($1, $2, $3, $4, null, CURRENT_TIMESTAMP - ($5 || ' minutes')::interval)`,
        [
          issueId,
          upd.status,
          upd.public_note,
          upd.internal_note,
          ((item.updates.length - i) * 30).toString(),
        ]
      );
    }
  }

  console.log(`[Seed] Successfully seeded ${sampleIssues.length} sample issue reports.`);
}

if (process.argv[1]?.includes('003_seed_issues')) {
  seedIssues()
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

