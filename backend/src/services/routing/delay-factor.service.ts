import { query } from '../../db/index.js';
import { LocalizedText } from '../../types/routes.js';

export interface AppliedDelayFactor {
  factor: number;
  label?: LocalizedText;
  ghatId?: string | null;
}

export async function getActiveDelayFactor(ghatId?: string): Promise<AppliedDelayFactor> {
  const now = new Date().toISOString();

  // 1. Check for active ghat-specific delay factor
  if (ghatId) {
    const res = await query(
      `SELECT factor, label, ghat_id 
       FROM ghat_delay_factors 
       WHERE active = true 
         AND ghat_id = $1 
         AND starts_at <= $2 
         AND ends_at >= $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [ghatId, now]
    );

    if (res.rows.length > 0) {
      return {
        factor: Number(res.rows[0].factor) || 1.0,
        label: typeof res.rows[0].label === 'string' ? JSON.parse(res.rows[0].label) : res.rows[0].label,
        ghatId: res.rows[0].ghat_id,
      };
    }
  }

  // 2. Check for active global delay factor
  const globalRes = await query(
    `SELECT factor, label 
     FROM ghat_delay_factors 
     WHERE active = true 
       AND ghat_id IS NULL 
       AND starts_at <= $1 
       AND ends_at >= $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [now]
  );

  if (globalRes.rows.length > 0) {
    return {
      factor: Number(globalRes.rows[0].factor) || 1.0,
      label: typeof globalRes.rows[0].label === 'string' ? JSON.parse(globalRes.rows[0].label) : globalRes.rows[0].label,
      ghatId: null,
    };
  }

  // 3. Fallback to settings table 'routes.default_delay_factor'
  try {
    const settingRes = await query(
      `SELECT value FROM settings WHERE key = 'routes.default_delay_factor' LIMIT 1`
    );
    if (settingRes.rows.length > 0) {
      const val = parseFloat(settingRes.rows[0].value);
      if (!isNaN(val) && val > 0) {
        return {
          factor: val,
          label: { en: 'Pushkaralu Crowd Estimate', te: 'పుష్కరాల రద్దీ అంచనా', hi: 'पुष्करालु भीड़ अनुमान' },
          ghatId: null,
        };
      }
    }
  } catch {
    // Ignore if settings table not ready
  }

  return { factor: 1.0, ghatId: null };
}

