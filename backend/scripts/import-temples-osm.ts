import { query } from '../src/db/index.js';
import { ROUTING_ATTRIBUTION } from '../src/constants/attribution.js';

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'name:en'?: string;
    'name:te'?: string;
    'name:hi'?: string;
    amenity?: string;
    religion?: string;
    [key: string]: string | undefined;
  };
}

// Curated Godavari Pushkaralu fallback temples along AP and Telangana
const FALLBACK_TEMPLES = [
  {
    osm_id: 'node/fallback_1',
    name: { en: 'Sri Kotilingeshwara Temple', te: 'శ్రీ కోటిలింగేశ్వర స్వామి దేవాలయం', hi: 'श्री कोटिलिंगेश्वर स्वामी मंदिर' },
    lat: 17.0035,
    lng: 81.7761,
    district: 'East Godavari',
    state: 'Andhra Pradesh'
  },
  {
    osm_id: 'node/fallback_2',
    name: { en: 'Sri Markandeya Swamy Temple', te: 'శ్రీ మార్కండేయ స్వామి దేవాలయం', hi: 'श्री मार्कंडेय स्वामी मंदिर' },
    lat: 17.0089,
    lng: 81.7738,
    district: 'East Godavari',
    state: 'Andhra Pradesh'
  },
  {
    osm_id: 'node/fallback_3',
    name: { en: 'Sri Sita Ramachandra Swamy Temple', te: 'శ్రీ సీతారామచంద్ర స్వామి దేవాలయం', hi: 'श्री सीताराम चंद्रस्वामी मंदिर' },
    lat: 17.6690,
    lng: 80.8804,
    district: 'Bhadradri Kothagudem',
    state: 'Telangana'
  },
  {
    osm_id: 'node/fallback_4',
    name: { en: 'Gnana Saraswathi Temple', te: 'శ్రీ జ్ఞాన సరస్వతి దేవాలయం', hi: 'श्री ज्ञान सरस्वती मंदिर' },
    lat: 18.8785,
    lng: 77.9547,
    district: 'Nirmal',
    state: 'Telangana'
  },
  {
    osm_id: 'node/fallback_5',
    name: { en: 'Sri Lakshmi Narasimha Swamy Temple', te: 'శ్రీ లక్ష్మీ నరసింహ స్వామి దేవాలయం', hi: 'श्री लक्ष्मी नरसिंह स्वामी मंदिर' },
    lat: 18.9567,
    lng: 79.0911,
    district: 'Jagtial',
    state: 'Telangana'
  },
  {
    osm_id: 'node/fallback_6',
    name: { en: 'Sri Kaleshwara Mukteshwara Swamy Temple', te: 'శ్రీ కాళేశ్వర ముక్తీశ్వర స్వామి దేవాలయం', hi: 'श्री कालेश्वर मुक्तेश्वर स्वामी मंदिर' },
    lat: 18.8139,
    lng: 79.9075,
    district: 'Jayashankar Bhupalpally',
    state: 'Telangana'
  },
  {
    osm_id: 'node/fallback_7',
    name: { en: 'Sri Someswara Swamy Temple', te: 'శ్రీ సోమేశ్వర స్వామి దేవాలయం', hi: 'श्री सोमेश्वर स्वामी मंदिर' },
    lat: 16.9015,
    lng: 82.0287,
    district: 'Dr. B.R. Ambedkar Konaseema',
    state: 'Andhra Pradesh'
  },
  {
    osm_id: 'node/fallback_8',
    name: { en: 'Sri Veerabhadra Swamy Temple (Pattiseema)', te: 'శ్రీ వీరభద్ర స్వామి దేవాలయం (పట్టిసీమ)', hi: 'श्री वीरभद्र स्वामी मंदिर (पट्टीसीमा)' },
    lat: 17.1558,
    lng: 81.6212,
    district: 'West Godavari',
    state: 'Andhra Pradesh'
  },
  {
    osm_id: 'node/fallback_9',
    name: { en: 'Sri Lakshmi Narasimha Swamy Temple (Antarvedi)', te: 'శ్రీ లక్ష్మీ నరసింహ స్వామి దేవాలయం (అంతర్వేది)', hi: 'श्री लक्ष्मी नरसिंह स्वामी मंदिर (अंतर्वेदी)' },
    lat: 16.3374,
    lng: 81.7339,
    district: 'Dr. B.R. Ambedkar Konaseema',
    state: 'Andhra Pradesh'
  },
  {
    osm_id: 'node/fallback_10',
    name: { en: 'Sri Bhimeswara Swamy Temple (Draksharamam)', te: 'శ్రీ భీమేశ్వర స్వామి దేవాలయం (ద్రాక్షారామం)', hi: 'श्री भीमेश्वर स्वामी मंदिर (द्राक्षारामम)' },
    lat: 16.7937,
    lng: 82.0625,
    district: 'Dr. B.R. Ambedkar Konaseema',
    state: 'Andhra Pradesh'
  }
];

