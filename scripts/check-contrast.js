/**
 * scripts/check-contrast.js
 * Validates WCAG AA contrast ratios for design tokens in Smart Pushkaralu 2027.
 *
 * Rules:
 * - Normal text (body >= 14sp, 16sp): minimum 4.5:1
 * - Large/bold text (>= 18sp bold): minimum 3.0:1
 * - UI components / graphical controls: minimum 3.0:1
 */

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function sRgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

const tokens = {
  bg: {
    white: '#FFFFFF',
    warmWhite: '#FFFBF7',
    orange50: '#FFF7ED',
    orange100: '#FFEDD5',
    orange500: '#F97316',
    orange600: '#EA580C',
    orange700: '#C2410C',
    sosRed: '#B91C1C',
    greenLight: '#F0FDF4',
    amberLight: '#FFFBEB',
    grayLight: '#F3F4F6',
  },
  text: {
    primary: '#1C1917',
    muted: '#57534E',
    white: '#FFFFFF',
    orange700: '#C2410C',
    orange600: '#EA580C',
    sosRed: '#B91C1C',
    greenText: '#15803D',
    amberText: '#92400E',
    grayText: '#374151',
  },
  border: {
    neutral: '#E7E5E4',
    orangeBorder: '#FDBA74',
    greenBorder: '#BBF7D0',
    amberBorder: '#FDE68A',
  }
};

// Required pairings to check
const pairs = [
  // 1. Text Primary on Light Backgrounds (Required >= 4.5)
  { name: 'Text Primary on White', fg: tokens.text.primary, bg: tokens.bg.white, minRatio: 4.5, isLargeText: false },
  { name: 'Text Primary on Warm White', fg: tokens.text.primary, bg: tokens.bg.warmWhite, minRatio: 4.5, isLargeText: false },
  { name: 'Text Primary on Orange 50', fg: tokens.text.primary, bg: tokens.bg.orange50, minRatio: 4.5, isLargeText: false },
  { name: 'Text Primary on Orange 100', fg: tokens.text.primary, bg: tokens.bg.orange100, minRatio: 4.5, isLargeText: false },

  // 2. Text Muted on Light Backgrounds (Required >= 4.5)
  { name: 'Text Muted on White', fg: tokens.text.muted, bg: tokens.bg.white, minRatio: 4.5, isLargeText: false },
  { name: 'Text Muted on Warm White', fg: tokens.text.muted, bg: tokens.bg.warmWhite, minRatio: 4.5, isLargeText: false },
  { name: 'Text Muted on Orange 50', fg: tokens.text.muted, bg: tokens.bg.orange50, minRatio: 4.5, isLargeText: false },

  // 3. Orange elements on White/Warm White
  { name: 'Orange 700 Text on White', fg: tokens.text.orange700, bg: tokens.bg.white, minRatio: 4.5, isLargeText: false },
  { name: 'Orange 700 Text on Warm White', fg: tokens.text.orange700, bg: tokens.bg.warmWhite, minRatio: 4.5, isLargeText: false },
  { name: 'Orange 700 Text on Orange 50', fg: tokens.text.orange700, bg: tokens.bg.orange50, minRatio: 4.5, isLargeText: false },

  // 4. White text on Primary / SOS Backgrounds
  { name: 'White Text on Orange 700 (Primary Button/Header)', fg: tokens.text.white, bg: tokens.bg.orange700, minRatio: 4.5, isLargeText: false },
  { name: 'White Text on SOS Red (#B91C1C)', fg: tokens.text.white, bg: tokens.bg.sosRed, minRatio: 4.5, isLargeText: false },
  { name: 'White Text on Orange 600 (Large text >= 18sp bold)', fg: tokens.text.white, bg: tokens.bg.orange600, minRatio: 3.0, isLargeText: true },

  // 5. Dark text on Orange 500
  { name: 'Text Primary on Orange 500', fg: tokens.text.primary, bg: tokens.bg.orange500, minRatio: 4.5, isLargeText: false },

  // 6. SOS Red text on light backgrounds
  { name: 'SOS Red on White', fg: tokens.text.sosRed, bg: tokens.bg.white, minRatio: 4.5, isLargeText: false },
  { name: 'SOS Red on Warm White', fg: tokens.text.sosRed, bg: tokens.bg.warmWhite, minRatio: 4.5, isLargeText: false },

  // 7. Status Badges (Text on Badge Background)
  { name: 'Green Text on Green Light (Status: Low Crowd / Open)', fg: tokens.text.greenText, bg: tokens.bg.greenLight, minRatio: 4.5, isLargeText: false },
  { name: 'Amber Text on Amber Light (Status: Medium / Restricted)', fg: tokens.text.amberText, bg: tokens.bg.amberLight, minRatio: 4.5, isLargeText: false },
  { name: 'Gray Text on Gray Light (Status: Inactive / Unknown)', fg: tokens.text.grayText, bg: tokens.bg.grayLight, minRatio: 4.5, isLargeText: false },
];

console.log('=== WCAG AA Contrast Compliance Audit ===\n');

let failed = 0;
let passed = 0;

for (const pair of pairs) {
  const ratio = getContrastRatio(pair.fg, pair.bg);
  const ok = ratio >= pair.minRatio;
  const statusStr = ok ? '[PASS]' : '[FAIL]';
  const ratioStr = ratio.toFixed(2) + ':1';
  const targetStr = `(Req >= ${pair.minRatio}:1)`;

  console.log(`${statusStr} ${pair.name.padEnd(55)} | ${pair.fg} on ${pair.bg} | ${ratioStr.padEnd(8)} ${targetStr}`);
  if (ok) {
    passed++;
  } else {
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed out of ${pairs.length} pairs.`);

if (failed > 0) {
  console.error('\nContrast check failed! Ensure all pairs meet WCAG AA standards.');
  process.exit(1);
} else {
  console.log('\nAll token contrast checks passed WCAG AA requirements.');
  process.exit(0);
}
