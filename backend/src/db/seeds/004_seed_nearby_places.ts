import { pool, withTransaction } from '../index.js';

export const SEED_HOTELS = [
  {
    name: {
      en: "River Bay Resort & Hotel",
      te: "రివర్ బే రిసార్ట్ & హోటల్",
      hi: "रिवर बे रिसॉर्ट और होटल"
    },
    description: {
      en: "Premium riverside accommodation overlooking Godavari river, near Kotilingala Ghat.",
      te: "కోటిలింగాల ఘాట్ సమీపంలో గోదావరి నది ఎదురుగా ఉన్న ప్రీమియం రివర్‌సైడ్ బస.",
      hi: "कोटिलिंगला घाट के पास गोदावरी नदी के सामने प्रीमियम रिवरसाइड आवास।"
    },
    address: {
      en: "Gautami Ghat Road, Rajamahendravaram, AP 533101",
      te: "గౌతమి ఘాట్ రోడ్, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533101",
      hi: "गौतमी घाट रोड, राजमहेंद्रवरम, आंध्र प्रदेश 533101"
    },
    phone: "+91 883 244 8888",
    lat: 16.9950,
    lng: 81.7670,
    rating: 4.3,
    price_range: "mid_range",
    room_types: ["Deluxe AC", "Executive River View", "Family Suite"],
    photo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
    website_url: "https://riverbayresort.com",
    is_verified: true,
    is_hidden: false,
    source_url: "https://eastgodavari.ap.gov.in"
  },
  {
    name: {
      en: "Hotel Anand Regency",
      te: "హోటల్ ఆనంద్ రీజెన్సీ",
      hi: "होटल आनंद रीजेंसी"
    },
    description: {
      en: "Central business and pilgrim hotel with pure vegetarian dining and AC rooms.",
      te: "స్వచ్ఛమైన శాకాహార భోజనం మరియు ఏసీ గదులతో సెంట్రల్ వ్యాపార మరియు యాత్రీకుల హోటల్.",
      hi: "शुद्ध शाकाहारी भोजन और एसी कमरों के साथ केंद्रीय व्यापार और तीर्थयात्री होटल।"
    },
    address: {
      en: "Jawaharlal Nehru Road, Rajamahendravaram, AP 533103",
      te: "జవహర్‌లాల్ నెహ్రూ రోడ్, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533103",
      hi: "जवाहरलाल नेहरू रोड, राजमहेंद्रवरम, आंध्र प्रदेश 533103"
    },
    phone: "+91 883 246 1201",
    lat: 16.9990,
    lng: 81.7780,
    rating: 4.1,
    price_range: "mid_range",
    room_types: ["Standard AC", "Deluxe Suite"],
    photo_url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    website_url: "https://anandregency.com",
    is_verified: true,
    is_hidden: false,
    source_url: "https://eastgodavari.ap.gov.in"
  },
  {
    name: {
      en: "TTD Pushkaralu Pilgrims Choultry & Guest House",
      te: "టిటిడి పుష్కరాల యాత్రికుల సత్రం & అతిథి గృహం",
      hi: "टीटीडी पुष्करालु तीर्थयात्री धर्मशाला और अतिथि गृह"
    },
    description: {
      en: "Government subsidized pilgrim rest house managed by Tirumala Tirupati Devasthanams.",
      te: "తిరుమల తిరుపతి దేవస్థానం నిర్వహణలోని ప్రభుత్వ రాయితీ యాత్రికుల విశ్రాంతి గృహం.",
      hi: "तिरुपति देवस्थानम द्वारा संचालित सरकारी सब्सिडी वाला तीर्थयात्री विश्राम गृह।"
    },
    address: {
      en: "Near Railway Station Road, Rajamahendravaram, AP 533101",
      te: "రైల్వే స్టేషన్ రోడ్ సమీపంలో, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533101",
      hi: "रेलवे स्टेशन रोड के पास, राजमहेंद्रवरम, आंध्र प्रदेश 533101"
    },
    phone: "+91 883 247 5555",
    lat: 16.9890,
    lng: 81.7720,
    rating: 4.5,
    price_range: "dharamshala",
    room_types: ["Free Dormitory Hall", "Nominal AC Room", "Non-AC Hall"],
    photo_url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
    website_url: "https://tirupatibalaji.ap.gov.in",
    is_verified: true,
    is_hidden: false,
    source_url: "https://tirupatibalaji.ap.gov.in"
  },
  {
    name: {
      en: "Haritha Hotel Bhadrachalam (TG Tourism)",
      te: "హరిత హోటల్ భద్రాచలం (తెలంగాణ పర్యాటకం)",
      hi: "हरिता होटल भद्राचलम (टीजी पर्यटन)"
    },
    description: {
      en: "Official Telangana Tourism corporation guest house with dining near Sita Ramachandra Swamy temple.",
      te: "సీతా రామచంద్ర స్వామి ఆలయం సమీపంలో అధికారిక తెలంగాణ పర్యాటక సంస్థ అతిథి గృహం.",
      hi: "सीता रामचंद्र स्वामी मंदिर के पास आधिकारिक तेलंगाना पर्यटन निगम गेस्ट हाउस।"
    },
    address: {
      en: "Near Temple Ghat, Bhadrachalam, Bhadradri Kothagudem, TG 507111",
      te: "టెంపుల్ ఘాట్ సమీపంలో, భద్రాచలం, భద్రాద్రి కొత్తగూడెం, తెలంగాణ 507111",
      hi: "मंदिर घाट के पास, भद्राचलम, भद्राद्री कोठागुडेम, तेलंगाना 507111"
    },
    phone: "+91 8743 232 477",
    lat: 17.6690,
    lng: 80.8870,
    rating: 4.0,
    price_range: "mid_range",
    room_types: ["AC Deluxe", "Non-AC Standard", "Pilgrim Dormitory"],
    photo_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
    website_url: "https://tourism.telangana.gov.in",
    is_verified: true,
    is_hidden: false,
    source_url: "https://tourism.telangana.gov.in"
  },
  {
    name: {
      en: "Sri Saraswati Sadan Choultry (Basar Devasthanam)",
      te: "శ్రీ సరస్వతి సదన్ సత్రం (బాసర దేవస్థానం)",
      hi: "श्री सरस्वती सदन धर्मशाला (बासर देवस्थानम)"
    },
    description: {
      en: "Temple devasthanam accommodation with basic rooms, purified drinking water, and round-the-clock security.",
      te: "ప్రాథమిక గదులు, శుద్ధి చేసిన తాగునీరు మరియు నిరంతర భద్రతతో దేవస్థానం బస.",
      hi: "कमरों, शुद्ध पेयजल और 24 घंटे सुरक्षा के साथ देवस्थानम आवास।"
    },
    address: {
      en: "Ghat Road, Basar, Nirmal District, TG 504101",
      te: "ఘాట్ రోడ్, బాసర, నిర్మల్ జిల్లా, తెలంగాణ 504101",
      hi: "घाट रोड, बासर, निर्मल जिला, तेलंगाना 504101"
    },
    phone: "+91 8752 255 503",
    lat: 18.8770,
    lng: 77.9560,
    rating: 4.4,
    price_range: "dharamshala",
    room_types: ["Dormitory", "Non-AC Double Room"],
    photo_url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    website_url: "https://basaratemple.org",
    is_verified: true,
    is_hidden: false,
    source_url: "https://basaratemple.org"
  }
];