async function fetchOverpassTemples(): Promise<OsmElement[]> {
  // Bounding box: south=16.2, west=77.8, north=19.5, east=82.5 (covering Godavari basin across AP and TS)
  const queryText = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="hindu"](16.2,77.8,19.5,82.5);
      way["amenity"="place_of_worship"]["religion"="hindu"](16.2,77.8,19.5,82.5);
    );
    out center tags 100;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryText)}`;
  console.log('Querying Overpass API for Hindu temples along Godavari region...');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SmartPushkaraluBot/1.0 (pushkaralu@gov.ap.in)'
      },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Overpass HTTP error: ${res.status} ${res.statusText}`);
    }

    const data: any = await res.json();
    if (data && Array.isArray(data.elements)) {
      console.log(`Successfully received ${data.elements.length} raw elements from Overpass API.`);
      return data.elements;
    }
    return [];
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`Overpass API fetch failed (${err.message}). Using curated offline fallback dataset.`);
    return [];
  }
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting OSM Temple Import (dry-run: ${isDryRun})...`);
  console.log(`Attribution: ${ROUTING_ATTRIBUTION.OSM}`);

  let elements = await fetchOverpassTemples();

  let templesToProcess: Array<{
    osm_id: string;
    name: { en: string; te?: string; hi?: string };
    lat: number;
    lng: number;
    district: string;
    state: string;
  }> = [];

  if (elements.length > 0) {
    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      const tags = el.tags || {};
      const primaryName = tags.name || tags['name:en'] || tags['name:te'];

      if (!lat || !lng || !primaryName) continue;

      // Infer state/district
      const isTelangana = lat > 17.5 && lng < 80.5;
      const state = isTelangana ? 'Telangana' : 'Andhra Pradesh';
      const district = isTelangana ? 'Telangana Godavari Region' : 'East Godavari';

      templesToProcess.push({
        osm_id: `${el.type}/${el.id}`,
        name: {
          en: tags['name:en'] || primaryName,
          te: tags['name:te'] || primaryName,
          hi: tags['name:hi'] || primaryName
        },
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        district,
        state
      });
    }
  }

  // If Overpass returned few or zero results due to network/rate limits, merge in curated fallback temples
  if (templesToProcess.length < 5) {
    console.log(`Adding ${FALLBACK_TEMPLES.length} curated Godavari pilgrimage temples...`);
    for (const fb of FALLBACK_TEMPLES) {
      if (!templesToProcess.some(t => t.osm_id === fb.osm_id)) {
        templesToProcess.push(fb);
      }
    }
  }

  console.log(`Processing ${templesToProcess.length} valid temples...`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const t of templesToProcess) {
    if (isDryRun) {
      console.log(`[DRY-RUN] Would process temple: ${t.name.en} (${t.lat}, ${t.lng}) [${t.osm_id}]`);
      inserted++;
      continue;
    }

    try {
      // Check if already exists by osm_id or near coordinates (< 50 meters)
      const existing = await query(
        `SELECT id, osm_id FROM temples 
         WHERE osm_id = $1 
            OR (lat IS NOT NULL AND lng IS NOT NULL AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 50))
         LIMIT 1`,
        [t.osm_id, t.lng, t.lat]
      );

      if (existing.rows.length > 0) {
        // Update OSM ID and coordinates precision if missing
        await query(
          `UPDATE temples 
           SET osm_id = COALESCE(osm_id, $1),
               source = COALESCE(source, 'osm'),
               coordinates_precision = COALESCE(coordinates_precision, 'approximate'),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [t.osm_id, existing.rows[0].id]
        );
        updated++;
      } else {
        await query(
          `INSERT INTO temples (
            name, lat, lng, district, state, coordinates_precision, source, osm_id, verified, active, is_verified, is_hidden
          ) VALUES ($1, $2, $3, $4, $5, 'approximate', 'osm', $6, false, true, false, false)`,
          [JSON.stringify(t.name), t.lat, t.lng, t.district, t.state, t.osm_id]
        );
        inserted++;
      }
    } catch (err: any) {
      console.error(`Error processing temple ${t.name.en}:`, err.message);
      skipped++;
    }
  }

  console.log('\n--- OSM Temple Import Summary ---');
  console.log(`Total valid:  ${templesToProcess.length}`);
  console.log(`Inserted:     ${inserted}`);
  console.log(`Updated:      ${updated}`);
  console.log(`Skipped/Err:  ${skipped}`);
  console.log(`Data Source:  OpenStreetMap (${ROUTING_ATTRIBUTION.OSM})`);
  console.log('--------------------------------\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during temple import:', err);
  process.exit(1);
});

