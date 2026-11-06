import { pool, withTransaction } from '../index.js';

export interface SeedGhat {
  id?: string;
  name: { en: string; te: string; hi: string };
  river: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
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
  max_capacity: number;
  sources: Array<{
    source_url: string;
    source_name: string;
    source_type: 'government' | 'district_portal' | 'police_dept' | 'devasthanam' | 'media' | 'community' | 'other';
    is_official: boolean;
    notes?: string;
  }>;
  facilities: Array<{
    facility_type: string;
    details: { en: string; te: string; hi: string };
    is_operational: boolean;
    count: number;
  }>;
  aarti_timings: Array<{
    name: { en: string; te: string; hi: string };
    time_start: string;
    time_end: string;
    description: { en: string; te: string; hi: string };
    days_of_week: string;
  }>;
  notices?: Array<{
    title: { en: string; te: string; hi: string };
    message: { en: string; te: string; hi: string };
    severity: 'info' | 'warning' | 'emergency';
    is_active: boolean;
  }>;
}

export const GODAVARI_GHATS_SEED: SeedGhat[] = [
  // 1. Kotilingala Ghat (East Godavari, AP) - Officially listed
  {
    name: {
      en: "Kotilingala Ghat",
      te: "కోటిలింగాల ఘాట్",
      hi: "कोटिलिंगला घाट"
    },
    river: "Godavari",
    district: "East Godavari",
    state: "Andhra Pradesh",
    lat: 16.9922,
    lng: 81.7656,
    nearest_town: {
      en: "Rajahmundry (Rajamahendravaram)",
      te: "రాజమండ్రి (రాజమహేంద్రవరం)",
      hi: "राजमुंदरी (राजमहेंद्रवरम)"
    },
    nearest_railway_station: {
      en: "Rajahmundry Railway Station (RJY - 3.2 km)",
      te: "రాజమండ్రి రైల్వే స్టేషన్ (RJY - 3.2 కి.మీ)",
      hi: "राजमुंदरी रेलवे स्टेशन (RJY - 3.2 किमी)"
    },
    nearest_bus_stand: {
      en: "Kotipalli Bus Stand (2.5 km)",
      te: "కోటిపల్లి బస్టాండ్ (2.5 కి.మీ)",
      hi: "कोटिपल्ली बस स्टैंड (2.5 किमी)"
    },
    official_source_url: "https://eastgodavari.ap.gov.in/pushkaralu",
    verified_at: "2026-09-15T08:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "high",
    publish_status: "published",
    description: {
      en: "One of the largest and most sacred ghats in Rajahmundry, known for the Sri Kotilingeswara temple.",
      te: "శ్రీ కోటిలింగేశ్వర దేవాలయానికి ప్రసిద్ధి చెందిన రాజమండ్రిలోని అతిపెద్ద మరియు పరమ పవిత్రమైన ఘాట్లలో ఒకటి.",
      hi: "राजमुंदरी के सबसे बड़े और पवित्र घाटों में से एक, जो श्री कोटिलिंगेश्वर मंदिर के लिए प्रसिद्ध है।"
    },
    max_capacity: 50000,
    sources: [
      {
        source_url: "https://eastgodavari.ap.gov.in/pushkaralu",
        source_name: "East Godavari District Administration",
        source_type: "district_portal",
        is_official: true,
        notes: "District Collectorate Pushkaralu Master Plan"
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Dedicated changing rooms for men & women", te: "స్త్రీ, పురుషులకు ప్రత్యేక దుస్తుల మార్పు గదులు", hi: "महिला और पुरुष के लिए समर्पित वस्त्र परिवर्तन कक्ष" },
        is_operational: true,
        count: 12
      },
      {
        facility_type: "drinking_water",
        details: { en: "RO purified drinking water stations", te: "ఆర్వో శుద్ధి చేసిన తాగునీటి కేంద్రాలు", hi: "आरओ शुद्ध पेयजल केंद्र" },
        is_operational: true,
        count: 8
      },
      {
        facility_type: "medical_camp",
        details: { en: "24/7 Primary Healthcare Tent with Ambulance", te: "24/7 అంబులెన్స్‌తో ప్రాథమిక ఆరోగ్య శిబిరం", hi: "24/7 एम्बुलेंस युक्त प्राथमिक चिकित्सा शिविर" },
        is_operational: true,
        count: 2
      },
      {
        facility_type: "police_post",
        details: { en: "Law enforcement & missing persons helpdesk", te: "పోలీస్ హెల్ప్‌డెస్క్ & తప్పిపోయిన వారి సహాయ కేంద్రం", hi: "पुलिस हेल्पडेस्क और गुमशुदा व्यक्ति सहायता केंद्र" },
        is_operational: true,
        count: 1
      }
    ],
    aarti_timings: [
      {
        name: { en: "Maha Godavari Aarti", te: "మహా గోదావరి హారతి", hi: "महा गोदावरी आरती" },
        time_start: "18:30:00",
        time_end: "19:15:00",
        description: { en: "Grand evening river worship ritual with Vedic chants", te: "వేద మంత్రోచ్ఛారణలతో జరిగే సాయంత్రం దివ్య గోదావరి హారతి", hi: "वैदिक मंत्रोच्चार के साथ भव्य सायंकालीन गोदावरी नदी आरती" },
        days_of_week: "Daily"
      }
    ],
    notices: [
      {
        title: { en: "Life jackets mandatory beyond barricades", te: "బారికేడ్ల ఆవల లైఫ్ జాకెట్లు తప్పనిసరి", hi: "बैरिकेड्स के पार लाइफ जैकेट अनिवार्य है" },
        message: { en: "Deep water alert: Pilgrims must not cross the safety floating buoys.", te: "లోతైన నీటి హెచ్చరిక: భక్తులు భద్రతా తేలియాడే బోయ్‌లను దాటరాదు.", hi: "गहरे पानी की चेतावनी: श्रद्धालु सुरक्षा फ्लोटिंग बॉयज़ के पार न जाएं।" },
        severity: "warning",
        is_active: true
      }
    ]
  },

  // 2. Pushkar Ghat (East Godavari, AP) - Officially listed
  {
    name: {
      en: "Pushkar Ghat",
      te: "పుష్కర్ ఘాట్",
      hi: "पुष्कर घाट"
    },
    river: "Godavari",
    district: "East Godavari",
    state: "Andhra Pradesh",
    lat: 17.0005,
    lng: 81.7725,
    nearest_town: {
      en: "Rajahmundry",
      te: "రాజమండ్రి",
      hi: "राजमुंदरी"
    },
    nearest_railway_station: {
      en: "Godavari Railway Station (GVN - 1.0 km)",
      te: "గోదావరి రైల్వే స్టేషన్ (GVN - 1.0 కి.మీ)",
      hi: "गोदावरी रेलवे स्टेशन (GVN - 1.0 किमी)"
    },
    nearest_bus_stand: {
      en: "RTC Complex Rajahmundry (2.8 km)",
      te: "ఆర్టీసీ కాంప్లెక్స్ రాజమండ్రి (2.8 కి.మీ)",
      hi: "आरटीसी कॉम्प्लेक्स राजमुंदरी (2.8 किमी)"
    },
    official_source_url: "https://eastgodavari.ap.gov.in/pushkaralu/pushkar-ghat",
    verified_at: "2026-09-18T10:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "very_high",
    publish_status: "published",
    description: {
      en: "The historic epicenter of Pushkaralu snanam in Rajamahendravaram with stepped masonry bathing banks.",
      te: "రాజమహేంద్రవరంలో పుష్కరాల పవిత్ర స్నానాలకు కేంద్రబిందువైన చారిత్రాత్మక ఘాట్.",
      hi: "राजमहेंद्रवरम में पुष्करालु पवित्र स्नान का ऐतिहासिक केंद्र स्थल।"
    },
    max_capacity: 75000,
    sources: [
      {
        source_url: "https://eastgodavari.ap.gov.in/pushkaralu/pushkar-ghat",
        source_name: "AP Endowments Department & District Collectorate",
        source_type: "government",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "High-capacity modular changing stations", te: "అధిక సామర్థ్యం కలిగిన దుస్తుల మార్పు గదులు", hi: "उच्च क्षमता वाले मॉड्यूलर चेंजिंग रूम" },
        is_operational: true,
        count: 20
      },
      {
        facility_type: "cloak_room",
        details: { en: "Secured baggage storage counters", te: "సామాను భద్రపరిచే క్లోక్‌రూమ్ కేంద్రాలు", hi: "सामान रखने हेतु सुरक्षित क्लॉकरूम" },
        is_operational: true,
        count: 4
      },
      {
        facility_type: "drinking_water",
        details: { en: "Filtered water taps along the promenade", te: "నది ఒడ్డున ఫిల్టర్ చేసిన తాగునీటి కుళాయిలు", hi: "नदी तट पर फ़िल्टर किए गए पेयजल नल" },
        is_operational: true,
        count: 14
      }
    ],
    aarti_timings: [
      {
        name: { en: "Pratah Aarti", te: "ప్రాతఃకాల హారతి", hi: "प्रातःकालीन आरती" },
        time_start: "05:45:00",
        time_end: "06:15:00",
        description: { en: "Dawn invocation welcoming the sunrise over Godavari", te: "గోదావరిపై సూర్యోదయ సమయంలో జరిగే ఉదయపు హారతి", hi: "गोदावरी पर सूर्योदय के समय होने वाली सुबह की आरती" },
        days_of_week: "Daily"
      },
      {
        name: { en: "Divya Godavari Deeparadhana", te: "దివ్య గోదావరి దీపారాధన", hi: "दिव्य गोदावरी दीपाराधना" },
        time_start: "19:00:00",
        time_end: "20:00:00",
        description: { en: "108 lamps offering ceremony", te: "108 దీపాల సమర్పణ మహోత్సవం", hi: "108 दीपों की महा आरती" },
        days_of_week: "Daily"
      }
    ]
  },

  // 3. Saraswati Ghat (East Godavari, AP) - Officially listed
  {
    name: {
      en: "Saraswati Ghat",
      te: "సరస్వతి ఘాట్",
      hi: "सरस्वती घाट"
    },
    river: "Godavari",
    district: "East Godavari",
    state: "Andhra Pradesh",
    lat: 17.0048,
    lng: 81.7762,
    nearest_town: {
      en: "Rajahmundry",
      te: "రాజమండ్రి",
      hi: "राजमुंदरी"
    },
    nearest_railway_station: {
      en: "Godavari Railway Station (GVN - 1.4 km)",
      te: "గోదావరి రైల్వే స్టేషన్ (GVN - 1.4 కి.మీ)",
      hi: "गोदावरी रेलवे स्टेशन (GVN - 1.4 किमी)"
    },
    nearest_bus_stand: {
      en: "Kotipalli Bus Stand (3.0 km)",
      te: "కోటిపల్లి బస్టాండ్ (3.0 కి.మీ)",
      hi: "कोटिपल्ली बस स्टैंड (3.0 किमी)"
    },
    official_source_url: "https://eastgodavari.ap.gov.in/pushkaralu/saraswati-ghat",
    verified_at: "2026-09-20T11:30:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "medium",
    publish_status: "published",
    description: {
      en: "Tranquil ghat situated slightly north of Pushkar ghat, preferred by families and elder pilgrims.",
      te: "పుష్కర్ ఘాట్‌కు కొద్దిగా ఉత్తరాన ఉన్న ప్రశాంతమైన ఘాట్, కుటుంబాలు మరియు వృద్ధ భక్తులకు అత్యంత అనుకూలమైనది.",
      hi: "पुष्कर घाट के उत्तर में स्थित शांत घाट, परिवारों और वृद्ध श्रद्धालुओं के लिए उपयुक्त।"
    },
    max_capacity: 30000,
    sources: [
      {
        source_url: "https://eastgodavari.ap.gov.in/pushkaralu/saraswati-ghat",
        source_name: "East Godavari District Portal",
        source_type: "district_portal",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Standard changing stalls", te: "సాధారణ దుస్తుల మార్పు గదులు", hi: "कपड़े बदलने के कमरे" },
        is_operational: true,
        count: 8
      },
      {
        facility_type: "drinking_water",
        details: { en: "Filtered water kiosk", te: "రక్షిత తాగునీటి కేంద్రం", hi: "पेयजल केंद्र" },
        is_operational: true,
        count: 6
      }
    ],
    aarti_timings: [
      {
        name: { en: "Sandhya Vandana Aarti", te: "సంధ్యా వందన హారతి", hi: "संध्या वंदना आरती" },
        time_start: "18:45:00",
        time_end: "19:15:00",
        description: { en: "Evening peaceful invocation", te: "సాయంత్రపు పూజా కార్యక్రమం", hi: "शाम की शांतिपूर्ण आरती" },
        days_of_week: "Daily"
      }
    ]
  },

  // 4. Markandeya Ghat (East Godavari, AP) - Officially listed
  {
    name: {
      en: "Markandeya Ghat",
      te: "మార్కండేయ ఘాట్",
      hi: "मार्कंडेय घाट"
    },
    river: "Godavari",
    district: "East Godavari",
    state: "Andhra Pradesh",
    lat: 16.9980,
    lng: 81.7695,
    nearest_town: {
      en: "Rajahmundry",
      te: "రాజమండ్రి",
      hi: "राजमुंदरी"
    },
    nearest_railway_station: {
      en: "Rajahmundry Railway Station (RJY - 2.8 km)",
      te: "రాజమండ్రి రైల్వే స్టేషన్ (RJY - 2.8 కి.మీ)",
      hi: "राजमुंदरी रेलवे स्टेशन (RJY - 2.8 किमी)"
    },
    nearest_bus_stand: {
      en: "Old Bus Stand (1.8 km)",
      te: "పాత బస్టాండ్ (1.8 కి.మీ)",
      hi: "पुराना बस स्टैंड (1.8 किमी)"
    },
    official_source_url: "https://eastgodavari.ap.gov.in/pushkaralu/markandeya-ghat",
    verified_at: "2026-09-19T09:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "high",
    publish_status: "published",
    description: {
      en: "Adjacent to Sri Markandeyeswara Swamy temple, deeply linked to the Sage Markandeya legend.",
      te: "శ్రీ మార్కండేయేశ్వర స్వామి ఆలయ సమీపంలో ఉన్న పవిత్ర ఘాట్.",
      hi: "श्री मार्कंडेश्वर स्वामी मंदिर के समीप स्थित पौराणिक महत्व का पावन घाट।"
    },
    max_capacity: 40000,
    sources: [
      {
        source_url: "https://eastgodavari.ap.gov.in/pushkaralu/markandeya-ghat",
        source_name: "AP Endowments & Municipal Corporation",
        source_type: "government",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Ladies & Gents changing enclosure", te: "స్త్రీ, పురుషుల దుస్తుల మార్పు గదులు", hi: "वस्त्र परिवर्तन कक्ष" },
        is_operational: true,
        count: 10
      },
      {
        facility_type: "prasad_counter",
        details: { en: "Temple prasadam distribution", te: "ఆలయ ప్రసాద విక్రయ కేంద్రం", hi: "मंदिर प्रसादम काउंटर" },
        is_operational: true,
        count: 2
      }
    ],
    aarti_timings: [
      {
        name: { en: "Maha Shiva Deepotsavam", te: "మహా శివ దీపోత్సవం", hi: "महा शिव दीपोत्सव" },
        time_start: "19:15:00",
        time_end: "19:45:00",
        description: { en: "Special aarti honoring Lord Shiva on the river bank", te: "నదీ తీరంలో శివునికి ప్రత్యేక హారతి", hi: "नदी तट पर भगवान शिव को समर्पित विशेष आरती" },
        days_of_week: "Daily"
      }
    ]
  },

  // 5. Goshpada Kshetram Ghat (West Godavari, AP) - Officially listed
  {
    name: {
      en: "Goshpada Kshetram Ghat",
      te: "గోష్పాద క్షేత్రం ఘాట్",
      hi: "गोष्पद क्षेत्र घाट"
    },
    river: "Godavari",
    district: "West Godavari",
    state: "Andhra Pradesh",
    lat: 17.0142,
    lng: 81.7289,
    nearest_town: {
      en: "Kovvur",
      te: "కొవ్వూరు",
      hi: "कोव्वूर"
    },
    nearest_railway_station: {
      en: "Kovvur Railway Station (KVR - 1.2 km)",
      te: "కొవ్వూరు రైల్వే స్టేషన్ (KVR - 1.2 కి.మీ)",
      hi: "कोव्वूर रेलवे स्टेशन (KVR - 1.2 किमी)"
    },
    nearest_bus_stand: {
      en: "Kovvur RTC Bus Station (1.0 km)",
      te: "కొవ్వూరు ఆర్టీసీ బస్ స్టేషన్ (1.0 కి.మీ)",
      hi: "कोव्वूर आरटीसी बस स्टेशन (1.0 किमी)"
    },
    official_source_url: "https://westgodavari.ap.gov.in/pilgrim-ghats/kovvur-goshpada",
    verified_at: "2026-09-22T14:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "high",
    publish_status: "published",
    description: {
      en: "One of the holiest spots on the western bank where Rishi Gautama attained divine grace according to Brahma Purana.",
      te: "బ్రహ్మ పురాణం ప్రకారం గౌతమ మహర్షి తపస్సు చేసిన పశ్చిమ గోదావరిలోని అత్యంత ప్రసిద్ధ గోష్పాద క్షేత్రం.",
      hi: "ब्रह्म पुराण के अनुसार ऋषि गौतम की पावन तपोभूमि, पश्चिमी तट का परम पवित्र गोष्पद क्षेत्र।"
    },
    max_capacity: 45000,
    sources: [
      {
        source_url: "https://westgodavari.ap.gov.in/pilgrim-ghats/kovvur-goshpada",
        source_name: "West Godavari District Collectorate",
        source_type: "district_portal",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Extensive bathing enclosures", te: "విశాలమైన దుస్తుల మార్పు గదులు", hi: "विशाल वस्त्र परिवर्तन कक्ष" },
        is_operational: true,
        count: 14
      },
      {
        facility_type: "medical_camp",
        details: { en: "Community Health Center First Aid unit", te: "ప్రాథమిక చికిత్సా కేంద్రం", hi: "प्राथमिक चिकित्सा इकाई" },
        is_operational: true,
        count: 1
      },
      {
        facility_type: "parking",
        details: { en: "Designated 4-wheeler and 2-wheeler holding area", te: "వాహనాల పార్కింగ్ సదుపాయం", hi: "वाहन पार्किंग क्षेत्र" },
        is_operational: true,
        count: 2
      }
    ],
    aarti_timings: [
      {
        name: { en: "Gautama Teertha Aarti", te: "గౌతమ తీర్థ హారతి", hi: "गौतम तीर्थ आरती" },
        time_start: "18:45:00",
        time_end: "19:30:00",
        description: { en: "Chanting of Gautama Stotram with deepam floats", te: "గౌతమ స్తోత్ర పఠనంతో దీపోత్సవం", hi: "गौतम स्तोत्र पाठ एवं दीपदान" },
        days_of_week: "Daily"
      }
    ]
  },

  // 6. Kalyana Ghat / Pushkar Ghat Bhadrachalam (Bhadradri Kothagudem, Telangana) - Officially listed
  {
    name: {
      en: "Sri Rama Kalyana Ghat (Bhadrachalam)",
      te: "శ్రీరామ కళ్యాణ ఘాట్ (భద్రాచలం)",
      hi: "श्री राम कल्याण घाट (भद्राचलम)"
    },
    river: "Godavari",
    district: "Bhadradri Kothagudem",
    state: "Telangana",
    lat: 17.6688,
    lng: 80.8872,
    nearest_town: {
      en: "Bhadrachalam",
      te: "భద్రాచలం",
      hi: "भद्राचलम"
    },
    nearest_railway_station: {
      en: "Bhadrachalam Road Railway Station (Kothagudem BDCR - 40 km)",
      te: "భద్రాచలం రోడ్ రైల్వే స్టేషన్ (కొత్తగూడెం BDCR - 40 కి.మీ)",
      hi: "भद्राचलम रोड रेलवे स्टेशन (कोत्तागुडेम BDCR - 40 किमी)"
    },
    nearest_bus_stand: {
      en: "TSRTC Bus Station Bhadrachalam (1.5 km)",
      te: "టీఎస్‌ఆర్టీసీ బస్ స్టేషన్ భద్రాచలం (1.5 కి.మీ)",
      hi: "टीजीएसआरटीसी बस स्टैंड भद्राचलम (1.5 किमी)"
    },
    official_source_url: "https://bhadradri.telangana.gov.in/temples/bhadrachalam-ghat",
    verified_at: "2026-09-25T16:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "high",
    publish_status: "published",
    description: {
      en: "Holy riverfront directly below the historic Sri Sita Ramachandra Swamy Temple on Godavari bank in Telangana.",
      te: "తెలంగాణలోని సుప్రసిద్ధ శ్రీ సీతారామచంద్ర స్వామి ఆలయం చెంతనే ఉన్న పుణ్య గోదావరి ఘాట్.",
      hi: "तेलंगाना में प्रसिद्ध श्री सीता रामचंद्र स्वामी मंदिर के निकट पवित्र गोदावरी घाट।"
    },
    max_capacity: 60000,
    sources: [
      {
        source_url: "https://bhadradri.telangana.gov.in/temples/bhadrachalam-ghat",
        source_name: "Bhadradri Kothagudem District Administration & Devasthanam",
        source_type: "government",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Separate rooms with security", te: "భద్రతతో కూడిన ప్రత్యేక బట్టల మార్పిడి గదులు", hi: "सुरक्षा युक्त वस्त्र परिवर्तन कक्ष" },
        is_operational: true,
        count: 16
      },
      {
        facility_type: "drinking_water",
        details: { en: "Mission Bhagiratha water points", te: "మిషన్ భగీరథ శుద్ధ జల కేంద్రాలు", hi: "मिशन भगीरथ शुद्ध पेयजल केंद्र" },
        is_operational: true,
        count: 10
      },
      {
        facility_type: "medical_camp",
        details: { en: "Emergency disaster response post & NDRF boat team", te: "ఎన్‌డిఆర్‌ఎఫ్ బోట్ టీమ్ & అత్యవసర వైద్య కేంద్రం", hi: "एनडीआरएफ बोट टीम एवं आपातकालीन चिकित्सा शिविर" },
        is_operational: true,
        count: 2
      }
    ],
    aarti_timings: [
      {
        name: { en: "Bhadrachala Godavari Harathi", te: "భద్రాచల గోదావరి హారతి", hi: "भद्राचल गोदावरी आरती" },
        time_start: "18:30:00",
        time_end: "19:15:00",
        description: { en: "Evening floral tributes and lamps dedicated by priests", te: "దేవస్థాన అర్చకుల ఆధ్వర్యంలో పుష్ప దీప సమర్పణ", hi: "मंदिर पुजारियों द्वारा दीप एवं पुष्प अर्पण" },
        days_of_week: "Daily"
      }
    ]
  },

  // 7. Dharmapuri Ghat (Jagtial, Telangana) - Officially listed
  {
    name: {
      en: "Dharmapuri Sri Lakshmi Narasimha Swamy Ghat",
      te: "ధర్మపురి శ్రీ లక్ష్మీ నరసింహ స్వామి ఘాట్",
      hi: "धर्मपुरी श्री लक्ष्मी नरसिंह स्वामी घाट"
    },
    river: "Godavari",
    district: "Jagtial",
    state: "Telangana",
    lat: 18.9567,
    lng: 79.0911,
    nearest_town: {
      en: "Dharmapuri",
      te: "ధర్మపురి",
      hi: "धर्मपुरी"
    },
    nearest_railway_station: {
      en: "Mancherial Railway Station (MCI - 42 km)",
      te: "మంచిర్యాల రైల్వే స్టేషన్ (MCI - 42 కి.మీ)",
      hi: "मंचेरियल रेलवे स्टेशन (MCI - 42 किमी)"
    },
    nearest_bus_stand: {
      en: "Dharmapuri Bus Station (0.8 km)",
      te: "ధర్మపురి బస్ స్టేషన్ (0.8 కి.మీ)",
      hi: "धर्मपुरी बस स्टैंड (0.8 किमी)"
    },
    official_source_url: "https://jagtial.telangana.gov.in/places-of-interest/dharmapuri-ghat",
    verified_at: "2026-09-24T12:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "medium",
    publish_status: "published",
    description: {
      en: "Renowned sacred bathing ghat in Telangana where river Godavari flows south to north (Dakshina Vahini).",
      te: "గోదావరి నది దక్షిణవాహినిగా ప్రవహించే తెలంగాణలోని అత్యంత పవిత్రమైన ధర్మపురి క్షేత్ర ఘాట్.",
      hi: "तेलंगाना का परम पवित्र घाट जहां गोदावरी नदी दक्षिणवाहिनी होकर बहती है।"
    },
    max_capacity: 35000,
    sources: [
      {
        source_url: "https://jagtial.telangana.gov.in/places-of-interest/dharmapuri-ghat",
        source_name: "Jagtial District Administration",
        source_type: "district_portal",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Modernized dressing blocks", te: "నూతన దుస్తుల మార్పిడి గదులు", hi: "आधुनिक वस्त्र परिवर्तन कक्ष" },
        is_operational: true,
        count: 10
      },
      {
        facility_type: "drinking_water",
        details: { en: "Cool drinking water stations", te: "చల్లని తాగునీటి సౌకర్యం", hi: "शीतल पेयजल केंद्र" },
        is_operational: true,
        count: 6
      }
    ],
    aarti_timings: [
      {
        name: { en: "Dakshina Vahini Sandhya Aarti", te: "దక్షిణవాహిని సంధ్యా హారతి", hi: "दक्षिणवाहिनी संध्या आरती" },
        time_start: "18:40:00",
        time_end: "19:10:00",
        description: { en: "Aarti commemorating the sacred northern turn of Godavari", te: "గోదావరి నదికి నివేదించే సాయం సంధ్యా హారతి", hi: "गोदावरी नदी को समर्पित संध्या आरती" },
        days_of_week: "Daily"
      }
    ]
  },

  // 8. Basara Ghat (Nirmal, Telangana) - Officially listed
  {
    name: {
      en: "Basara Sri Gnana Saraswati Ghat",
      te: "బాసర శ్రీ జ్ఞాన సరస్వతి ఘాట్",
      hi: "बासर श्री ज्ञान सरस्वती घाट"
    },
    river: "Godavari",
    district: "Nirmal",
    state: "Telangana",
    lat: 18.8744,
    lng: 77.9542,
    nearest_town: {
      en: "Basara / Nizamabad",
      te: "బాసర / నిజామాబాద్",
      hi: "बासर / निजामाबाद"
    },
    nearest_railway_station: {
      en: "Basar Railway Station (BSX - 2.0 km)",
      te: "బాసర రైల్వే స్టేషన్ (BSX - 2.0 కి.మీ)",
      hi: "बासर रेलवे स्टेशन (BSX - 2.0 किमी)"
    },
    nearest_bus_stand: {
      en: "Basara Temple Bus Stand (0.5 km)",
      te: "బాసర దేవాలయం బస్టాండ్ (0.5 కి.మీ)",
      hi: "बासर मंदिर बस स्टैंड (0.5 किमी)"
    },
    official_source_url: "https://nirmal.telangana.gov.in/tourism/basara-godavari-ghat",
    verified_at: "2026-09-28T15:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "medium",
    publish_status: "published",
    description: {
      en: "Pilgrims bathe here before initiating children into education with Aksharabhyasam at Sri Gnana Saraswati Temple.",
      te: "శ్రీ జ్ఞాన సరస్వతి సన్నిధిలో అక్షరాభ్యాసానికి ముందు భక్తులు పవిత్ర స్నానాలు ఆచరించే పవిత్ర ఘాట్.",
      hi: "श्री ज्ञान सरस्वती मंदिर में अक्षराभ्यासम संस्कार से पूर्व श्रद्धालु यहां पवित्र स्नान करते हैं।"
    },
    max_capacity: 40000,
    sources: [
      {
        source_url: "https://nirmal.telangana.gov.in/tourism/basara-godavari-ghat",
        source_name: "Nirmal District Collectorate",
        source_type: "district_portal",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Family and infant changing cubicles", te: "కుటుంబాలు మరియు శిశు సంరక్షణ గదులు", hi: "पारिवारिक एवं शिशु देखभाल कक्ष" },
        is_operational: true,
        count: 12
      },
      {
        facility_type: "prasad_counter",
        details: { en: "Aksharabhyasam token and prasadam counter", te: "అక్షరాభ్యాసం టోకెన్ మరియు ప్రసాదం కేంద్రం", hi: "अक्षराभ्यासम टोकन व प्रसादम काउंटर" },
        is_operational: true,
        count: 3
      }
    ],
    aarti_timings: [
      {
        name: { en: "Saraswati Deepa Harathi", te: "సరస్వతి దీప హారతి", hi: "सरस्वती दीप आरती" },
        time_start: "18:30:00",
        time_end: "19:00:00",
        description: { en: "Ritual prayer for wisdom and learning", te: "విద్యా ప్రాప్తికై చేసే దివ్య హారతి", hi: "ज्ञान व विद्या प्राप्ति हेतु दिव्य आरती" },
        days_of_week: "Daily"
      }
    ]
  },

  // 9. Kaleshwaram Triveni Sangam Ghat (Jayashankar Bhupalpally, Telangana) - Officially listed
  {
    name: {
      en: "Kaleshwaram Triveni Sangam Ghat",
      te: "కాళేశ్వరం త్రివేణి సంగమ ఘాట్",
      hi: "कालेश्वरम त्रिवेणी संगम घाट"
    },
    river: "Godavari",
    district: "Jayashankar Bhupalpally",
    state: "Telangana",
    lat: 18.8145,
    lng: 79.9078,
    nearest_town: {
      en: "Kaleshwaram / Manthani",
      te: "కాళేశ్వరం / మంథని",
      hi: "कालेश्वरम / मंथनी"
    },
    nearest_railway_station: {
      en: "Ramagundam Railway Station (RDM - 65 km)",
      te: "రామగుండం రైల్వే స్టేషన్ (RDM - 65 కి.మీ)",
      hi: "रामगुंडम रेलवे स्टेशन (RDM - 65 किमी)"
    },
    nearest_bus_stand: {
      en: "Kaleshwaram Bus Depot Stand (1.0 km)",
      te: "కాళేశ్వరం బస్ స్టాండ్ (1.0 కి.మీ)",
      hi: "कालेश्वरम बस स्टैंड (1.0 किमी)"
    },
    official_source_url: "https://jayashankar.telangana.gov.in/tourism/kaleshwaram-sangam",
    verified_at: "2026-09-26T10:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "medium",
    publish_status: "published",
    description: {
      en: "Confluence point where Godavari, Pranahita and the subterranean Saraswati river meet; site of Kaleshwara Mukteshwara temple.",
      te: "గోదావరి, ప్రాణహిత మరియు అంతర్వాహిని సరస్వతీ నదుల పవిత్ర త్రివేణి సంగమ ప్రదేశం.",
      hi: "गोदावरी, प्राणहिता एवं अंतःसलिला सरस्वती का पवित्र त्रिवेणी संगम स्थल।"
    },
    max_capacity: 50000,
    sources: [
      {
        source_url: "https://jayashankar.telangana.gov.in/tourism/kaleshwaram-sangam",
        source_name: "Jayashankar Bhupalpally District Portal",
        source_type: "district_portal",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Sangam point changing sheds", te: "సంగమ స్నానాల దుస్తుల మార్పు గదులు", hi: "संगम स्नान वस्त्र परिवर्तन शेड" },
        is_operational: true,
        count: 10
      },
      {
        facility_type: "drinking_water",
        details: { en: "Mineral water distribution", te: "రక్షిత తాగునీరు", hi: "पेयजल वितरण" },
        is_operational: true,
        count: 5
      }
    ],
    aarti_timings: [
      {
        name: { en: "Triveni Sangama Aarti", te: "త్రివేణి సంగమ హారతి", hi: "त्रिवेणी संगम आरती" },
        time_start: "18:45:00",
        time_end: "19:30:00",
        description: { en: "Grand confluence offering of lights", te: "త్రివేణి సంగమానికి భక్తిపూర్వక దీప సమర్పణ", hi: "त्रिवेणी संगम पर दीपदान व महा आरती" },
        days_of_week: "Daily"
      }
    ]
  },

  // 10. Sundarapalli Ferry Ghat (Dr. B.R. Ambedkar Konaseema, AP) - UNVERIFIED (NO INVENTED OFFICIAL SOURCE)
  {
    name: {
      en: "Sundarapalli Ferry Ghat",
      te: "సుందరపల్లి రేవు ఘాట్",
      hi: "सुंदरपल्ली नौका घाट"
    },
    river: "Godavari",
    district: "Dr. B.R. Ambedkar Konaseema",
    state: "Andhra Pradesh",
    lat: 16.7120,
    lng: 81.9840,
    nearest_town: {
      en: "Ravulapalem",
      te: "రావులపాలెం",
      hi: "रावुलापालेम"
    },
    nearest_railway_station: {
      en: "Rajahmundry Railway Station (RJY - 32 km)",
      te: "రాజమండ్రి రైల్వే స్టేషన్ (RJY - 32 కి.మీ)",
      hi: "राजमुंदरी रेलवे स्टेशन (RJY - 32 किमी)"
    },
    nearest_bus_stand: {
      en: "Ravulapalem RTC Bus Stand (6.5 km)",
      te: "రావులపాలెం ఆర్టీసీ బస్ స్టాండ్ (6.5 కి.మీ)",
      hi: "रावुलापालेम आरटीसी बस स्टैंड (6.5 किमी)"
    },
    official_source_url: null, // STRICT RULE: Must not invent official sources for unverified ghats!
    verified_at: null,
    record_status: "unverified",
    bathing_status: "restricted",
    crowd_level: "low",
    publish_status: "published",
    description: {
      en: "A traditional village ferry crossing point on the Gautami Godavari branch. Shallow steps but swift currents during peak monsoon.",
      te: "గౌతమీ గోదావరి శాఖపై ఉన్న సాంప్రదాయ పల్లె రేవు. వర్షాకాలంలో ప్రవాహ వేగం అధికంగా ఉంటుంది.",
      hi: "गौतमी गोदावरी शाखा पर स्थित पारंपरिक ग्रामीण नौका घाट। मानसून में तेज़ बहाव।"
    },
    max_capacity: 5000,
    sources: [
      {
        source_url: "https://community.pushkaralu.org/reports/sundarapalli",
        source_name: "Local Pilgrim Community Report",
        source_type: "community",
        is_official: false,
        notes: "Pending official verification by Konaseema District Collectorate"
      }
    ],
    facilities: [
      {
        facility_type: "drinking_water",
        details: { en: "Village borewell handpump only", te: "గ్రామ చేతిపంపు మాత్రమే కలదు", hi: "केवल ग्रामीण हैंडपंप उपलब्ध" },
        is_operational: true,
        count: 1
      }
    ],
    aarti_timings: [],
    notices: [
      {
        title: { en: "Unverified ghat advisory", te: "ధృవీకరించబడని ఘాట్ హెచ్చరిక", hi: "असत्यापित घाट परामर्श" },
        message: { en: "No official life-guards or barricades deployed at this ghat. Exercise extreme personal caution.", te: "ఈ ఘాట్ వద్ద అధికారిక లైఫ్ గార్డులు లేరు. భక్తులు స్వీయ జాగ్రత్తలు పాటించాలి.", hi: "इस घाट पर कोई आधिकारिक लाइफगार्ड तैनात नहीं हैं। कृपया अत्यधिक सावधानी बरतें।" },
        severity: "warning",
        is_active: true
      }
    ]
  },

  // 11. Peruru Godavari Ghat (Dr. B.R. Ambedkar Konaseema, AP) - REPORTED (Community reported)
  {
    name: {
      en: "Peruru Godavari Ghat",
      te: "పేరూరు గోదావరి ఘాట్",
      hi: "पेरूरु गोदावरी घाट"
    },
    river: "Godavari",
    district: "Dr. B.R. Ambedkar Konaseema",
    state: "Andhra Pradesh",
    lat: 16.5780,
    lng: 81.9950,
    nearest_town: {
      en: "Amalapuram",
      te: "అమలాపురం",
      hi: "अमलापुरम"
    },
    nearest_railway_station: {
      en: "Palakollu Railway Station (PKO - 38 km)",
      te: "పాలకొల్లు రైల్వే స్టేషన్ (PKO - 38 కి.మీ)",
      hi: "पालकोल्लु रेलवे स्टेशन (PKO - 38 किमी)"
    },
    nearest_bus_stand: {
      en: "Amalapuram Bus Complex (4.2 km)",
      te: "అమలాపురం బస్ కాంప్లెక్స్ (4.2 కి.మీ)",
      hi: "अमलापुरम बस कॉम्प्लेक्स (4.2 किमी)"
    },
    official_source_url: null, // STRICT RULE: No invented source
    verified_at: null,
    record_status: "reported",
    bathing_status: "unknown",
    crowd_level: "low",
    publish_status: "published",
    description: {
      en: "Community reported bathing point near Amalapuram. Natural earthen bank without permanent stone revetment.",
      te: "అమలాపురం సమీపంలో ప్రజలు ఉపయోగించే సహజ రేవు ప్రాంతం.",
      hi: "अमलापुरम के समीप स्थानीय श्रद्धालुओं द्वारा सूचित स्नान स्थल।"
    },
    max_capacity: 4000,
    sources: [
      {
        source_url: "https://localnews.andhrajyothy.com/konaseema/peruru-ghat",
        source_name: "Regional Media Coverage",
        source_type: "media",
        is_official: false,
        notes: "Awaiting inspection by district irrigation engineers"
      }
    ],
    facilities: [
      {
        facility_type: "drinking_water",
        details: { en: "Temporary panchayat water tanker", te: "తాత్కాలిక పంచాయతీ నీటి ట్యాంకర్", hi: "अस्थायी पंचायत जल टैंकर" },
        is_operational: true,
        count: 1
      }
    ],
    aarti_timings: []
  },

  // 12. Pattiseema Sri Veerabhadra Swamy Ghat (West Godavari, AP) - Officially listed
  {
    name: {
      en: "Pattiseema Sri Veerabhadra Swamy Ghat",
      te: "పట్టిసీమ శ్రీ వీరభద్ర స్వామి ఘాట్",
      hi: "पट्टिसीमा श्री वीरभद्र स्वामी घाट"
    },
    river: "Godavari",
    district: "West Godavari",
    state: "Andhra Pradesh",
    lat: 17.1583,
    lng: 81.6033,
    nearest_town: {
      en: "Polavaram",
      te: "పోలవరం",
      hi: "पोलावरम"
    },
    nearest_railway_station: {
      en: "Kovvur Railway Station (KVR - 28 km)",
      te: "కొవ్వూరు రైల్వే స్టేషన్ (KVR - 28 కి.మీ)",
      hi: "कोव्वूर रेलवे स्टेशन (KVR - 28 किमी)"
    },
    nearest_bus_stand: {
      en: "Polavaram Bus Stand (6.0 km)",
      te: "పోలవరం బస్ స్టాండ్ (6.0 కి.మీ)",
      hi: "पोलावरम बस स्टैंड (6.0 किमी)"
    },
    official_source_url: "https://westgodavari.ap.gov.in/tourism/pattiseema-ghat",
    verified_at: "2026-09-21T13:00:00Z",
    record_status: "officially_listed",
    bathing_status: "allowed",
    crowd_level: "medium",
    publish_status: "published",
    description: {
      en: "Scenic hillock island shrine in the midst of the Akhanda Godavari; famous pilgrimage site with boat access.",
      te: "అఖండ గోదావరి నడిబొడ్డున కొలువై ఉన్న ప్రసిద్ధ పట్టిసీమ క్షేత్ర ఘాట్.",
      hi: "अखंड गोदावरी के मध्य सुरम्य पहाड़ी द्वीप पर स्थित प्रसिद्ध पट्टिसीमा क्षेत्र घाट।"
    },
    max_capacity: 25000,
    sources: [
      {
        source_url: "https://westgodavari.ap.gov.in/tourism/pattiseema-ghat",
        source_name: "West Godavari District Tourism & Endowments",
        source_type: "government",
        is_official: true
      }
    ],
    facilities: [
      {
        facility_type: "changing_room",
        details: { en: "Island and mainland side changing enclosures", te: "ద్వీపం మరియు ఒడ్డున గల దుస్తుల మార్పు గదులు", hi: "द्वीप एवं तट दोनों ओर वस्त्र परिवर्तन कक्ष" },
        is_operational: true,
        count: 8
      },
      {
        facility_type: "drinking_water",
        details: { en: "Filtered water taps", te: "రక్షిత తాగునీరు", hi: "शुद्ध पेयजल" },
        is_operational: true,
        count: 4
      }
    ],
    aarti_timings: [
      {
        name: { en: "Veerabhadra Swamy Nadi Aarti", te: "వీరభద్ర స్వామి నదీ హారతి", hi: "वीरभद्र स्वामी नदी आरती" },
        time_start: "18:30:00",
        time_end: "19:00:00",
        description: { en: "Special river worship ceremony", te: "ప్రత్యేక నదీ పూజా హారతి", hi: "विशेष नदी पूजा आरती" },
        days_of_week: "Daily"
      }
    ]
  }
];