export const SEED_TEMPLES = [
  {
    name: {
      en: "Sri Kotilingeshwara Swamy Temple",
      te: "శ్రీ కోటిలింగేశ్వర స్వామి దేవాలయం",
      hi: "श्री कोटिलिंगेश्वर स्वामी मंदिर"
    },
    description: {
      en: "Ancient holy Shiva temple adjacent to Kotilingala Ghat established by Sage Gautama Maharshi.",
      te: "గౌతమ మహర్షి ప్రతిష్టించిన కోటిలింగాల ఘాట్‌కు ఆనుకుని ఉన్న ప్రాచీన పవిత్ర శివాలయం.",
      hi: "गौतम महर्षि द्वारा स्थापित कोटिलिंगला घाट से सटा प्राचीन पवित्र शिव मंदिर।"
    },
    address: {
      en: "Kotilingala Ghat Road, Rajamahendravaram, AP 533101",
      te: "కోటిలింగాల ఘాట్ రోడ్, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533101",
      hi: "कोटिलिंगला घाट रोड, राजमहेंद्रवरम, आंध्र प्रदेश 533101"
    },
    phone: "+91 883 244 1999",
    lat: 16.9926,
    lng: 81.7658,
    deity: {
      en: "Lord Shiva (Kotilingeshwara)",
      te: "శివుడు (కోటిలింగేశ్వరుడు)",
      hi: "भगवान शिव (कोटिलिंगेश्वर)"
    },
    darshan_timings: {
      en: "05:00 AM - 12:30 PM, 04:00 PM - 09:00 PM",
      te: "ఉదయం 05:00 - మధ్యాహ్నం 12:30, సాయంత్రం 04:00 - రాత్రి 09:00",
      hi: "प्रातः 05:00 - दोपहर 12:30, सायं 04:00 - रात्रि 09:00"
    },
    special_entry_info: {
      en: "Free Sarva Darshan; Special Pushkaralu Rudrabhishekam queues available during festival.",
      te: "ఉచిత సర్వ దర్శనం; పుష్కరాల పండుగ సమయంలో ప్రత్యేక రుద్రాభిషేకం క్యూలు కలవు.",
      hi: "निःशुल्क सर्व दर्शन; उत्सव के दौरान विशेष रुद्राभिषेक कतारें उपलब्ध हैं।"
    },
    photo_url: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80",
    website_url: "https://tms.ap.gov.in",
    is_verified: true,
    is_hidden: false,
    source_url: "https://eastgodavari.ap.gov.in"
  },
  {
    name: {
      en: "Sri Markandeya Swamy Temple",
      te: "శ్రీ మార్కండేయ స్వామి దేవాలయం",
      hi: "श्री मार्कंडेय स्वामी मंदिर"
    },
    description: {
      en: "Historical Shaivite temple located right beside Markandeya Ghat on the bank of the Akhanda Godavari.",
      te: "అఖండ గోదావరి ఒడ్డున మార్కండేయ ఘాట్ సమీపంలో వెలసిన చారిత్రాత్మక శైవ క్షేత్రం.",
      hi: "अखंड गोदावरी के तट पर मार्कंडेय घाट के पास स्थित ऐतिहासिक शैव मंदिर।"
    },
    address: {
      en: "Markandeya Ghat, Main Road, Rajamahendravaram, AP 533101",
      te: "మార్కండేయ ఘాట్, మెయిన్ రోడ్, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533101",
      hi: "मार्कंडेय घाट, मेन रोड, राजमहेंद्रवरम, आंध्र प्रदेश 533101"
    },
    phone: "+91 883 247 2211",
    lat: 16.9880,
    lng: 81.7680,
    deity: {
      en: "Lord Shiva & Sage Markandeya",
      te: "శివుడు మరియు మార్కండేయ మహర్షి",
      hi: "भगवान शिव और ऋषि मार्कंडेय"
    },
    darshan_timings: {
      en: "05:30 AM - 01:00 PM, 04:30 PM - 08:30 PM",
      te: "ఉదయం 05:30 - మధ్యాహ్నం 01:00, సాయంత్రం 04:30 - రాత్రి 08:30",
      hi: "प्रातः 05:30 - दोपहर 01:00, सायं 04:30 - रात्रि 08:30"
    },
    special_entry_info: {
      en: "Holy Pushkara Snanam exit opens directly into temple complex courtyard.",
      te: "పవిత్ర పుష్కర స్నాన నిష్క్రమణ నేరుగా ఆలయ ప్రాంగణంలోకి తెరవబడుతుంది.",
      hi: "पवित्र पुष्कर स्नान निकास सीधे मंदिर प्रांगण में खुलता है।"
    },
    photo_url: "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80",
    website_url: "https://tms.ap.gov.in",
    is_verified: true,
    is_hidden: false,
    source_url: "https://eastgodavari.ap.gov.in"
  },
  {
    name: {
      en: "Sri Sita Ramachandra Swamy Devasthanam",
      te: "శ్రీ సీతా రామచంద్ర స్వామి దేవస్థానం",
      hi: "श्री सीता रामचंद्र स्वामी देवस्थानम"
    },
    description: {
      en: "World renowned temple dedicated to Lord Sri Rama on the banks of Godavari, Bhadrachalam.",
      te: "గోదావరి నదీ తీరాన భద్రాచలంలో శ్రీరామునికి అంకితం చేయబడిన ప్రపంచ ప్రసిద్ధి గాంచిన ఆలయం.",
      hi: "गोदावरी के तट पर भद्राचलम में भगवान श्री राम को समर्पित विश्व प्रसिद्ध मंदिर।"
    },
    address: {
      en: "Temple Street, Bhadrachalam, Bhadradri Kothagudem, TG 507111",
      te: "టెంపుల్ స్ట్రీట్, భద్రాచలం, భద్రాద్రి కొత్తగూడెం, తెలంగాణ 507111",
      hi: "मंदिर स्ट्रीट, भद्राचलम, भद्राद्री कोठागुडेम, तेलंगाना 507111"
    },
    phone: "+91 8743 232 444",
    lat: 17.6680,
    lng: 80.8845,
    deity: {
      en: "Sri Rama, Sita Devi & Lakshmana",
      te: "శ్రీరాముడు, సీతాదేవి & లక్ష్మణుడు",
      hi: "श्री राम, सीता देवी और लक्ष्मण"
    },
    darshan_timings: {
      en: "04:30 AM - 01:00 PM, 03:00 PM - 09:30 PM",
      te: "ఉదయం 04:30 - మధ్యాహ్నం 01:00, మధ్యాహ్నం 03:00 - రాత్రి 09:30",
      hi: "प्रातः 04:30 - दोपहर 01:00, दोपहर 03:00 - रात्रि 09:30"
    },
    special_entry_info: {
      en: "Pushkaralu special queue complexes with water misters and prasad counters.",
      te: "వాటర్ మిస్టర్లు మరియు ప్రసాదం కౌంటర్లతో పుష్కరాల ప్రత్యేక క్యూ కాంప్లెక్స్‌లు.",
      hi: "वाटर मिस्ट और प्रसाद काउंटरों के साथ पुष्करालु विशेष कतार परिसर।"
    },
    photo_url: "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=600&q=80",
    website_url: "https://bhadrachalamtemple.telangana.gov.in",
    is_verified: true,
    is_hidden: false,
    source_url: "https://bhadrachalamtemple.telangana.gov.in"
  },
  {
    name: {
      en: "Gnana Saraswati Devasthanam",
      te: "జ్ఞాన సరస్వతి దేవస్థానం",
      hi: "ज्ञान सरस्वती देवस्थानम"
    },
    description: {
      en: "One of the two famous Goddess Saraswati temples in India, located at Basar on river Godavari.",
      te: "గోదావరి నది తీరంలో బాసర వద్ద వెలసిన భారతదేశంలోని రెండు ప్రసిద్ధ సరస్వతీ దేవాలయాలలో ఒకటి.",
      hi: "गोदावरी नदी के तट पर बासर में स्थित भारत के दो प्रसिद्ध सरस्वती मंदिरों में से एक।"
    },
    address: {
      en: "Basar Village, Nirmal District, Telangana 504101",
      te: "బాసర గ్రామం, నిర్మల్ జిల్లా, తెలంగాణ 504101",
      hi: "बासर गांव, निर्मल जिला, तेलंगाना 504101"
    },
    phone: "+91 8752 255 550",
    lat: 18.8780,
    lng: 77.9535,
    deity: {
      en: "Goddess Gnana Saraswati, Lakshmi & Kali",
      te: "జ్ఞాన సరస్వతీ దేవి, లక్ష్మి & కాళికా దేవి",
      hi: "देवी ज्ञान सरस्वती, लक्ष्मी और काली"
    },
    darshan_timings: {
      en: "04:00 AM - 12:00 PM, 02:00 PM - 09:00 PM",
      te: "ఉదయం 04:00 - మధ్యాహ్నం 12:00, మధ్యాహ్నం 02:00 - రాత్రి 09:00",
      hi: "प्रातः 04:00 - दोपहर 12:00, दोपहर 02:00 - रात्रि 09:00"
    },
    special_entry_info: {
      en: "Aksharabhyasam ceremonies conducted daily; token counter opens 04:30 AM.",
      te: "అక్షరాభ్యాసం పూజలు రోజూ జరుగుతాయి; టోకెన్ కౌంటర్ తెల్లవారుజామున 04:30 గంటలకు తెరవబడుతుంది.",
      hi: "अक्षराभ्यासम अनुष्ठान प्रतिदिन आयोजित किया जाता है; टोकन काउंटर प्रातः 04:30 बजे खुलता है।"
    },
    photo_url: "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80",
    website_url: "https://basaratemple.org",
    is_verified: true,
    is_hidden: false,
    source_url: "https://basaratemple.org"
  }
];

