import { query } from '../index.js';

export async function seedTransportData(): Promise<void> {
  console.log('[Seed] Seeding Module 6 Transport, Shuttles & Official Links...');

  // 1. External Links
  const links = [
    {
      category: 'bus',
      key: 'apsrtc_booking',
      title: {
        en: 'APSRTC Official Ticket Booking',
        te: 'ఆర్టీసీ అధికారిక టికెట్ బుకింగ్',
        hi: 'एपीएसआरटीसी आधिकारिक टिकट बुकिंग',
      },
      description: {
        en: 'Official Andhra Pradesh State Road Transport Corporation online reservation portal',
        te: 'ఆంధ్రప్రదేశ్ రాష్ట్ర రోడ్డు రవాణా సంస్థ అధికారిక ఆన్‌లైన్ రిజర్వేషన్ పోర్టల్',
        hi: 'आंध्र प्रदेश राज्य सड़क परिवहन निगम आधिकारिक ऑनलाइन आरक्षण पोर्टल',
      },
      url: 'https://www.apsrtconline.in',
      official_authority: 'APSRTC (Govt. of Andhra Pradesh)',
      sort_order: 1,
    },
    {
      category: 'bus',
      key: 'tgsrtc_booking',
      title: {
        en: 'TGSRTC Official Portal',
        te: 'టిజిఎస్ఆర్టీసీ అధికారిక పోర్టల్',
        hi: 'टीजीएसआरटीसी आधिकारिक पोर्टल',
      },
      description: {
        en: 'Telangana State Road Transport Corporation official reservation and enquiry portal',
        te: 'తెలంగాణ రాష్ట్ర రోడ్డు రవాణా సంస్థ అధికారిక రిజర్వేషన్ మరియు విచారణ పోర్టల్',
        hi: 'तेलंगाना राज्य सड़क परिवहन निगम आधिकारिक आरक्षण और पूछताछ पोर्टल',
      },
      url: 'https://www.tgsrtcbus.in',
      official_authority: 'TGSRTC (Govt. of Telangana)',
      sort_order: 2,
    },
    {
      category: 'rail',
      key: 'rail_ntes_enquiry',
      title: {
        en: 'NTES National Train Enquiry System',
        te: 'ఎన్‌టీఈఎస్ జాతీయ రైలు విచారణ వ్యవస్థ',
        hi: 'एनटीईएस राष्ट्रीय रेल पूछताछ प्रणाली',
      },
      description: {
        en: 'Official CRIS portal for live train schedule, spot your train, and station arrivals',
        te: 'లైవ్ రైలు సమయాలు, రైలు ఎక్కడుందో తెలుసుకోవడానికి అధికారిక క్రిస్ పోర్టల్',
        hi: 'लाइव ट्रेन शेड्यूल और स्टेशन आगमन के लिए आधिकारिक क्रिस पोर्टल',
      },
      url: 'https://enquiry.indianrail.gov.in',
      official_authority: 'Centre for Railway Information Systems (CRIS)',
      sort_order: 1,
    },
    {
      category: 'rail',
      key: 'irctc_seat_avail',
      title: {
        en: 'IRCTC Seat Availability & Booking',
        te: 'ఐఆర్‌సిటిసి సీట్ లభ్యత & బుకింగ్',
        hi: 'आईआरसीटीसी सीट उपलब्धता और बुकिंग',
      },
      description: {
        en: 'Official Indian Railway Catering and Tourism Corporation reservation gateway',
        te: 'భారతీయ రైల్వేల అధికారిక సీట్ల లభ్యత మరియు టికెట్ బుకింగ్ గేట్‌వే',
        hi: 'भारतीय रेलवे का आधिकारिक सीट उपलब्धता और टिकट बुकिंग गेटवे',
      },
      url: 'https://www.irctc.co.in/nget/train-search',
      official_authority: 'IRCTC (Indian Railways)',
      sort_order: 2,
    },
    {
      category: 'rail',
      key: 'rail_pnr_status',
      title: {
        en: 'Indian Railways Official PNR Status',
        te: 'భారతీయ రైల్వే అధికారిక పీఎన్‌ఆర్ స్థితి',
        hi: 'भारतीय रेलवे आधिकारिक पीएनआर स्थिति',
      },
      description: {
        en: 'Check real-time confirmation status for booked Pushkaralu train tickets',
        te: 'బుక్ చేసిన పుష్కరాల రైలు టిక్కెట్ల నిజ-సమయ నిర్ధారణ స్థితిని తనిఖీ చేయండి',
        hi: 'बुक किए गए पुष्करालु ट्रेन टिकटों की वास्तविक समय पुष्टि स्थिति जांचें',
      },
      url: 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html',
      official_authority: 'Indian Railways Official Portal',
      sort_order: 3,
    },
    {
      category: 'rail',
      key: 'rail_live_status',
      title: {
        en: 'Live Train Running Status (NTES)',
        te: 'లైవ్ రైలు నడుస్తున్న స్థితి (NTES)',
        hi: 'लाइव ट्रेन रनिंग स्टेटस (एनटीईएस)',
      },
      description: {
        en: 'GPS-tracked live train running status, platform numbers, and delay updates',
        te: 'జీపీఎస్ ఆధారిత లైవ్ రైలు స్థితి, ప్లాట్‌ఫారమ్ నంబర్లు మరియు ఆలస్య సమయాలు',
        hi: 'जीपीएस ट्रैक किया गया लाइव ट्रेन स्टेटस, प्लेटफॉर्म नंबर और देरी अपडेट',
      },
      url: 'https://enquiry.indianrail.gov.in/mntes/',
      official_authority: 'NTES / Indian Railways',
      sort_order: 4,
    },
    {
      category: 'rail',
      key: 'rail_madad_helpline',
      title: {
        en: 'RailMadad & Emergency Helpline 139',
        te: 'రైల్ మదద్ & అత్యవసర హెల్ప్‌లైన్ 139',
        hi: 'रेल मदद और आपातकालीन हेल्पलाइन 139',
      },
      description: {
        en: 'Integrated Railway Customer Grievance, Medical Emergency & Security Portal',
        te: 'రైల్వే యాత్రికుల సమస్యలు, వైద్య అత్యవసరం మరియు భద్రత కోసం అధికారిక పోర్టల్',
        hi: 'रेलवे शिकायत, चिकित्सा आपातकाल और सुरक्षा के लिए एकीकृत पोर्टल',
      },
      url: 'https://railmadad.indianrailways.gov.in',
      official_authority: 'Ministry of Railways (Government of India)',
      sort_order: 5,
    },
  ];

  for (const l of links) {
    await query(
      `INSERT INTO external_links (category, key, title, description, url, official_authority, sort_order, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)
       ON CONFLICT (key) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         url = EXCLUDED.url,
         official_authority = EXCLUDED.official_authority,
         updated_at = NOW()`,
      [
        l.category,
        l.key,
        JSON.stringify(l.title),
        JSON.stringify(l.description),
        l.url,
        l.official_authority,
        l.sort_order,
      ]
    );
  }

  // 2. Transport Hubs
  const hubs = [
    {
      name: {
        en: 'Rajahmundry Central Bus Station (APSRTC Complex)',
        te: 'రాజమండ్రి సెంట్రల్ బస్ స్టేషన్ (ఆర్టీసీ కాంప్లెక్స్)',
        hi: 'राजमंड्री सेंट्रल बस स्टेशन (एपीएसआरटीसी कॉम्प्लेक्स)',
      },
      hub_type: 'bus_stand',
      operator: 'APSRTC',
      code: 'RJY-CBS',
      address: { en: 'Morampudi Road, Rajahmundry, East Godavari, AP' },
      phone: '+91 883 2462002',
      lat: 17.0095,
      lng: 81.7892,
    },
    {
      name: {
        en: 'Kovvur Bus Station',
        te: 'కొవ్వూరు బస్ స్టేషన్',
        hi: 'कोव्वूर बस स्टेशन',
      },
      hub_type: 'bus_stand',
      operator: 'APSRTC',
      code: 'KVR-BS',
      address: { en: 'Main Road, Kovvur, West Godavari, AP' },
      phone: '+91 8813 231222',
      lat: 17.0112,
      lng: 81.7345,
    },
    {
      name: {
        en: 'Rajahmundry Main Railway Station (RJY)',
        te: 'రాజమండ్రి మెయిన్ రైల్వే స్టేషన్ (RJY)',
        hi: 'राजमंड्री मुख्य रेलवे स्टेशन (RJY)',
      },
      hub_type: 'railway_station',
      operator: 'Indian Railways (SCR)',
      code: 'RJY',
      address: { en: 'Railway Station Road, Rajahmundry, AP - 533101' },
      phone: '139',
      lat: 16.9934,
      lng: 81.7821,
    },
    {
      name: {
        en: 'Godavari Railway Station (GVN)',
        te: 'గోదావరి రైల్వే స్టేషన్ (GVN)',
        hi: 'गोदाవరి రైల్వే స్టేషన్ (GVN)',
      },
      hub_type: 'railway_station',
      operator: 'Indian Railways (SCR)',
      code: 'GVN',
      address: { en: 'Ghat Road, Rajahmundry, AP - 533101' },
      phone: '139',
      lat: 17.0022,
      lng: 81.7745,
    },
  ];

  for (const h of hubs) {
    await query(
      `INSERT INTO transport_hubs (name, hub_type, operator, code, address, phone, lat, lng, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT DO NOTHING`,
      [
        JSON.stringify(h.name),
        h.hub_type,
        h.operator,
        h.code,
        JSON.stringify(h.address),
        h.phone,
        h.lat,
        h.lng,
      ]
    );
  }

  // 3. Rail Stations
  const railStations = [
    {
      station_code: 'RJY',
      station_name: { en: 'Rajahmundry Railway Station', te: 'రాజమండ్రి రైల్వే స్టేషన్', hi: 'राजमंड्री रेलवे स्टेशन' },
      division: 'Vijayawada (BZA)',
      zone: 'SCR',
      total_platforms: 5,
      helpdesk_phone: '+91 883 2463131',
      lat: 16.9934,
      lng: 81.7821,
    },
    {
      station_code: 'GVN',
      station_name: { en: 'Godavari Railway Halt', te: 'గోదావరి రైల్వే హాల్ట్', hi: 'गोदावरी रेलवे हॉल्ट' },
      division: 'Vijayawada (BZA)',
      zone: 'SCR',
      total_platforms: 2,
      helpdesk_phone: '139',
      lat: 17.0022,
      lng: 81.7745,
    },
    {
      station_code: 'KVR',
      station_name: { en: 'Kovvur Railway Station', te: 'కొవ్వూరు రైల్వే స్టేషన్', hi: 'कोव्वूर रेलवे स्टेशन' },
      division: 'Vijayawada (BZA)',
      zone: 'SCR',
      total_platforms: 3,
      helpdesk_phone: '+91 8813 231456',
      lat: 17.0068,
      lng: 81.7388,
    },
  ];

  for (const r of railStations) {
    await query(
      `INSERT INTO rail_stations (station_code, station_name, division, zone, total_platforms, helpdesk_phone, lat, lng, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (station_code) DO NOTHING`,
      [
        r.station_code,
        JSON.stringify(r.station_name),
        r.division,
        r.zone,
        r.total_platforms,
        r.helpdesk_phone,
        r.lat,
        r.lng,
      ]
    );
  }

  console.log('[Seed] Module 6 transport seeds applied successfully.');
}

if (process.argv[1] && process.argv[1].includes('006_seed_transport')) {
  seedTransportData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}

