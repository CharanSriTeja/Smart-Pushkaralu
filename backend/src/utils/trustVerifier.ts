import { LocalizedString, RecordStatus } from '../types/ghats.js';

export const PUSHKARALU_SAFETY_DISCLAIMER: LocalizedString = {
  en: "⚠️ Disclaimer: River currents, bathing safety, water levels, and crowd densities can change suddenly during Godavari Pushkaralu. Always adhere to on-site instructions from police personnel, NDRF teams, and district authorities.",
  te: "⚠️ గమనిక: గోదావరి పుష్కరాల సమయంలో నదీ ప్రవాహం, స్నాన భద్రత, నీటి మట్టాలు మరియు రద్దీ పరిస్థితులు వేగంగా మారవచ్చు. ఘాట్ వద్ద విధుల్లో ఉన్న పోలీస్, ఎన్‌డిఆర్‌ఎఫ్ మరియు జిల్లా అధికారుల సూచనలను తప్పక పాటించండి.",
  hi: "⚠️ अस्वीकरण: गोदावरी पुष्करालु के दौरान नदी का बहाव, स्नान सुरक्षा, जल स्तर और भीड़ की स्थिति अचानक बदल सकती है। घाट पर तैनात पुलिस, एनडीआरएफ और जिला प्रशासन के निर्देशों का सदैव पालन करें।"
};

/**
 * List of recognized official government domains for Andhra Pradesh and Telangana Pushkaralu administrations.
 */
const OFFICIAL_GOVT_DOMAINS = [
  'gov.in',
  'nic.in',
  'ap.gov.in',
  'telangana.gov.in',
  'eastgodavari.ap.gov.in',
  'westgodavari.ap.gov.in',
  'konaseema.ap.gov.in',
  'bhadradri.telangana.gov.in',
  'jagtial.telangana.gov.in',
  'nirmal.telangana.gov.in',
  'jayashankar.telangana.gov.in',
  'police.gov.in',
  'ndrf.gov.in',
];

/**
 * Checks if a given URL is a legitimate official government or district portal.
 */
export function isOfficialGovernmentUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.toLowerCase();

    return OFFICIAL_GOVT_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (err) {
    return false;
  }
}

/**
 * Strict Rule Enforcement:
 * "never call a ghat officially approved unless the source is an official government or district page"
 * "Never label a ghat officially approved unless record_status is officially_listed with an official source URL."
 */
export function evaluateOfficialApproval(
  recordStatus: RecordStatus,
  officialSourceUrl?: string | null
): {
  isOfficiallyApproved: boolean;
  trustLabel: LocalizedString;
  trustCode: 'OFFICIAL_APPROVED' | 'COMMUNITY_REPORTED' | 'UNVERIFIED';
} {
  const hasValidOfficialSource = isOfficialGovernmentUrl(officialSourceUrl);

  if (recordStatus === 'officially_listed' && hasValidOfficialSource) {
    return {
      isOfficiallyApproved: true,
      trustCode: 'OFFICIAL_APPROVED',
      trustLabel: {
        en: "Officially Verified by District Administration",
        te: "జిల్లా యంత్రాంగం ద్వారా అధికారికంగా ధృవీకరించబడింది",
        hi: "जिला प्रशासन द्वारा आधिकारिक रूप से सत्यापित"
      }
    };
  }

  if (recordStatus === 'reported') {
    return {
      isOfficiallyApproved: false,
      trustCode: 'COMMUNITY_REPORTED',
      trustLabel: {
        en: "Community Reported — Pending Official Inspection",
        te: "ప్రజల సమాచారం ఆధారంగా — అధికారిక పరిశీలన వేచి ఉంది",
        hi: "स्थानीय श्रद्धालुओं द्वारा सूचित — आधिकारिक सत्यापन प्रतीक्षित"
      }
    };
  }

  return {
    isOfficiallyApproved: false,
    trustCode: 'UNVERIFIED',
    trustLabel: {
      en: "Unverified Ghat — Exercise Extreme Caution",
      te: "ధృవీకరించబడని ఘాట్ — అత్యంత జాగ్రత్తగా వ్యవహరించండి",
      hi: "असत्यापित घाट — अत्यधिक सावधानी बरतें"
    }
  };
}

/**
 * Extracts a localized string in the requested language, falling back to English.
 */
export function resolveLocalizedText(
  field?: LocalizedString | null,
  lang: string = 'en'
): string {
  if (!field) return '';
  if (lang === 'te' && field.te) return field.te;
  if (lang === 'hi' && field.hi) return field.hi;
  return field.en || '';
}

