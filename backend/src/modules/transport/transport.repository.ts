import { query } from '../../db/index.js';
import {
  TransportHub,
  BusRoute,
  BusSpecialService,
  RailStation,
  ShuttleRoute,
  ShuttleStop,
  ExternalLink,
} from '../../types/transport.js';

// Default curated seeds for in-memory resilience when DB is offline
const INITIAL_HUBS: TransportHub[] = [
  {
    id: 'hub-rjy-cbs-01',
    name: {
      en: 'Rajahmundry Central Bus Station (APSRTC Complex)',
      te: 'రాజమండ్రి సెంట్రల్ బస్ స్టేషన్ (ఆర్టీసీ కాంప్లెక్స్)',
      hi: 'राजमंड्री सेंट्रल बस स्टेशन (एपीएसआरटीसी कॉम्प्लेक्स)',
    },
    description: {
      en: 'Main bus terminal connecting all districts and states with 24x7 Pushkaralu helpdesk',
      te: 'అన్ని జిల్లాలకు మరియు రాష్ట్రాలకు కలుపుతూ 24x7 పుష్కరాల హెల్ప్‌డెస్క్‌తో ప్రధాన బస్ టెర్మినల్',
      hi: 'सभी जिलों और राज्यों को जोड़ने वाला मुख्य बस टर्मिनल, 24x7 पुष्करालु हेल्पडेस्क के साथ',
    },
    hub_type: 'bus_stand',
    operator: 'APSRTC',
    code: 'RJY-CBS',
    address: {
      en: 'Morampudi Road, Rajahmundry, East Godavari, AP',
      te: 'మొరంపూడి రోడ్, రాజమండ్రి, తూర్పు గోదావరి',
      hi: 'मोरमपुडी रोड, राजमंड्री, पूर्वी गोदावरी',
    },
    phone: '+91 883 2462002',
    lat: 17.0095,
    lng: 81.7892,
    operating_hours: { open: '00:00', close: '23:59', is_24h: true },
    is_hidden: false,
    is_active: true,
    source_url: 'https://www.apsrtc.ap.gov.in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'hub-kvr-bs-02',
    name: {
      en: 'Kovvur Bus Station',
      te: 'కొవ్వూరు బస్ స్టేషన్',
      hi: 'कोव्वूर बस स्टेशन',
    },
    description: {
      en: 'Gateway terminal for Goshpada Kshetram and West Godavari ghats',
      te: 'గోష్పాద క్షేత్రం మరియు పశ్చిమ గోదావరి ఘాట్లకు ప్రధాన బస్ స్టేషన్',
      hi: 'गोष्पद क्षेत्रम और पश्चिम गोदावरी घाटों के लिए मुख्य बस स्टेशन',
    },
    hub_type: 'bus_stand',
    operator: 'APSRTC',
    code: 'KVR-BS',
    address: {
      en: 'Main Road, Kovvur, West Godavari, AP',
      te: 'మెయిన్ రోడ్, కొవ్వూరు, పశ్చిమ గోదావరి',
      hi: 'मेन रोड, कोव्वूर, पश्चिम गोदावरी',
    },
    phone: '+91 8813 231222',
    lat: 17.0112,
    lng: 81.7345,
    operating_hours: { open: '04:00', close: '23:30' },
    is_hidden: false,
    is_active: true,
    source_url: 'https://www.apsrtc.ap.gov.in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'hub-rjy-rly-03',
    name: {
      en: 'Rajahmundry Main Railway Station (RJY)',
      te: 'రాజమండ్రి మెయిన్ రైల్వే స్టేషన్ (RJY)',
      hi: 'राजमंड्री मुख्य रेलवे स्टेशन (RJY)',
    },
    description: {
      en: 'A1-Category Junction with 5 platforms, medical camps, and pilgrim shelter zones',
      te: '5 ప్లాట్‌ఫారమ్‌లు, వైద్య శిబిరాలు మరియు యాత్రికుల విశ్రాంతి గదులతో A1-కేటగిరీ జంక్షన్',
      hi: '5 प्लेटफार्मों, चिकित्सा शिविरों और तीर्थयात्री विश्राम क्षेत्रों के साथ A1-श्रेणी जंक्शन',
    },
    hub_type: 'railway_station',
    operator: 'Indian Railways (SCR)',
    code: 'RJY',
    address: {
      en: 'Railway Station Road, Rajahmundry, AP - 533101',
      te: 'రైల్వే స్టేషన్ రోడ్, రాజమండ్రి',
      hi: 'रेलवे स्टेशन रोड, राजमंड्री',
    },
    phone: '139',
    lat: 16.9934,
    lng: 81.7821,
    operating_hours: { open: '00:00', close: '23:59', is_24h: true },
    is_hidden: false,
    is_active: true,
    source_url: 'https://enquiry.indianrail.gov.in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'hub-gvn-rly-04',
    name: {
      en: 'Godavari Railway Station (GVN)',
      te: 'గోదావరి రైల్వే స్టేషన్ (GVN)',
      hi: 'गोदावरी रेलवे स्टेशन (GVN)',
    },
    description: {
      en: 'Closest railway halt right adjacent to Kotilingala & Pushkar Ghats (walking distance)',
      te: 'కోటిలింగాల మరియు పుష్కర్ ఘాట్లకు అత్యంత సమీపంలో ఉన్న రైల్వే స్టేషన్ (నడక దూరం)',
      hi: 'कोटिशिंगला और पुष्कर घाटों के ठीक बगल में स्थित रेलवे हॉल्ट (पैदल दूरी)',
    },
    hub_type: 'railway_station',
    operator: 'Indian Railways (SCR)',
    code: 'GVN',
    address: {
      en: 'Ghat Road, Rajahmundry, AP - 533101',
      te: 'ఘాట్ రోడ్, రాజమండ్రి',
      hi: 'घाट रोड, राजमंड्री',
    },
    phone: '139',
    lat: 17.0022,
    lng: 81.7745,
    operating_hours: { open: '00:00', close: '23:59', is_24h: true },
    is_hidden: false,
    is_active: true,
    source_url: 'https://enquiry.indianrail.gov.in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_RAIL_STATIONS: RailStation[] = [
  {
    id: 'rail-rjy-01',
    hub_id: 'hub-rjy-rly-03',
    station_code: 'RJY',
    station_name: {
      en: 'Rajahmundry Railway Station',
      te: 'రాజమండ్రి రైల్వే స్టేషన్',
      hi: 'राजमंड्री रेलवे स्टेशन',
    },
    division: 'Vijayawada (BZA)',
    zone: 'SCR',
    total_platforms: 5,
    has_pushkaralu_special_trains: true,
    helpdesk_phone: '+91 883 2463131',
    official_enquiry_url: 'https://enquiry.indianrail.gov.in',
    lat: 16.9934,
    lng: 81.7821,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rail-gvn-02',
    hub_id: 'hub-gvn-rly-04',
    station_code: 'GVN',
    station_name: {
      en: 'Godavari Railway Halt',
      te: 'గోదావరి రైల్వే హాల్ట్',
      hi: 'गोदावरी रेलवे हॉल्ट',
    },
    division: 'Vijayawada (BZA)',
    zone: 'SCR',
    total_platforms: 2,
    has_pushkaralu_special_trains: true,
    helpdesk_phone: '139',
    official_enquiry_url: 'https://enquiry.indianrail.gov.in',
    lat: 17.0022,
    lng: 81.7745,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rail-kvr-03',
    hub_id: null,
    station_code: 'KVR',
    station_name: {
      en: 'Kovvur Railway Station',
      te: 'కొవ్వూరు రైల్వే స్టేషన్',
      hi: 'कोव्वूर रेलवे स्टेशन',
    },
    division: 'Vijayawada (BZA)',
    zone: 'SCR',
    total_platforms: 3,
    has_pushkaralu_special_trains: true,
    helpdesk_phone: '+91 8813 231456',
    official_enquiry_url: 'https://enquiry.indianrail.gov.in',
    lat: 17.0068,
    lng: 81.7388,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rail-bdcr-04',
    hub_id: null,
    station_code: 'BDCR',
    station_name: {
      en: 'Bhadrachalam Road (Kothagudem)',
      te: 'భద్రాచలం రోడ్ (కొత్తగూడెం)',
      hi: 'भद्राचलम रोड (कोत्तागुडेम)',
    },
    division: 'Secunderabad (SC)',
    zone: 'SCR',
    total_platforms: 3,
    has_pushkaralu_special_trains: true,
    helpdesk_phone: '+91 8744 242233',
    official_enquiry_url: 'https://enquiry.indianrail.gov.in',
    lat: 17.5482,
    lng: 80.6212,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_BUS_ROUTES: BusRoute[] = [
  {
    id: 'route-rjy-101',
    route_number: 'Route 101',
    operator: 'APSRTC',
    origin: {
      en: 'Rajahmundry Central Bus Station',
      te: 'రాజమండ్రి సెంట్రల్ బస్ స్టేషన్',
      hi: 'राजमंड्री सेंट्रल बस स्टेशन',
    },
    destination: {
      en: 'Pushkar Ghat / Godavari Bund',
      te: 'పుష్కర్ ఘాట్ / గోదావరి గట్టు',
      hi: 'पुष्कर घाट / गोदावरी तट',
    },
    origin_hub_id: 'hub-rjy-cbs-01',
    via_stops: ['Morampudi Junction', 'Syndicate Bank Colony', 'Kotilingala Circle'],
    first_bus_time: '04:00',
    last_bus_time: '23:45',
    frequency_minutes: 10,
    fare_range: { min: 15, max: 25, currency: 'INR' },
    bus_type: 'ordinary',
    connected_ghat_ids: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'route-kvr-201',
    route_number: 'Route 201',
    operator: 'APSRTC',
    origin: {
      en: 'Kovvur Bus Stand',
      te: 'కొవ్వూరు బస్ స్టాండ్',
      hi: 'कोव्वूर बस स्टैंड',
    },
    destination: {
      en: 'Goshpada Kshetram Ghat',
      te: 'గోష్పాద క్షేత్రం ఘాట్',
      hi: 'गोष्पद क्षेत्रम घाट',
    },
    origin_hub_id: 'hub-kvr-bs-02',
    via_stops: ['RDO Office', 'Kovvur Toll Plaza', 'Goshpada Bund'],
    first_bus_time: '04:30',
    last_bus_time: '23:30',
    frequency_minutes: 12,
    fare_range: { min: 10, max: 20, currency: 'INR' },
    bus_type: 'ordinary',
    connected_ghat_ids: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'route-special-301',
    route_number: 'Special 301',
    operator: 'SPECIAL_RTC',
    origin: {
      en: 'Lalacheruvu Outer Satellite Parking',
      te: 'లాలచెరువు ఔటర్ శాటిలైట్ పార్కింగ్',
      hi: 'लालचेरुवु आउटर सैटेलाइट पार्किंग',
    },
    destination: {
      en: 'Kotilingala Ghat Terminal',
      te: 'కోటిలింగాల ఘాట్ టెర్మినల్',
      hi: 'कोटिशिंगला घाट टर्मिनल',
    },
    origin_hub_id: 'hub-rjy-cbs-01',
    via_stops: ['Morampudi Flyover', 'Danavaipeta', 'Kotilingala'],
    first_bus_time: '03:30',
    last_bus_time: '23:59',
    frequency_minutes: 8,
    fare_range: { min: 10, max: 15, currency: 'INR' },
    bus_type: 'electric',
    connected_ghat_ids: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_SPECIAL_SERVICES: BusSpecialService[] = [
  {
    id: 'spl-hyd-rjy-01',
    service_code: 'PUSH-SPL-HYD-01',
    service_title: {
      en: 'APSRTC Pushkaralu Special Super Luxury: Hyderabad to Rajahmundry',
      te: 'ఆర్టీసీ పుష్కరాల ప్రత్యేక సూపర్ లగ్జరీ: హైదరాబాద్ నుండి రాజమండ్రి',
      hi: 'एपीएसआरटीसी पुष्करालु स्पेशल सुपर लग्जरी: हैदराबाद से राजमंड्री',
    },
    operator: 'APSRTC',
    origin_city: {
      en: 'Hyderabad (MGBS & Jubilee Bus Station)',
      te: 'హైదరాబాద్ (ఎం.జి.బి.ఎస్ & జే.బి.ఎస్)',
      hi: 'हैदराबाद (एमजीबीएस और जेबीएस)',
    },
    destination_town: {
      en: 'Rajahmundry Central Bus Station',
      te: 'రాజమండ్రి సెంట్రల్ బస్ స్టేషన్',
      hi: 'राजमंड्री सेंट्रल बस स्टेशन',
    },
    operating_dates: {
      start_date: '2027-07-14',
      end_date: '2027-07-25',
    },
    timings_description: {
      en: 'Buses depart every 30 minutes 24 hours round-the-clock during festival days',
      te: 'పుష్కరాల రోజుల్లో ప్రతి 30 నిమిషాలకు ఒక బస్సు నిరంతరం నడుస్తుంది',
      hi: 'त्योहार के दिनों में हर 30 मिनट में 24 घंटे लगातार बसें उपलब्ध हैं',
    },
    booking_url: 'https://www.apsrtconline.in',
    emergency_helpline: '0866 2570005',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'spl-bza-rjy-02',
    service_code: 'PUSH-SPL-BZA-02',
    service_title: {
      en: 'APSRTC Non-Stop Express Corridor: Vijayawada to Rajahmundry',
      te: 'ఆర్టీసీ నాన్-స్టాప్ ఎక్స్‌ప్రెస్ కారిడార్: విజయవాడ నుండి రాజమండ్రి',
      hi: 'एपीएसआरटीसी नॉन-स्टॉप एक्सप्रेस कॉरिडोर: विजयवाड़ा से राजमंड्री',
    },
    operator: 'APSRTC',
    origin_city: {
      en: 'Vijayawada (Pandit Nehru Bus Station)',
      te: 'విజయవాడ (పండిట్ నెహ్రూ బస్ స్టేషన్)',
      hi: 'विजयवाड़ा (पंडित नेहरू बस स्टेशन)',
    },
    destination_town: {
      en: 'Rajahmundry & Kovvur Ghats',
      te: 'రాజమండ్రి మరియు కొవ్వూరు ఘాట్లు',
      hi: 'राजमंड्री और कोव्वूर घाट',
    },
    operating_dates: {
      start_date: '2027-07-14',
      end_date: '2027-07-25',
    },
    timings_description: {
      en: 'Non-stop corridor every 15 minutes via Eluru bypass',
      te: 'ఏలూరు బైపాస్ మీదుగా ప్రతి 15 నిమిషాలకు నాన్-స్టాప్ బస్సులు',
      hi: 'एलुरु बाईपास के रास्ते हर 15 मिनट में नॉन-स्टॉप बसें',
    },
    booking_url: 'https://www.apsrtconline.in',
    emergency_helpline: '0866 2570005',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'spl-wgl-bdr-03',
    service_code: 'PUSH-SPL-WGL-03',
    service_title: {
      en: 'TGSRTC Pavitra Sangamam Special: Warangal to Bhadrachalam Ghats',
      te: 'టిజిఎస్ఆర్టీసీ పవిత్ర సంగమం స్పెషల్: వరంగల్ నుండి భద్రాచలం ఘాట్లు',
      hi: 'टीजीएसआरटीसी पवित्र संगम स्पेशल: वारंगल से भद्राचलम घाट',
    },
    operator: 'TGSRTC',
    origin_city: {
      en: 'Warangal / Hanamkonda Bus Station',
      te: 'వరంగల్ / హనుమకొండ బస్ స్టేషన్',
      hi: 'वारंगल / हनमकोंडा बस स्टेशन',
    },
    destination_town: {
      en: 'Bhadrachalam Temple Ghat',
      te: 'భద్రాచలం ఆలయ ఘాట్',
      hi: 'भद्राचलम मंदिर घाट',
    },
    operating_dates: {
      start_date: '2027-07-14',
      end_date: '2027-07-25',
    },
    timings_description: {
      en: 'Continuous daytime and evening fleet every 20 minutes',
      te: 'ప్రతి 20 నిమిషాలకు నిరంతర బస్సు సర్వీసులు',
      hi: 'हर 20 मिनट में निरंतर बस सेवाएं उपलब्ध',
    },
    booking_url: 'https://www.tgsrtcbus.in',
    emergency_helpline: '040 69440000',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: 'shuttle-green-01',
    route_code: 'SHTL-GREEN-01',
    route_name: {
      en: 'Green Line Free Shuttle: Morampudi Satellite Parking to Pushkar Ghat',
      te: 'గ్రీన్ లైన్ ఉచిత షటిల్: మొరంపూడి శాటిలైట్ పార్కింగ్ నుండి పుష్కర్ ఘాట్',
      hi: 'ग्रीन लाइन फ्री शटल: मोरमपुडी सैटेलाइट पार्किंग से पुष्कर घाट',
    },
    origin_hub_id: 'hub-rjy-cbs-01',
    origin_name: {
      en: 'Morampudi Satellite Parking Grounds',
      te: 'మొరంపూడి శాటిలైట్ పార్కింగ్ గ్రౌండ్స్',
      hi: 'मोरमपुडी सैटेलाइट पार्किंग मैदान',
    },
    destination_ghat_id: null,
    destination_name: {
      en: 'Pushkar Ghat South Gate',
      te: 'పుష్కర్ ఘాట్ దక్షిణ ద్వారం',
      hi: 'पुष्कर घाट दक्षिणी द्वार',
    },
    shuttle_type: 'free',
    fare: 0.0,
    frequency_minutes: 8,
    operating_hours: { start: '04:00', end: '23:30', frequency_peak_mins: 5 },
    accessible_for_elderly_disabled: true,
    color_code: '#2E7D32',
    is_active: true,
    stops: [
      {
        id: 'stop-grn-01',
        shuttle_route_id: 'shuttle-green-01',
        stop_order: 1,
        stop_name: {
          en: 'Morampudi Main Parking Boarding Point',
          te: 'మొరంపూడి ప్రధాన పార్కింగ్ బోర్డింగ్ పాయింట్',
          hi: 'मोरमपुडी मुख्य पार्किंग बोर्डिंग पॉइंट',
        },
        landmark: { en: 'Near Pilgrim Shelter Camp 1', te: 'యాత్రికుల శిబిరం 1 దగ్గర', hi: 'तीर्थयात्री शिविर 1 के पास' },
        lat: 17.0125,
        lng: 81.7915,
        is_major_boarding_point: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'stop-grn-02',
        shuttle_route_id: 'shuttle-green-01',
        stop_order: 2,
        stop_name: {
          en: 'Danavaipeta Junction Halt',
          te: 'దానవాయిపేట జంక్షన్ హాల్ట్',
          hi: 'दानवाईपेटा जंक्शन हॉल्ट',
        },
        landmark: { en: 'Opposite Municipal Park', te: 'మున్సిపల్ పార్క్ ఎదురుగా', hi: 'नगर निगम पार्क के सामने' },
        lat: 17.0065,
        lng: 81.7842,
        is_major_boarding_point: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'stop-grn-03',
        shuttle_route_id: 'shuttle-green-01',
        stop_order: 3,
        stop_name: {
          en: 'Pushkar Ghat Pedestrian Green Zone Drop-off',
          te: 'పుష్కర్ ఘాట్ కాలినడక గ్రీన్ జోన్ డ్రాప్-ఆఫ్',
          hi: 'पुष्कर घाट पैदल यात्री ग्रीन ज़ोन ड्रॉप-ऑफ',
        },
        landmark: { en: '50m from Holy Bathing Entry', te: 'పుణ్యస్నాన ప్రవేశానికి 50 మీటర్లు', hi: 'पवित्र स्नान प्रवेश से 50 मीटर' },
        lat: 17.0008,
        lng: 81.7769,
        is_major_boarding_point: true,
        created_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shuttle-blue-02',
    route_code: 'SHTL-BLUE-02',
    route_name: {
      en: 'Blue Line Free Shuttle: Kovvur Tollgate Parking to Goshpada Kshetram',
      te: 'బ్లూ లైన్ ఉచిత షటిల్: కొవ్వూరు టోల్‌గేట్ పార్కింగ్ నుండి గోష్పాద క్షేత్రం',
      hi: 'ब्लू लाइन फ्री शटल: कोव्वूर टोलगेट पार्किंग से गोष्पद क्षेत्रम',
    },
    origin_hub_id: 'hub-kvr-bs-02',
    origin_name: {
      en: 'Kovvur Highway Tollgate Parking',
      te: 'కొవ్వూరు హైవే టోల్‌గేట్ పార్కింగ్',
      hi: 'कोव्वूर हाईवे टोलगेट पार्किंग',
    },
    destination_ghat_id: null,
    destination_name: {
      en: 'Goshpada Kshetram North Ghat',
      te: 'గోష్పాద క్షేత్రం ఉత్తర ఘాట్',
      hi: 'गोष्पद क्षेत्रम उत्तरी घाट',
    },
    shuttle_type: 'free',
    fare: 0.0,
    frequency_minutes: 10,
    operating_hours: { start: '04:00', end: '23:00', frequency_peak_mins: 6 },
    accessible_for_elderly_disabled: true,
    color_code: '#1565C0',
    is_active: true,
    stops: [
      {
        id: 'stop-blu-01',
        shuttle_route_id: 'shuttle-blue-02',
        stop_order: 1,
        stop_name: {
          en: 'Kovvur Tollgate Parking Terminal',
          te: 'కొవ్వూరు టోల్‌గేట్ పార్కింగ్ టెర్మినల్',
          hi: 'कोव्वूर टोलगेट पार्किंग टर्मिनल',
        },
        landmark: { en: 'National Highway 16 junction', te: 'జాతీయ రహదారి 16 జంక్షన్', hi: 'राष्ट्रीय राजमार्ग 16 जंक्शन' },
        lat: 17.0145,
        lng: 81.7412,
        is_major_boarding_point: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'stop-blu-02',
        shuttle_route_id: 'shuttle-blue-02',
        stop_order: 2,
        stop_name: {
          en: 'Goshpada Kshetram Main Drop-off',
          te: 'గోష్పాద క్షేత్రం ప్రధాన డ్రాప్-ఆఫ్',
          hi: 'गोष्पद क्षेत्रम मुख्य ड्रॉप-ऑफ',
        },
        landmark: { en: 'Temple Cloakroom & Footwear Stand', te: 'ఆలయ క్లోక్‌రూమ్ దగ్గర', hi: 'मंदिर क्लॉकरूम के पास' },
        lat: 17.0042,
        lng: 81.7582,
        is_major_boarding_point: true,
        created_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shuttle-electric-03',
    route_code: 'SHTL-ELEC-03',
    route_name: {
      en: 'Senior Citizen & Divyang Electric Cart Shuttle (Ghat Corridor)',
      te: 'వృద్ధులు & దివ్యాంగుల ఎలక్ట్రిక్ కార్ట్ ఉచిత షటిల్ (ఘాట్ కారిడార్)',
      hi: 'वरिष्ठ नागरिक और दिव्यांग इलेक्ट्रिक कार्ट फ्री शटल (घाट कॉरिडोर)',
    },
    origin_hub_id: 'hub-gvn-rly-04',
    origin_name: {
      en: 'Godavari Railway Station / Bund Plaza',
      te: 'గోదావరి రైల్వే స్టేషన్ / బండ్ ప్లాజా',
      hi: 'गोदावरी रेलवे स्टेशन / बंड प्लाजा',
    },
    destination_ghat_id: null,
    destination_name: {
      en: 'Kotilingala Ghat Entrance',
      te: 'కోటిలింగాల ఘాట్ ప్రవేశం',
      hi: 'कोटिशिंगला घाट प्रवेश',
    },
    shuttle_type: 'electric_cart',
    fare: 0.0,
    frequency_minutes: 5,
    operating_hours: { start: '04:30', end: '22:30', frequency_peak_mins: 3 },
    accessible_for_elderly_disabled: true,
    color_code: '#8E24AA',
    is_active: true,
    stops: [
      {
        id: 'stop-elc-01',
        shuttle_route_id: 'shuttle-electric-03',
        stop_order: 1,
        stop_name: {
          en: 'Godavari Station Ramp Boarding Point',
          te: 'గోదావరి స్టేషన్ ర్యాంప్ బోర్డింగ్ పాయింట్',
          hi: 'गोदावरी स्टेशन रैंप बोर्डिंग पॉइंट',
        },
        landmark: { en: 'Wheelchair accessible ramp', te: 'వీల్‌చైర్ ర్యాంప్ పక్కన', hi: 'व्हीलचेयर रैंप के पास' },
        lat: 17.0025,
        lng: 81.7748,
        is_major_boarding_point: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'stop-elc-02',
        shuttle_route_id: 'shuttle-electric-03',
        stop_order: 2,
        stop_name: {
          en: 'Kotilingala Ghat Direct Entry Gate',
          te: 'కోటిలింగాల ఘాట్ ప్రత్యక్ష ప్రవేశ ద్వారం',
          hi: 'कोटिशिंगला घाट सीधा प्रवेश द्वार',
        },
        landmark: { en: 'Elderly assistance counter', te: 'వృద్ధుల సహాయ కేంద్రం', hi: 'वरिष्ठ नागरिक सहायता केंद्र' },
        lat: 17.0052,
        lng: 81.7723,
        is_major_boarding_point: true,
        created_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_EXTERNAL_LINKS: ExternalLink[] = [
  {
    id: 'link-apsrtc-01',
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
    is_verified: true,
    last_verified_at: new Date().toISOString(),
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link-tgsrtc-02',
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
    is_verified: true,
    last_verified_at: new Date().toISOString(),
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link-ntes-enquiry-03',
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
    is_verified: true,
    last_verified_at: new Date().toISOString(),
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link-irctc-avail-04',
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
    is_verified: true,
    last_verified_at: new Date().toISOString(),
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link-pnr-status-05',
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
    is_verified: true,
    last_verified_at: new Date().toISOString(),
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link-rail-live-06',
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
    is_verified: true,
    last_verified_at: new Date().toISOString(),
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'link-rail-madad-07',
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
    is_verified: true,
    last_verified_at: new Date().toISOString(),
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export class TransportRepository {
  // In-memory runtime cache for resilience
  private hubs: TransportHub[] = [...INITIAL_HUBS];
  private busRoutes: BusRoute[] = [...INITIAL_BUS_ROUTES];
  private specialServices: BusSpecialService[] = [...INITIAL_SPECIAL_SERVICES];
  private railStations: RailStation[] = [...INITIAL_RAIL_STATIONS];
  private shuttleRoutes: ShuttleRoute[] = [...INITIAL_SHUTTLE_ROUTES];
  private externalLinks: ExternalLink[] = [...INITIAL_EXTERNAL_LINKS];

  // ==========================================
  // TRANSPORT HUBS
  // ==========================================
  async getHubs(filters?: { hub_type?: string; is_active?: boolean }): Promise<TransportHub[]> {
    try {
      let sql = 'SELECT * FROM transport_hubs WHERE 1=1';
      const params: any[] = [];
      if (filters?.hub_type) {
        params.push(filters.hub_type);
        sql += ` AND hub_type = $${params.length}`;
      }
      if (filters?.is_active !== undefined) {
        params.push(filters.is_active);
        sql += ` AND is_active = $${params.length}`;
      }
      sql += ' ORDER BY created_at DESC';
      const { rows } = await query<TransportHub>(sql, params);
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback to memory
    }

    return this.hubs.filter((h) => {
      if (filters?.hub_type && h.hub_type !== filters.hub_type) return false;
      if (filters?.is_active !== undefined && h.is_active !== filters.is_active) return false;
      return true;
    });
  }

  async getHubById(id: string): Promise<TransportHub | null> {
    try {
      const { rows } = await query<TransportHub>('SELECT * FROM transport_hubs WHERE id = $1', [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {
      // fallback
    }
    return this.hubs.find((h) => h.id === id) || null;
  }

  async createHub(data: Partial<TransportHub>): Promise<TransportHub> {
    const id = data.id || `hub-${Date.now()}`;
    const hub: TransportHub = {
      id,
      name: data.name || { en: 'Transport Hub' },
      description: data.description || null,
      hub_type: data.hub_type || 'bus_stand',
      operator: data.operator || null,
      code: data.code || null,
      address: data.address || null,
      phone: data.phone || null,
      lat: Number(data.lat) || 17.0005,
      lng: Number(data.lng) || 81.7766,
      operating_hours: data.operating_hours || null,
      is_hidden: false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      source_url: data.source_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { rows } = await query<TransportHub>(
        `INSERT INTO transport_hubs (
          id, name, description, hub_type, operator, code, address,
          phone, lat, lng, operating_hours, is_hidden, is_active, source_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          hub.id,
          JSON.stringify(hub.name),
          hub.description ? JSON.stringify(hub.description) : null,
          hub.hub_type,
          hub.operator,
          hub.code,
          hub.address ? JSON.stringify(hub.address) : null,
          hub.phone,
          hub.lat,
          hub.lng,
          hub.operating_hours ? JSON.stringify(hub.operating_hours) : null,
          hub.is_hidden,
          hub.is_active,
          hub.source_url,
        ]
      );
      if (rows && rows.length > 0) {
        this.hubs.unshift(rows[0]);
        return rows[0];
      }
    } catch {
      // fallback to memory
    }

    this.hubs.unshift(hub);
    return hub;
  }

  async updateHub(id: string, updates: Partial<TransportHub>): Promise<TransportHub | null> {
    const existing = await this.getHubById(id);
    if (!existing) return null;

    const merged: TransportHub = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      const { rows } = await query<TransportHub>(
        `UPDATE transport_hubs SET
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          hub_type = COALESCE($4, hub_type),
          operator = COALESCE($5, operator),
          code = COALESCE($6, code),
          address = COALESCE($7, address),
          phone = COALESCE($8, phone),
          lat = COALESCE($9, lat),
          lng = COALESCE($10, lng),
          is_active = COALESCE($11, is_active),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          id,
          updates.name ? JSON.stringify(updates.name) : null,
          updates.description ? JSON.stringify(updates.description) : null,
          updates.hub_type,
          updates.operator,
          updates.code,
          updates.address ? JSON.stringify(updates.address) : null,
          updates.phone,
          updates.lat,
          updates.lng,
          updates.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        const idx = this.hubs.findIndex((h) => h.id === id);
        if (idx >= 0) this.hubs[idx] = rows[0];
        return rows[0];
      }
    } catch {
      // fallback
    }

    const idx = this.hubs.findIndex((h) => h.id === id);
    if (idx >= 0) this.hubs[idx] = merged;
    return merged;
  }

  async deleteHub(id: string): Promise<boolean> {
    try {
      await query('DELETE FROM transport_hubs WHERE id = $1', [id]);
    } catch {
      // fallback
    }
    const idx = this.hubs.findIndex((h) => h.id === id);
    if (idx >= 0) {
      this.hubs.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ==========================================
  // BUS ROUTES
  // ==========================================
  async getBusRoutes(filters?: { operator?: string; is_active?: boolean }): Promise<BusRoute[]> {
    try {
      let sql = 'SELECT * FROM bus_routes WHERE 1=1';
      const params: any[] = [];
      if (filters?.operator) {
        params.push(filters.operator);
        sql += ` AND operator = $${params.length}`;
      }
      if (filters?.is_active !== undefined) {
        params.push(filters.is_active);
        sql += ` AND is_active = $${params.length}`;
      }
      sql += ' ORDER BY route_number ASC';
      const { rows } = await query<BusRoute>(sql, params);
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback
    }

    return this.busRoutes.filter((r) => {
      if (filters?.operator && r.operator !== filters.operator) return false;
      if (filters?.is_active !== undefined && r.is_active !== filters.is_active) return false;
      return true;
    });
  }

  async getBusRouteById(id: string): Promise<BusRoute | null> {
    try {
      const { rows } = await query<BusRoute>('SELECT * FROM bus_routes WHERE id = $1', [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {
      // fallback
    }
    return this.busRoutes.find((r) => r.id === id) || null;
  }

  async createBusRoute(data: Partial<BusRoute>): Promise<BusRoute> {
    const id = data.id || `route-${Date.now()}`;
    const route: BusRoute = {
      id,
      route_number: data.route_number || 'Route-New',
      operator: data.operator || 'APSRTC',
      origin: data.origin || { en: 'Origin' },
      destination: data.destination || { en: 'Destination' },
      origin_hub_id: data.origin_hub_id || null,
      destination_hub_id: data.destination_hub_id || null,
      via_stops: data.via_stops || [],
      first_bus_time: data.first_bus_time || '05:00',
      last_bus_time: data.last_bus_time || '23:00',
      frequency_minutes: data.frequency_minutes || 15,
      fare_range: data.fare_range || { min: 10, max: 50, currency: 'INR' },
      bus_type: data.bus_type || 'ordinary',
      connected_ghat_ids: data.connected_ghat_ids || [],
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { rows } = await query<BusRoute>(
        `INSERT INTO bus_routes (
          id, route_number, operator, origin, destination, origin_hub_id,
          destination_hub_id, via_stops, first_bus_time, last_bus_time,
          frequency_minutes, fare_range, bus_type, connected_ghat_ids, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          route.id,
          route.route_number,
          route.operator,
          JSON.stringify(route.origin),
          JSON.stringify(route.destination),
          route.origin_hub_id,
          route.destination_hub_id,
          JSON.stringify(route.via_stops),
          route.first_bus_time,
          route.last_bus_time,
          route.frequency_minutes,
          JSON.stringify(route.fare_range),
          route.bus_type,
          JSON.stringify(route.connected_ghat_ids),
          route.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        this.busRoutes.unshift(rows[0]);
        return rows[0];
      }
    } catch {
      // fallback
    }

    this.busRoutes.unshift(route);
    return route;
  }

  async updateBusRoute(id: string, updates: Partial<BusRoute>): Promise<BusRoute | null> {
    const existing = await this.getBusRouteById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };
    try {
      const { rows } = await query<BusRoute>(
        `UPDATE bus_routes SET
          route_number = COALESCE($2, route_number),
          operator = COALESCE($3, operator),
          origin = COALESCE($4, origin),
          destination = COALESCE($5, destination),
          frequency_minutes = COALESCE($6, frequency_minutes),
          is_active = COALESCE($7, is_active),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          id,
          updates.route_number,
          updates.operator,
          updates.origin ? JSON.stringify(updates.origin) : null,
          updates.destination ? JSON.stringify(updates.destination) : null,
          updates.frequency_minutes,
          updates.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        const idx = this.busRoutes.findIndex((r) => r.id === id);
        if (idx >= 0) this.busRoutes[idx] = rows[0];
        return rows[0];
      }
    } catch {
      // fallback
    }

    const idx = this.busRoutes.findIndex((r) => r.id === id);
    if (idx >= 0) this.busRoutes[idx] = merged;
    return merged;
  }

  async deleteBusRoute(id: string): Promise<boolean> {
    try {
      await query('DELETE FROM bus_routes WHERE id = $1', [id]);
    } catch {
      // fallback
    }
    const idx = this.busRoutes.findIndex((r) => r.id === id);
    if (idx >= 0) {
      this.busRoutes.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ==========================================
  // BUS SPECIAL SERVICES
  // ==========================================
  async getSpecialServices(filters?: { operator?: string; is_active?: boolean }): Promise<BusSpecialService[]> {
    try {
      let sql = 'SELECT * FROM bus_special_services WHERE 1=1';
      const params: any[] = [];
      if (filters?.operator) {
        params.push(filters.operator);
        sql += ` AND operator = $${params.length}`;
      }
      if (filters?.is_active !== undefined) {
        params.push(filters.is_active);
        sql += ` AND is_active = $${params.length}`;
      }
      sql += ' ORDER BY created_at DESC';
      const { rows } = await query<BusSpecialService>(sql, params);
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback
    }

    return this.specialServices.filter((s) => {
      if (filters?.operator && s.operator !== filters.operator) return false;
      if (filters?.is_active !== undefined && s.is_active !== filters.is_active) return false;
      return true;
    });
  }

  async getSpecialServiceById(id: string): Promise<BusSpecialService | null> {
    try {
      const { rows } = await query<BusSpecialService>('SELECT * FROM bus_special_services WHERE id = $1', [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {
      // fallback
    }
    return this.specialServices.find((s) => s.id === id) || null;
  }

  async createSpecialService(data: Partial<BusSpecialService>): Promise<BusSpecialService> {
    const id = data.id || `spl-${Date.now()}`;
    const service: BusSpecialService = {
      id,
      service_code: data.service_code || `PUSH-SPL-${Date.now().toString().slice(-4)}`,
      service_title: data.service_title || { en: 'Pushkaralu Special Service' },
      operator: data.operator || 'APSRTC',
      origin_city: data.origin_city || { en: 'Major City' },
      destination_ghat_id: data.destination_ghat_id || null,
      destination_town: data.destination_town || { en: 'Ghat Area' },
      operating_dates: data.operating_dates || { start_date: '2027-07-14', end_date: '2027-07-25' },
      timings_description: data.timings_description || null,
      booking_url: data.booking_url || 'https://www.apsrtconline.in',
      emergency_helpline: data.emergency_helpline || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { rows } = await query<BusSpecialService>(
        `INSERT INTO bus_special_services (
          id, service_code, service_title, operator, origin_city,
          destination_ghat_id, destination_town, operating_dates,
          timings_description, booking_url, emergency_helpline, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          service.id,
          service.service_code,
          JSON.stringify(service.service_title),
          service.operator,
          JSON.stringify(service.origin_city),
          service.destination_ghat_id,
          JSON.stringify(service.destination_town),
          JSON.stringify(service.operating_dates),
          service.timings_description ? JSON.stringify(service.timings_description) : null,
          service.booking_url,
          service.emergency_helpline,
          service.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        this.specialServices.unshift(rows[0]);
        return rows[0];
      }
    } catch {
      // fallback
    }

    this.specialServices.unshift(service);
    return service;
  }

  async updateSpecialService(id: string, updates: Partial<BusSpecialService>): Promise<BusSpecialService | null> {
    const existing = await this.getSpecialServiceById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };
    try {
      const { rows } = await query<BusSpecialService>(
        `UPDATE bus_special_services SET
          service_title = COALESCE($2, service_title),
          operator = COALESCE($3, operator),
          booking_url = COALESCE($4, booking_url),
          emergency_helpline = COALESCE($5, emergency_helpline),
          is_active = COALESCE($6, is_active),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          id,
          updates.service_title ? JSON.stringify(updates.service_title) : null,
          updates.operator,
          updates.booking_url,
          updates.emergency_helpline,
          updates.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        const idx = this.specialServices.findIndex((s) => s.id === id);
        if (idx >= 0) this.specialServices[idx] = rows[0];
        return rows[0];
      }
    } catch {
      // fallback
    }

    const idx = this.specialServices.findIndex((s) => s.id === id);
    if (idx >= 0) this.specialServices[idx] = merged;
    return merged;
  }

  async deleteSpecialService(id: string): Promise<boolean> {
    try {
      await query('DELETE FROM bus_special_services WHERE id = $1', [id]);
    } catch {
      // fallback
    }
    const idx = this.specialServices.findIndex((s) => s.id === id);
    if (idx >= 0) {
      this.specialServices.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ==========================================
  // RAIL STATIONS
  // ==========================================
  async getRailStations(filters?: { is_active?: boolean }): Promise<RailStation[]> {
    try {
      let sql = 'SELECT * FROM rail_stations WHERE 1=1';
      const params: any[] = [];
      if (filters?.is_active !== undefined) {
        params.push(filters.is_active);
        sql += ` AND is_active = $${params.length}`;
      }
      sql += ' ORDER BY station_name ASC';
      const { rows } = await query<RailStation>(sql, params);
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback
    }

    return this.railStations.filter((rs) => {
      if (filters?.is_active !== undefined && rs.is_active !== filters.is_active) return false;
      return true;
    });
  }

  async getRailStationById(id: string): Promise<RailStation | null> {
    try {
      const { rows } = await query<RailStation>('SELECT * FROM rail_stations WHERE id = $1', [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {
      // fallback
    }
    return this.railStations.find((rs) => rs.id === id) || null;
  }

  async createRailStation(data: Partial<RailStation>): Promise<RailStation> {
    const id = data.id || `rail-${Date.now()}`;
    const station: RailStation = {
      id,
      hub_id: data.hub_id || null,
      station_code: data.station_code || 'STN',
      station_name: data.station_name || { en: 'Railway Station' },
      division: data.division || 'Vijayawada (BZA)',
      zone: data.zone || 'SCR',
      total_platforms: data.total_platforms || 1,
      has_pushkaralu_special_trains: data.has_pushkaralu_special_trains ?? true,
      helpdesk_phone: data.helpdesk_phone || '139',
      official_enquiry_url: data.official_enquiry_url || 'https://enquiry.indianrail.gov.in',
      lat: Number(data.lat) || 16.9934,
      lng: Number(data.lng) || 81.7821,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { rows } = await query<RailStation>(
        `INSERT INTO rail_stations (
          id, hub_id, station_code, station_name, division, zone,
          total_platforms, has_pushkaralu_special_trains, helpdesk_phone,
          official_enquiry_url, lat, lng, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          station.id,
          station.hub_id,
          station.station_code,
          JSON.stringify(station.station_name),
          station.division,
          station.zone,
          station.total_platforms,
          station.has_pushkaralu_special_trains,
          station.helpdesk_phone,
          station.official_enquiry_url,
          station.lat,
          station.lng,
          station.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        this.railStations.unshift(rows[0]);
        return rows[0];
      }
    } catch {
      // fallback
    }

    this.railStations.unshift(station);
    return station;
  }

  async updateRailStation(id: string, updates: Partial<RailStation>): Promise<RailStation | null> {
    const existing = await this.getRailStationById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };
    try {
      const { rows } = await query<RailStation>(
        `UPDATE rail_stations SET
          station_name = COALESCE($2, station_name),
          station_code = COALESCE($3, station_code),
          total_platforms = COALESCE($4, total_platforms),
          helpdesk_phone = COALESCE($5, helpdesk_phone),
          is_active = COALESCE($6, is_active),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          id,
          updates.station_name ? JSON.stringify(updates.station_name) : null,
          updates.station_code,
          updates.total_platforms,
          updates.helpdesk_phone,
          updates.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        const idx = this.railStations.findIndex((rs) => rs.id === id);
        if (idx >= 0) this.railStations[idx] = rows[0];
        return rows[0];
      }
    } catch {
      // fallback
    }

    const idx = this.railStations.findIndex((rs) => rs.id === id);
    if (idx >= 0) this.railStations[idx] = merged;
    return merged;
  }

  async deleteRailStation(id: string): Promise<boolean> {
    try {
      await query('DELETE FROM rail_stations WHERE id = $1', [id]);
    } catch {
      // fallback
    }
    const idx = this.railStations.findIndex((rs) => rs.id === id);
    if (idx >= 0) {
      this.railStations.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ==========================================
  // SHUTTLE ROUTES & STOPS
  // ==========================================
  async getShuttleRoutes(filters?: { destination_ghat_id?: string; is_active?: boolean }): Promise<ShuttleRoute[]> {
    try {
      let sql = 'SELECT * FROM shuttle_routes WHERE 1=1';
      const params: any[] = [];
      if (filters?.destination_ghat_id) {
        params.push(filters.destination_ghat_id);
        sql += ` AND (destination_ghat_id = $${params.length} OR destination_ghat_id IS NULL)`;
      }
      if (filters?.is_active !== undefined) {
        params.push(filters.is_active);
        sql += ` AND is_active = $${params.length}`;
      }
      sql += ' ORDER BY route_code ASC';
      const { rows } = await query<ShuttleRoute>(sql, params);
      if (rows && rows.length > 0) {
        // Fetch stops
        const routeIds = rows.map((r) => r.id);
        const { rows: stopRows } = await query<ShuttleStop>(
          'SELECT * FROM shuttle_stops WHERE shuttle_route_id = ANY($1) ORDER BY stop_order ASC',
          [routeIds]
        );
        return rows.map((r) => ({
          ...r,
          stops: stopRows.filter((s) => s.shuttle_route_id === r.id),
        }));
      }
    } catch {
      // fallback
    }

    return this.shuttleRoutes.filter((s) => {
      if (filters?.is_active !== undefined && s.is_active !== filters.is_active) return false;
      return true;
    });
  }

  async getShuttleRouteById(id: string): Promise<ShuttleRoute | null> {
    try {
      const { rows } = await query<ShuttleRoute>('SELECT * FROM shuttle_routes WHERE id = $1', [id]);
      if (rows && rows.length > 0) {
        const { rows: stopRows } = await query<ShuttleStop>(
          'SELECT * FROM shuttle_stops WHERE shuttle_route_id = $1 ORDER BY stop_order ASC',
          [id]
        );
        return { ...rows[0], stops: stopRows };
      }
    } catch {
      // fallback
    }
    return this.shuttleRoutes.find((s) => s.id === id) || null;
  }

  async createShuttleRoute(data: Partial<ShuttleRoute>): Promise<ShuttleRoute> {
    const id = data.id || `shuttle-${Date.now()}`;
    const shuttle: ShuttleRoute = {
      id,
      route_code: data.route_code || `SHTL-${Date.now().toString().slice(-4)}`,
      route_name: data.route_name || { en: 'Pushkaralu Free Shuttle Route' },
      origin_hub_id: data.origin_hub_id || null,
      origin_name: data.origin_name || { en: 'Satellite Parking Hub' },
      destination_ghat_id: data.destination_ghat_id || null,
      destination_name: data.destination_name || { en: 'Pilgrim Ghat Entry' },
      shuttle_type: data.shuttle_type || 'free',
      fare: data.fare || 0.0,
      frequency_minutes: data.frequency_minutes || 10,
      operating_hours: data.operating_hours || { start: '04:00', end: '23:00' },
      accessible_for_elderly_disabled: data.accessible_for_elderly_disabled ?? true,
      color_code: data.color_code || '#1E88E5',
      is_active: data.is_active !== undefined ? data.is_active : true,
      stops: data.stops || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { rows } = await query<ShuttleRoute>(
        `INSERT INTO shuttle_routes (
          id, route_code, route_name, origin_hub_id, origin_name,
          destination_ghat_id, destination_name, shuttle_type, fare,
          frequency_minutes, operating_hours, accessible_for_elderly_disabled,
          color_code, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          shuttle.id,
          shuttle.route_code,
          JSON.stringify(shuttle.route_name),
          shuttle.origin_hub_id,
          JSON.stringify(shuttle.origin_name),
          shuttle.destination_ghat_id,
          JSON.stringify(shuttle.destination_name),
          shuttle.shuttle_type,
          shuttle.fare,
          shuttle.frequency_minutes,
          JSON.stringify(shuttle.operating_hours),
          shuttle.accessible_for_elderly_disabled,
          shuttle.color_code,
          shuttle.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        this.shuttleRoutes.unshift(rows[0]);
        return rows[0];
      }
    } catch {
      // fallback
    }

    this.shuttleRoutes.unshift(shuttle);
    return shuttle;
  }

  async updateShuttleRoute(id: string, updates: Partial<ShuttleRoute>): Promise<ShuttleRoute | null> {
    const existing = await this.getShuttleRouteById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };
    try {
      const { rows } = await query<ShuttleRoute>(
        `UPDATE shuttle_routes SET
          route_name = COALESCE($2, route_name),
          frequency_minutes = COALESCE($3, frequency_minutes),
          accessible_for_elderly_disabled = COALESCE($4, accessible_for_elderly_disabled),
          color_code = COALESCE($5, color_code),
          is_active = COALESCE($6, is_active),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          id,
          updates.route_name ? JSON.stringify(updates.route_name) : null,
          updates.frequency_minutes,
          updates.accessible_for_elderly_disabled,
          updates.color_code,
          updates.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        const idx = this.shuttleRoutes.findIndex((s) => s.id === id);
        if (idx >= 0) this.shuttleRoutes[idx] = rows[0];
        return rows[0];
      }
    } catch {
      // fallback
    }

    const idx = this.shuttleRoutes.findIndex((s) => s.id === id);
    if (idx >= 0) this.shuttleRoutes[idx] = merged;
    return merged;
  }

  async deleteShuttleRoute(id: string): Promise<boolean> {
    try {
      await query('DELETE FROM shuttle_routes WHERE id = $1', [id]);
    } catch {
      // fallback
    }
    const idx = this.shuttleRoutes.findIndex((s) => s.id === id);
    if (idx >= 0) {
      this.shuttleRoutes.splice(idx, 1);
      return true;
    }
    return false;
  }

  async addShuttleStop(routeId: string, stop: Partial<ShuttleStop>): Promise<ShuttleStop> {
    const newStop: ShuttleStop = {
      id: stop.id || `stop-${Date.now()}`,
      shuttle_route_id: routeId,
      stop_order: stop.stop_order || 1,
      stop_name: stop.stop_name || { en: 'Shuttle Stop' },
      landmark: stop.landmark || null,
      lat: Number(stop.lat) || 17.0005,
      lng: Number(stop.lng) || 81.7766,
      is_major_boarding_point: stop.is_major_boarding_point ?? false,
      created_at: new Date().toISOString(),
    };

    try {
      const { rows } = await query<ShuttleStop>(
        `INSERT INTO shuttle_stops (
          id, shuttle_route_id, stop_order, stop_name, landmark, lat, lng, is_major_boarding_point
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          newStop.id,
          newStop.shuttle_route_id,
          newStop.stop_order,
          JSON.stringify(newStop.stop_name),
          newStop.landmark ? JSON.stringify(newStop.landmark) : null,
          newStop.lat,
          newStop.lng,
          newStop.is_major_boarding_point,
        ]
      );
      if (rows && rows.length > 0) return rows[0];
    } catch {
      // fallback
    }

    const route = this.shuttleRoutes.find((r) => r.id === routeId);
    if (route) {
      route.stops = route.stops || [];
      route.stops.push(newStop);
    }
    return newStop;
  }

  // ==========================================
  // EXTERNAL LINKS
  // ==========================================
  async getExternalLinks(filters?: { category?: string; is_active?: boolean }): Promise<ExternalLink[]> {
    try {
      let sql = 'SELECT * FROM external_links WHERE 1=1';
      const params: any[] = [];
      if (filters?.category) {
        params.push(filters.category);
        sql += ` AND category = $${params.length}`;
      }
      if (filters?.is_active !== undefined) {
        params.push(filters.is_active);
        sql += ` AND is_active = $${params.length}`;
      }
      sql += ' ORDER BY sort_order ASC, created_at ASC';
      const { rows } = await query<ExternalLink>(sql, params);
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback
    }

    return this.externalLinks.filter((l) => {
      if (filters?.category && l.category !== filters.category) return false;
      if (filters?.is_active !== undefined && l.is_active !== filters.is_active) return false;
      return true;
    });
  }

  async getExternalLinkById(id: string): Promise<ExternalLink | null> {
    try {
      const { rows } = await query<ExternalLink>('SELECT * FROM external_links WHERE id = $1', [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {
      // fallback
    }
    return this.externalLinks.find((l) => l.id === id) || null;
  }

  async updateExternalLink(id: string, updates: Partial<ExternalLink>): Promise<ExternalLink | null> {
    const existing = await this.getExternalLinkById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };
    try {
      const { rows } = await query<ExternalLink>(
        `UPDATE external_links SET
          title = COALESCE($2, title),
          url = COALESCE($3, url),
          official_authority = COALESCE($4, official_authority),
          is_verified = COALESCE($5, is_verified),
          is_active = COALESCE($6, is_active),
          last_verified_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          id,
          updates.title ? JSON.stringify(updates.title) : null,
          updates.url,
          updates.official_authority,
          updates.is_verified,
          updates.is_active,
        ]
      );
      if (rows && rows.length > 0) {
        const idx = this.externalLinks.findIndex((l) => l.id === id);
        if (idx >= 0) this.externalLinks[idx] = rows[0];
        return rows[0];
      }
    } catch {
      // fallback
    }

    const idx = this.externalLinks.findIndex((l) => l.id === id);
    if (idx >= 0) this.externalLinks[idx] = merged;
    return merged;
  }
}

export const transportRepository = new TransportRepository();

