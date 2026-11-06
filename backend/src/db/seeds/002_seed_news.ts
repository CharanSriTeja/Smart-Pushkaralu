import { query, pool } from '../index.js';

export async function seedNews() {
  console.log('[Seed] Seeding sample Godavari Pushkaralu 2027 official news bulletins...');

  // Get some ghat IDs if available
  const ghatsRes = await query<{ id: string; name: any }>('SELECT id, name FROM ghats LIMIT 5');
  const ghatIds = ghatsRes.rows.map((g) => g.id);

  // Check if news already populated
  const existingRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM news_posts');
  if (parseInt(existingRes.rows[0]?.count || '0', 10) > 0) {
    console.log('[Seed] news_posts table already has records. Skipping initial seeding.');
    return;
  }

  const bulletins = [
    {
      title: {
        en: '🚨 URGENT: High River Current Alert near Kotilingala Ghat',
        te: '🚨 అత్యవసరం: కోటిలింగాల ఘాట్ వద్ద అధిక నదీ ప్రవాహ హెచ్చరిక',
        hi: '🚨 अति आवश्यक: कोटालिंगाला घाट के निकट नदी में तेज बहाव की चेतावनी',
      },
      content: {
        en: 'Due to upstream discharge from Sir Arthur Cotton Barrage, river currents near Kotilingala and Pushkar ghats have temporarily increased. Deep-water bathing is strictly prohibited. Pilgrims are urged to remain within safety railings and follow instructions from NDRF personnel.',
        te: 'సర్ ఆర్థర్ కాటన్ బ్యారేజ్ ఎగువ నుండి విడుదలైన నీటి కారణంగా కోటిలింగాల మరియు పుష్కర ఘాట్ల వద్ద నదీ ప్రవాహం పెరిగింది. లోతైన నీటిలో స్నానం చేయడం పూర్తిగా నిషేధించబడింది. భక్తులు భద్రతా రెయిలింగ్ పరిధిలోనే ఉండాలని, ఎన్డీఆర్ఎఫ్ సిబ్బంది సూచనలను పాటించాలని కోరడమైనది.',
        hi: 'सर आर्थर कॉटन बैराज से पानी छोड़े जाने के कारण कोटालिंगाला और पुष्कर घाटों के पास नदी का बहाव बढ़ गया है। गहरे पानी में स्नान पूर्णतः प्रतिबंधित है। श्रद्धालु सुरक्षा रेलिंग के भीतर रहें और एनडीआरएफ कर्मियों के निर्देशों का पालन करें।',
      },
      summary: {
        en: 'High water velocity near Kotilingala. Deep bathing restricted; adhere to NDRF safety lines.',
        te: 'కోటిలింగాల వద్ద తీవ్ర ప్రవాహం. లోతు స్నానం నిషేధం; భద్రతా పరిధిలోనే స్నానం చేయండి.',
        hi: 'कोटालिंगाला के पास तेज बहाव। गहरे स्नान पर रोक; सुरक्षा रेलिंग में ही रहें।',
      },
      category: 'urgent',
      priority: 'urgent',
      ghat_ids: ghatIds.slice(0, 2),
      source_url: 'https://eastgodavari.ap.gov.in/alerts/river-flow-safety',
      is_official: true,
      is_pinned: true,
      publish_status: 'published',
      published_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
    {
      title: {
        en: 'Free Medical Camps & Ambulance Dispatch Active Across All Major Ghats',
        te: 'అన్ని ప్రధాన ఘాట్ల వద్ద ఉచిత వైద్య శిబిరాలు మరియు అంబులెన్స్ సేవలు ప్రారంభం',
        hi: 'सभी प्रमुख घाटों पर निःशुल्क चिकित्सा शिविर एवं एम्बुलेंस सेवाएं शुरू',
      },
      content: {
        en: 'State Health and Family Welfare Department has operationalized 24x7 medical triage tents equipped with emergency oxygen, first aid kits, ORS packets, and dedicated doctors at Rajahmundry, Kovvur, and Bhadrachalam bathing sites.',
        te: 'రాష్ట్ర వైద్య ఆరోగ్య శాఖ ఆధ్వర్యంలో రాజమండ్రి, కొవ్వూరు మరియు భద్రాచలం స్నాన ఘాట్ల వద్ద 24 గంటల అత్యవసర ఆక్సిజన్, ప్రథమ చికిత్స, ఓఆర్ఎస్ మరియు వైద్యులతో కూడిన ఉచిత వైద్య శిబిరాలు అందుబాటులో ఉన్నాయి.',
        hi: 'राज्य स्वास्थ्य विभाग द्वारा राजमुंदरी, कोव्वूर और भद्राचलम घाटों पर 24 घंटे ऑक्सीजन, प्राथमिक चिकित्सा, ओआरएस और चिकित्सकों से सुसज्जित निःशुल्क चिकित्सा शिविर चालू कर दिए गए हैं।',
      },
      summary: {
        en: '24x7 free medical triage and first-aid centers deployed at all major Godavari bathing ghats.',
        te: 'అన్ని ప్రధాన గోదావరి ఘాట్ల వద్ద 24 గంటల ఉచిత వైద్య శిబిరాలు మరియు ప్రథమ చికిత్స కేంద్రాలు.',
        hi: 'सभी प्रमुख घाटों पर 24 घंटे निःशुल्क चिकित्सा एवं प्राथमिक उपचार केंद्र उपलब्ध।',
      },
      category: 'facility',
      priority: 'high',
      ghat_ids: ghatIds,
      source_url: 'https://ap.gov.in/health/pushkaralu-camps',
      is_official: true,
      is_pinned: false,
      publish_status: 'published',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hrs ago
      expires_at: null,
    },
    {
      title: {
        en: 'Rajahmundry Rail Bridge & River Road Traffic Diversion Advisory',
        te: 'రాజమండ్రి రైలు వంతెన మరియు నదీ తీర మార్గం ట్రాఫిక్ మళ్లింపు సలహా',
        hi: 'राजमुंदरी रेल पुल एवं नदी मार्ग यातायात डायवर्जन परामर्श',
      },
      content: {
        en: 'District Police Administration has designated one-way pedestrian corridors connecting the Railway Station to Pushkar Ghat. Private vehicles are requested to park at the Arts College ground.',
        te: 'జిల్లా పోలీసు యంత్రాంగం రైల్వే స్టేషన్ నుండి పుష్కర ఘాట్ వరకు వన్-వే పాదచారుల మార్గాలను ఏర్పాటు చేసింది. ప్రైవేట్ వాహనాలు ఆర్ట్స్ కాలేజీ మైదానంలో పార్క్ చేయాలని కోరడమైనది.',
        hi: 'जिला पुलिस प्रशासन ने रेलवे स्टेशन से पुष्कर घाट तक केवल पैदल यात्रियों के लिए एकतरफा गलियारा बनाया है। निजी वाहन आर्ट्स कॉलेज ग्राउंड में पार्क करें।',
      },
      summary: {
        en: 'One-way pedestrian flow active from Railway Station to Pushkar Ghat. Arts College parking open.',
        te: 'రైల్వే స్టేషన్ నుండి పుష్కర ఘాట్ వరకు పాదచారుల వన్-వే మార్గం. ఆర్ట్స్ కాలేజ్ పార్కింగ్ అందుబాటులో ఉంది.',
        hi: 'रेलवे स्टेशन से पुष्कर घाट तक एकतरफा पैदल मार्ग। आर्ट्स कॉलेज में पार्किंग उपलब्ध।',
      },
      category: 'traffic',
      priority: 'normal',
      ghat_ids: ghatIds.slice(0, 1),
      source_url: 'https://police.gov.in/advisories/pushkaralu-traffic',
      is_official: true,
      is_pinned: false,
      publish_status: 'published',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      expires_at: null,
    },
    {
      title: {
        en: 'Weather Forecast: Pleasant Morning Weather Expected for Holy Snanam',
        te: 'వాతావరణ నివేదిక: పుణ్యస్నానాలకు అనుకూలమైన ఉదయపు వాతావరణం',
        hi: 'मौसम पूर्वानुमान: पवित्र स्नान के लिए सुबह का मौसम अनुकूल रहने की संभावना',
      },
      content: {
        en: 'IMD forecasts mild morning temperatures between 22°C and 28°C with gentle breezes along the Godavari basin. Afternoon hours may experience moderate humidity; pilgrims are advised to stay hydrated.',
        te: 'గోదావరి పరివాహక ప్రాంతంలో ఉదయం 22°C నుండి 28°C వరకు ఆహ్లాదకరమైన వాతావరణం ఉంటుందని వాతావరణ శాఖ తెలిపింది. మధ్యాహ్నం వేళల్లో తగినంత నీరు తాగాలని సూచించడమైనది.',
        hi: 'मौसम विभाग के अनुसार गोदावरी बेसिन में सुबह 22°C से 28°C के बीच सुहावना मौसम रहेगा। दोपहर में पर्याप्त पानी पीने की सलाह दी जाती है।',
      },
      summary: {
        en: 'Comfortable morning bathing weather expected. Hydrate adequately during peak sunshine hours.',
        te: 'ఉదయం స్నానానికి ఆహ్లాదకరమైన వాతావరణం. మధ్యాహ్నం వేళల్లో తగినంత నీరు త్రాగండి.',
        hi: 'सुबह स्नान के लिए अनुकूल मौसम। दोपहर में पर्याप्त पानी पिएं।',
      },
      category: 'weather',
      priority: 'low',
      ghat_ids: [],
      source_url: 'https://nic.in/weather/godavari',
      is_official: true,
      is_pinned: false,
      publish_status: 'published',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      expires_at: null,
    },
  ];

  for (const b of bulletins) {
    await query(
      `INSERT INTO news_posts (
        title, content, summary, category, priority, ghat_ids, source_url,
        is_official, is_pinned, publish_status, published_at, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        JSON.stringify(b.title),
        JSON.stringify(b.content),
        JSON.stringify(b.summary),
        b.category,
        b.priority,
        b.ghat_ids,
        b.source_url,
        b.is_official,
        b.is_pinned,
        b.publish_status,
        b.published_at,
        b.expires_at,
      ]
    );
  }

  console.log(`[Seed] Successfully seeded ${bulletins.length} official news bulletins.`);
}

if (process.argv[1]?.includes('002_seed_news.ts')) {
  seedNews()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] Error seeding news:', err);
      await pool.end();
      process.exit(1);
    });
}

