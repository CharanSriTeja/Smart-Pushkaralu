import { query } from '../index.js';

export async function seedSosData(): Promise<void> {
  console.log('[Seed] Seeding Module 7 SOS Emergency Contacts & QR Zones...');

  // 1. Seed Emergency Contacts
  const contacts = [
    {
      label: { en: 'National Emergency Helpline (Police, Medical, Fire)', te: 'జాతీయ అత్యవసర సహాయం (పోలీస్, వైద్యం, ఫైర్)', hi: 'राष्ट्रीय आपातकालीन हेल्पलाइन' },
      phone: '112',
      kind: 'control_room',
      sort_order: 1,
    },
    {
      label: { en: 'Ambulance & Medical Emergency', te: 'అంబులెన్స్ & వైద్య సహాయం', hi: 'एम्बुलेंस और आपातकालीन चिकित्सा' },
      phone: '108',
      kind: 'ambulance',
      sort_order: 2,
    },
    {
      label: { en: 'Pushkaralu District Command Control Room', te: 'పుష్కరాల జిల్లా కమాండ్ కంట్రోల్ రూమ్', hi: 'पुष्करालु जिला कमान नियंत्रण कक्ष' },
      phone: '0883-2442233',
      kind: 'control_room',
      sort_order: 3,
    },
    {
      label: { en: 'Fire & Disaster Rescue Station', te: 'అగ్నిమాపక & విపత్తు రక్షణ విభాగం', hi: 'अग्निशमन एवं आपदा बचाव सेवा' },
      phone: '101',
      kind: 'fire',
      sort_order: 4,
    },
    {
      label: { en: 'Police Assistance & Lost Person Helpdesk', te: 'పోలీస్ సహాయం & తప్పిపోయిన వారి విభాగం', hi: 'पुलिस सहायता और लापता व्यक्ति डेस्क' },
      phone: '100',
      kind: 'police',
      sort_order: 5,
    },
  ];

  for (const c of contacts) {
    await query(
      `INSERT INTO emergency_contacts (label, phone, kind, sort_order, active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT DO NOTHING`,
      [JSON.stringify(c.label), c.phone, c.kind, c.sort_order]
    );
  }

  // 2. Fetch sample ghat for QR zones
  const { rows: ghatRows } = await query<{ id: string }>('SELECT id FROM ghats LIMIT 1');
  const ghatId = ghatRows.length > 0 ? ghatRows[0].id : null;

  const zones = [
    {
      zone_code: 'G07',
      label: { en: 'Main Bathing Steps - Sector G07', te: 'ప్రధాన స్నాన ఘట్టం - సెక్టార్ G07', hi: 'मुख्य स्नान सीढ़ियां - सेक्टर G07' },
      lat: 17.0005,
      lng: 81.7800,
    },
    {
      zone_code: 'ZONE-KOTI-A',
      label: { en: 'Kotilingala Ghat - North Changing Enclosure', te: 'కోటిలింగాల ఘాట్ - ఉత్తర దుస్తుల మార్పిడి గదులు', hi: 'कोटिलिंगाला घाट - उत्तर वस्त्र परिवर्तन कक्ष' },
      lat: 17.0012,
      lng: 81.7810,
    },
    {
      zone_code: 'ZONE-PUSH-VIP',
      label: { en: 'Pushkar Ghat - Central Aarti Pavilion', te: 'పుష్కర్ ఘాట్ - ప్రధాన హారతి వేదిక', hi: 'पुष्कर घाट - मुख्य आरती मंडप' },
      lat: 17.0045,
      lng: 81.7825,
    },
  ];

  for (const z of zones) {
    await query(
      `INSERT INTO qr_zones (zone_code, ghat_id, label, lat, lng, active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (zone_code) DO NOTHING`,
      [z.zone_code, ghatId, JSON.stringify(z.label), z.lat, z.lng]
    );
  }

  console.log('[Seed] Module 7 SOS Emergency Contacts & QR Zones seeded successfully.');
}

