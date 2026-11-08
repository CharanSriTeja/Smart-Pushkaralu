#!/usr/bin/env node

/**
 * Automated Verification Script for Smart Pushkaralu 2027
 * Runs all validation gates in sequence:
 *  1. WCAG AA Contrast Check (All token pairs)
 *  2. i18n Translation Key Parity (en, te, hi)
 *  3. Admin Build & TypeScript Check
 *  4. Mobile TypeScript Check
 *  5. Backend Core & Integration Tests (Routing, SOS, Issues, Places)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function logStep(stepNum, name) {
  console.log(`\n======================================================`);
  console.log(`[STEP ${stepNum}] ${name}`);
  console.log(`======================================================`);
}

function runCommand(cmd, cwd = rootDir) {
  console.log(`> ${cmd} (in ${path.relative(rootDir, cwd) || '.'})`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
    return true;
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    return false;
  }
}

let passedSteps = 0;
let totalSteps = 5;

// Step 1: Contrast Check
logStep(1, 'WCAG AA Design Token Contrast Audit');
const contrastOk = runCommand('node scripts/check-contrast.js');
if (!contrastOk) {
  console.error('❌ Contrast check failed.');
  process.exit(1);
}
passedSteps++;

// Step 2: Translation Parity Check
logStep(2, 'i18n Localization Parity Audit (en, te, hi)');
const enPath = path.join(rootDir, 'mobile', 'src', 'i18n', 'en.json');
const tePath = path.join(rootDir, 'mobile', 'src', 'i18n', 'te.json');
const hiPath = path.join(rootDir, 'mobile', 'src', 'i18n', 'hi.json');

try {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const te = JSON.parse(fs.readFileSync(tePath, 'utf8'));
  const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

  const getKeys = (obj, prefix = '') => {
    let keys = [];
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        keys = keys.concat(getKeys(v, full));
      } else {
        keys.push(full);
      }
    }
    return keys;
  };

  const enKeys = new Set(getKeys(en));
  const teKeys = new Set(getKeys(te));
  const hiKeys = new Set(getKeys(hi));

  let missingTe = [...enKeys].filter((k) => !teKeys.has(k));
  let missingHi = [...enKeys].filter((k) => !hiKeys.has(k));

  if (missingTe.length > 0 || missingHi.length > 0) {
    console.error(`❌ Key parity error! Missing in te: ${missingTe.length}, Missing in hi: ${missingHi.length}`);
    process.exit(1);
  }

  console.log(`[PASS] 100% key parity across ${enKeys.size} keys in en.json, te.json, hi.json`);
  passedSteps++;
} catch (err) {
  console.error('❌ Translation check failed:', err);
  process.exit(1);
}

// Step 3: Admin Build & Typecheck
logStep(3, 'Admin Panel Typecheck & Production Build');
const adminOk = runCommand('npm run build', path.join(rootDir, 'admin'));
if (!adminOk) {
  console.error('❌ Admin build failed.');
  process.exit(1);
}
passedSteps++;

// Step 4: Mobile Typecheck
logStep(4, 'Mobile Project TypeScript Validation');
const mobileTscOk = runCommand('node_modules\\.bin\\tsc --noEmit', path.join(rootDir, 'mobile'));
if (!mobileTscOk) {
  console.error('❌ Mobile TypeScript compilation failed.');
  process.exit(1);
}
passedSteps++;

// Step 5: Backend Integration Tests
logStep(5, 'Backend Core Functionality & Integration Tests');
const backendTestsOk = runCommand(
  'npx vitest run tests/routing.test.ts tests/sos.test.ts tests/nearby-places.test.ts tests/issues.test.ts',
  path.join(rootDir, 'backend')
);
if (!backendTestsOk) {
  console.error('❌ Backend integration tests failed.');
  process.exit(1);
}
passedSteps++;

// Summary
console.log(`\n======================================================`);
console.log(`🎉 ALL VERIFICATION CHECKS PASSED (${passedSteps}/${totalSteps})`);
console.log(`======================================================\n`);
process.exit(0);
