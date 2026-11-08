import { query } from '../src/db/index.js';
import { routingService } from '../src/services/routing/routing.service.js';
import { ROUTING_ATTRIBUTION } from '../src/constants/attribution.js';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const maxToCompute = limitArg ? parseInt(limitArg.split('=')[1], 10) : (process.argv.includes('--all') ? 999999 : 20);

  console.log('--- Starting Standard Routes Precomputation ---');
  console.log(`Provider: ${routingService.getProviderName()}`);
  console.log(`Attribution: ${ROUTING_ATTRIBUTION.OSM}`);
  console.log(`Max routes to compute in this run: ${maxToCompute}`);

  // 1. Fetch active origins
  const originsRes = await query(
    `SELECT id, name, lat, lng FROM route_origins WHERE active = true ORDER BY sort_order ASC`
  );
  const origins = originsRes.rows;
  console.log(`Found ${origins.length} active route origins.`);

  // 2. Fetch default ghat access points
  const accessRes = await query(
    `SELECT id, ghat_id, name, lat, lng 
     FROM ghat_access_points 
     WHERE active = true AND is_default = true`
  );
  const accessPoints = accessRes.rows;
  console.log(`Found ${accessPoints.length} default ghat access points.`);

  if (origins.length === 0 || accessPoints.length === 0) {
    console.log('No origins or access points found. Exiting.');
    process.exit(0);
  }

  const modes: Array<'car' | 'walk'> = ['car', 'walk'];
  let totalComputed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const origin of origins) {
    const originName = typeof origin.name === 'string' ? JSON.parse(origin.name).en : origin.name?.en;

    for (const ap of accessPoints) {
      const apName = typeof ap.name === 'string' ? JSON.parse(ap.name).en : ap.name?.en;

      for (const mode of modes) {
        try {
          // Check if already computed and not stale
          const existing = await query(
            `SELECT id, stale, computed_at FROM standard_routes 
             WHERE origin_id = $1 AND access_point_id = $2 AND mode = $3`,
            [origin.id, ap.id, mode]
          );

          if (existing.rows.length > 0 && !existing.rows[0].stale) {
            totalSkipped++;
            continue;
          }

          console.log(`Computing [${mode}] route: ${originName} -> ${apName}...`);

          const originCoord = { lat: Number(origin.lat), lng: Number(origin.lng) };
          const destCoord = { lat: Number(ap.lat), lng: Number(ap.lng) };

          const routeResult = await routingService.getRoute(
            {
              origin: originCoord,
              destination: destCoord,
              mode,
            },
            ap.ghat_id
          );

          if ('degraded' in routeResult && routeResult.degraded) {
            console.warn(`Got degraded route for ${originName} -> ${apName}`);
            totalErrors++;
            continue;
          }

          const res = routeResult as any;
          await query(
            `INSERT INTO standard_routes (
              origin_id, access_point_id, mode, distance_m, duration_s, polyline, provider, computed_at, stale
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, false)
            ON CONFLICT (origin_id, access_point_id, mode)
            DO UPDATE SET
              distance_m = EXCLUDED.distance_m,
              duration_s = EXCLUDED.duration_s,
              polyline = EXCLUDED.polyline,
              provider = EXCLUDED.provider,
              computed_at = CURRENT_TIMESTAMP,
              stale = false,
              updated_at = CURRENT_TIMESTAMP`,
            [
              origin.id,
              ap.id,
              mode,
              res.distanceMeters,
              res.durationSeconds,
              res.encodedPolyline,
              res.providerName,
            ]
          );

          totalComputed++;

          if (totalComputed >= maxToCompute) {
            console.log(`Reached limit of ${maxToCompute} routes. Stopping batch.`);
            break;
          }

          // Polite throttle delay to strictly respect API limits (1.2s delay = max 50 req/min)
          await sleep(1200);
        } catch (err: any) {
          console.error(`Error computing route ${originName} -> ${apName} (${mode}):`, err.message);
          totalErrors++;
        }
      }
      if (totalComputed >= maxToCompute) break;
    }
    if (totalComputed >= maxToCompute) break;
  }

  console.log('\n--- Precomputation Summary ---');
  console.log(`Total Computed: ${totalComputed}`);
  console.log(`Total Skipped:  ${totalSkipped}`);
  console.log(`Total Errors:   ${totalErrors}`);
  console.log('------------------------------\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during precomputation:', err);
  process.exit(1);
});