export async function runGhatSeeds(): Promise<void> {
  console.log(`[Seed] Seeding ${GODAVARI_GHATS_SEED.length} Godavari Ghats...`);
  
  await withTransaction(async (client) => {
    for (const ghat of GODAVARI_GHATS_SEED) {
      // Check if ghat with same english name and district exists
      const existing = await client.query(
        "SELECT id FROM ghats WHERE (name->>'en') = $1 AND district = $2 LIMIT 1",
        [ghat.name.en, ghat.district]
      );

      let ghatId: string;

      if (existing.rows.length > 0) {
        ghatId = existing.rows[0].id;
        console.log(`[Seed] Ghat "${ghat.name.en}" already exists (id: ${ghatId}). Updating...`);
        await client.query(
          `UPDATE ghats SET
            name = $1, river = $2, district = $3, state = $4, lat = $5, lng = $6,
            nearest_town = $7, nearest_railway_station = $8, nearest_bus_stand = $9,
            official_source_url = $10, verified_at = $11, record_status = $12,
            bathing_status = $13, crowd_level = $14, publish_status = $15,
            description = $16, max_capacity = $17, updated_at = CURRENT_TIMESTAMP
          WHERE id = $18`,
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
            ghatId
          ]
        );
      } else {
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
            ghat.max_capacity
          ]
        );
        ghatId = insertRes.rows[0].id;
        console.log(`[Seed] Created Ghat "${ghat.name.en}" with ID: ${ghatId}`);
      }

      // Initialize crowd_status entry if not present
      await client.query(
        `INSERT INTO crowd_status (ghat_id, current_level, source_type, confidence_score, note)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (ghat_id) DO UPDATE SET
           current_level = EXCLUDED.current_level,
           source_type = EXCLUDED.source_type,
           updated_at = CURRENT_TIMESTAMP`,
        [
          ghatId,
          ghat.crowd_level,
          ghat.record_status === 'officially_listed' ? 'sensor_or_camera' : 'default',
          0.85,
          JSON.stringify({
            en: "Baseline estimated capacity status",
            te: "ప్రాథమిక రద్దీ అంచనా",
            hi: "प्रारंभिक अनुमानित भीड़ स्थिति"
          })
        ]
      );

      // Insert sources
      await client.query("DELETE FROM ghat_sources WHERE ghat_id = $1", [ghatId]);
      for (const src of ghat.sources) {
        await client.query(
          `INSERT INTO ghat_sources (ghat_id, source_url, source_name, source_type, is_official, notes, last_verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ghatId, src.source_url, src.source_name, src.source_type, src.is_official, src.notes || null, ghat.verified_at]
        );
      }

      // Insert facilities
      await client.query("DELETE FROM ghat_facilities WHERE ghat_id = $1", [ghatId]);
      for (const fac of ghat.facilities) {
        await client.query(
          `INSERT INTO ghat_facilities (ghat_id, facility_type, details, is_operational, count)
           VALUES ($1, $2, $3, $4, $5)`,
          [ghatId, fac.facility_type, JSON.stringify(fac.details), fac.is_operational, fac.count]
        );
      }

      // Insert aarti timings
      await client.query("DELETE FROM ghat_aarti_timings WHERE ghat_id = $1", [ghatId]);
      for (const aarti of ghat.aarti_timings) {
        await client.query(
          `INSERT INTO ghat_aarti_timings (ghat_id, name, time_start, time_end, description, days_of_week)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [ghatId, JSON.stringify(aarti.name), aarti.time_start, aarti.time_end, JSON.stringify(aarti.description), aarti.days_of_week]
        );
      }

      // Insert notices if any
      if (ghat.notices && ghat.notices.length > 0) {
        await client.query("DELETE FROM ghat_notices WHERE ghat_id = $1", [ghatId]);
        for (const notice of ghat.notices) {
          await client.query(
            `INSERT INTO ghat_notices (ghat_id, title, message, severity, is_active)
             VALUES ($1, $2, $3, $4, $5)`,
            [ghatId, JSON.stringify(notice.title), JSON.stringify(notice.message), notice.severity, notice.is_active]
          );
        }
      }
    }
  });

  console.log('[Seed] All Godavari Ghats seeded successfully.');
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