export const SEED_TRANSPORT_HUBS = [
  {
    name: {
      en: "Rajahmundry Railway Station (RJY)",
      te: "రాజమండ్రి రైల్వే స్టేషన్ (RJY)",
      hi: "राजमुंदरी रेलवे स्टेशन (RJY)"
    },
    description: {
      en: "Major A1 category junction on Howrah-Chennai mainline, nearest station to Kotilingala & Pushkar Ghats.",
      te: "హౌరా-చెన్నై మెయిన్‌లైన్‌లో ప్రధాన A1 కేటగిరీ జంక్షన్, కోటిలింగాల మరియు పుష్కర్ ఘాట్‌లకు సమీప స్టేషన్.",
      hi: "हावड़ा-चेन्नई मेनलाइन पर प्रमुख ए1 श्रेणी जंक्शन, कोटिलिंगला और पुष्कर घाटों के सबसे नजदीक स्टेशन।"
    },
    hub_type: "railway_station",
    address: {
      en: "Station Road, Rajamahendravaram, AP 533101",
      te: "స్టేషన్ రోడ్, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533101",
      hi: "स्टेशन रोड, राजमहेंद्रवरम, आंध्र प्रदेश 533101"
    },
    phone: "139",
    lat: 16.9850,
    lng: 81.7760,
    operating_hours: {
      en: "24 Hours Open (Round the clock Pushkaralu Helpdesk)",
      te: "24 గంటలు తెరిచి ఉంటుంది (పుష్కరాల హెల్ప్‌డెస్క్ అందుబాటులో ఉంది)",
      hi: "24 घंटे खुला (चौबीसों घंटे पुष्करालु हेल्पडेस्क)"
    },
    is_hidden: false,
    source_url: "https://indianrailways.gov.in"
  },
  {
    name: {
      en: "Godavari Railway Station (GVN)",
      te: "గోదావరి రైల్వే స్టేషన్ (GVN)",
      hi: "गोदावरी रेलवे स्टेशन (GVN)"
    },
    description: {
      en: "Suburban railway station situated directly adjacent to Pushkar Ghat, ideal for local shuttles.",
      te: "పుష్కర్ ఘాట్‌కు ఆనుకుని ఉన్న సబర్బన్ రైల్వే స్టేషన్, లోకల్ షటిల్ రైళ్లకు అత్యంత అనుకూలం.",
      hi: "पुष्कर घाट के ठीक सामने स्थित उपनगरीय रेलवे स्टेशन, स्थानीय शटल के लिए आदर्श।"
    },
    hub_type: "railway_station",
    address: {
      en: "Near Godavari Bridge Approach, Rajamahendravaram, AP 533101",
      te: "గోదావరి వంతెన సమీపంలో, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533101",
      hi: "गोदावरी ब्रिज के पास, राजमहेंद्रवरम, आंध्र प्रदेश 533101"
    },
    phone: "139",
    lat: 16.9870,
    lng: 81.7710,
    operating_hours: {
      en: "04:00 AM - 11:30 PM",
      te: "ఉదయం 04:00 - రాత్రి 11:30",
      hi: "प्रातः 04:00 - रात्रि 11:30"
    },
    is_hidden: false,
    source_url: "https://indianrailways.gov.in"
  },
  {
    name: {
      en: "Rajahmundry APSRTC Central Bus Complex",
      te: "రాజమండ్రి ఏపీఎస్‌ఆర్‌టీసీ సెంట్రల్ బస్ కాంప్లెక్స్",
      hi: "राजमुंदरी एपीएसआरटीसी सेंट्रल बस कॉम्प्लेक्स"
    },
    description: {
      en: "Major regional bus depot connecting all Andhra Pradesh & Telangana districts, with direct ghat shuttle feeder services.",
      te: "అన్ని ఏపీ & తెలంగాణ జిల్లాలను కలిపే ప్రధాన బస్ డిపో, ఘాట్‌లకు నేరుగా ఫీడర్ బస్సులు కలవు.",
      hi: "सभी आंध्र प्रदेश और तेलंगाना जिलों को जोड़ने वाला प्रमुख क्षेत्रीय बस डिपो, सीधे घाट फीडर सेवाएं।"
    },
    hub_type: "bus_stand",
    address: {
      en: "Morampudi Road, Rajamahendravaram, AP 533103",
      te: "మొరంపూడి రోడ్, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533103",
      hi: "मोरमपुडी रोड, राजमहेंद्रवरम, आंध्र प्रदेश 533103"
    },
    phone: "+91 883 246 8800",
    lat: 16.9940,
    lng: 81.7820,
    operating_hours: {
      en: "24 Hours Service",
      te: "24 గంటల సేవలు",
      hi: "24 घंटे सेवा"
    },
    is_hidden: false,
    source_url: "https://apsrtc.ap.gov.in"
  },
  {
    name: {
      en: "Kotilingala Ghat Pushkaralu Feeder & Auto Stand",
      te: "కోటిలింగాల ఘాట్ పుష్కరాల ఫీడర్ & ఆటో స్టాండ్",
      hi: "कोटिलिंगला घाट पुष्करालु फीडर और ऑटो स्टैंड"
    },
    description: {
      en: "Designated government pre-paid auto rickshaw and electric battery buggy pickup zone.",
      te: "ప్రభుత్వ ప్రీ-పెయిడ్ ఆటో రిక్షా మరియు బ్యాటరీ బగ్గీల ప్రత్యేక పికప్ జోన్.",
      hi: "निर्दिष्ट सरकारी प्रीपेड ऑटो रिक्शा और बैटरी बग्गी पिकअप क्षेत्र।"
    },
    hub_type: "auto_stand",
    address: {
      en: "Kotilingala South Circle, Rajamahendravaram, AP 533101",
      te: "కోటిలింగాల సౌత్ సర్కిల్, రాజమహేంద్రవరం, ఆంధ్రప్రదేశ్ 533101",
      hi: "कोटिलिंगला दक्षिण सर्कल, राजमहेंद्रवरम, आंध्र प्रदेश 533101"
    },
    phone: "+91 883 244 0100",
    lat: 16.9915,
    lng: 81.7645,
    operating_hours: {
      en: "24 Hours during Pushkaralu",
      te: "పుష్కరాల సమయంలో 24 గంటలు",
      hi: "पुष्करालु के दौरान 24 घंटे"
    },
    is_hidden: false,
    source_url: "https://eastgodavari.ap.gov.in"
  },
  {
    name: {
      en: "Bhadrachalam TSRTC Bus Station",
      te: "భద్రాచలం టీఎస్ఆర్టీసీ బస్ స్టేషన్",
      hi: "भद्राचलम टीएसआरटीसी बस स्टेशन"
    },
    description: {
      en: "Primary transit point for pilgrims traveling across Telangana, AP, Chhattisgarh and Odisha.",
      te: "తెలంగాణ, ఏపీ, ఛత్తీస్‌గఢ్ మరియు ఒడిశా మీదుగా ప్రయాణించే భక్తుల ప్రధాన రవాణా కేంద్రం.",
      hi: "तेलंगाना, आंध्र प्रदेश, छत्तीसगढ़ और ओडिशा के बीच यात्रा करने वाले तीर्थयात्रियों के लिए प्रमुख पारगमन केंद्र।"
    },
    hub_type: "bus_stand",
    address: {
      en: "Near Bridge Point, Bhadrachalam, TG 507111",
      te: "వంతెన సమీపంలో, భద్రాచలం, తెలంగాణ 507111",
      hi: "ब्रिज के पास, भद्राचलम, तेलंगाना 507111"
    },
    phone: "+91 8743 232 400",
    lat: 17.6710,
    lng: 80.8910,
    operating_hours: {
      en: "24 Hours Service",
      te: "24 గంటల సేవలు",
      hi: "24 घंटे सेवा"
    },
    is_hidden: false,
    source_url: "https://tsrtc.telangana.gov.in"
  }
];

export async function seedNearbyPlaces() {
  console.log('[SeedNearbyPlaces] Seeding curated hotels, temples, transport hubs...');
  await withTransaction(async (client) => {
    // 1. Hotels
    for (const h of SEED_HOTELS) {
      await client.query(`
        INSERT INTO hotels (
          name, description, address, phone, lat, lng,
          rating, price_range, room_types, photo_url, website_url,
          is_verified, is_hidden, source_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT DO NOTHING
      `, [
        JSON.stringify(h.name),
        JSON.stringify(h.description),
        JSON.stringify(h.address),
        h.phone,
        h.lat,
        h.lng,
        h.rating,
        h.price_range,
        JSON.stringify(h.room_types),
        h.photo_url,
        h.website_url,
        h.is_verified,
        h.is_hidden,
        h.source_url
      ]);
    }

    // 2. Temples
    for (const t of SEED_TEMPLES) {
      await client.query(`
        INSERT INTO temples (
          name, description, address, phone, lat, lng,
          deity, darshan_timings, special_entry_info, photo_url, website_url,
          is_verified, is_hidden, source_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT DO NOTHING
      `, [
        JSON.stringify(t.name),
        JSON.stringify(t.description),
        JSON.stringify(t.address),
        t.phone,
        t.lat,
        t.lng,
        JSON.stringify(t.deity),
        JSON.stringify(t.darshan_timings),
        JSON.stringify(t.special_entry_info),
        t.photo_url,
        t.website_url,
        t.is_verified,
        t.is_hidden,
        t.source_url
      ]);
    }

    // 3. Transport Hubs
    for (const th of SEED_TRANSPORT_HUBS) {
      await client.query(`
        INSERT INTO transport_hubs (
          name, description, hub_type, address, phone, lat, lng,
          operating_hours, is_hidden, source_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `, [
        JSON.stringify(th.name),
        JSON.stringify(th.description),
        th.hub_type,
        JSON.stringify(th.address),
        th.phone,
        th.lat,
        th.lng,
        JSON.stringify(th.operating_hours),
        th.is_hidden,
        th.source_url
      ]);
    }

    // 4. Sample Place Override (example: a third-party noisy spot overridden with special pushkaralu notes)
    await client.query(`
      INSERT INTO place_overrides (
        place_id, name_override, phone_override, custom_notes, is_hidden
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (place_id) DO UPDATE SET
        custom_notes = EXCLUDED.custom_notes,
        is_hidden = EXCLUDED.is_hidden
    `, [
      'google_place_mock_noisy_inn',
      JSON.stringify({
        en: "Godavari Riverside Lodge (Restricted Zone)",
        te: "గోదావరి రివర్‌సైడ్ లాడ్జి (పరిమిత జోన్)",
        hi: "गोदावरी रिवरसाइड लॉज (प्रतिबंधित क्षेत्र)"
      }),
      "+91 883 244 9999",
      JSON.stringify({
        en: "Reserved for government Pushkaralu duty officers during peak festival days.",
        te: "తీవ్రమైన పండుగ రోజులలో ప్రభుత్వ పుష్కరాల విధి అధికారుల కోసం రిజర్వ్ చేయబడింది.",
        hi: "त्योहार के पीक दिनों में सरकारी पुष्करालु ड्यूटी अधिकारियों के लिए आरक्षित।"
      }),
      false
    ]);
  });

  console.log('[SeedNearbyPlaces] Seed completed successfully.');
}

// Auto execute if invoked directly via tsx
if (process.argv[1]?.endsWith('004_seed_nearby_places.ts')) {
  seedNearbyPlaces()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SeedNearbyPlaces] Seed failed:', err);
      process.exit(1);
    });
}
