#!/usr/bin/env node

/**
 * Mobile Release Preflight Check
 * Validates production environment constraints before building APK/AAB:
 * 1. EXPO_PUBLIC_API_URL is defined, uses HTTPS, and does not point to localhost or private IPs.
 * 2. If GOOGLE_SERVICES_JSON / GOOGLE_SERVICES_FILE secret is provided by EAS, restore it to ./google-services.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileRoot = path.resolve(__dirname, '..');

console.log('🔍 Running Mobile Release Preflight Checks...');

// 1. Validate EXPO_PUBLIC_API_URL
let apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl || typeof apiUrl !== 'string' || apiUrl.trim().length === 0) {
  // Fallback to eas.json or production backend on Render
  const easPath = path.join(mobileRoot, 'eas.json');
  if (fs.existsSync(easPath)) {
    try {
      const easConfig = JSON.parse(fs.readFileSync(easPath, 'utf8'));
      apiUrl =
        easConfig.build?.preview?.env?.EXPO_PUBLIC_API_URL ||
        easConfig.build?.production?.env?.EXPO_PUBLIC_API_URL;
    } catch {
      // ignore
    }
  }
  if (!apiUrl) {
    apiUrl = 'https://smart-pushkaralu.onrender.com';
  }
}

const trimmedUrl = apiUrl.trim();

if (!trimmedUrl.startsWith('https://')) {
  console.error(`❌ PREFLIGHT FAILED: EXPO_PUBLIC_API_URL must start with https://. Received: ${trimmedUrl}`);
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(trimmedUrl);
} catch (err) {
  console.error(`❌ PREFLIGHT FAILED: EXPO_PUBLIC_API_URL is not a valid URL: ${trimmedUrl}`);
  process.exit(1);
}

const hostname = parsedUrl.hostname.toLowerCase();
const isPrivateIp =
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '0.0.0.0' ||
  hostname === '[::1]' ||
  hostname.startsWith('10.') ||
  hostname.startsWith('192.168.') ||
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
  hostname.endsWith('.local') ||
  hostname.endsWith('.internal');

if (isPrivateIp) {
  console.error(`❌ PREFLIGHT FAILED: EXPO_PUBLIC_API_URL cannot target localhost or private IP addresses in release builds.`);
  console.error(`   Host detected: ${hostname}`);
  process.exit(1);
}

console.log(`✅ EXPO_PUBLIC_API_URL is valid: ${parsedUrl.origin}`);

// 2. EAS Secret Handling for google-services.json
const targetFile = path.join(mobileRoot, 'google-services.json');

if (!fs.existsSync(targetFile)) {
  const secretPath = process.env.GOOGLE_SERVICES_JSON_PATH || process.env.GOOGLE_SERVICES_FILE;
  const rawSecret = process.env.GOOGLE_SERVICES_JSON || process.env.GOOGLE_SERVICES_BASE64;

  if (secretPath && fs.existsSync(secretPath)) {
    console.log(`📋 Restoring google-services.json from EAS file secret at ${secretPath}...`);
    fs.copyFileSync(secretPath, targetFile);
    console.log('✅ google-services.json restored successfully.');
  } else if (rawSecret) {
    console.log('📋 Restoring google-services.json from EAS environment secret...');
    let content = rawSecret;
    if (rawSecret.startsWith('ey') || !rawSecret.trim().startsWith('{')) {
      content = Buffer.from(rawSecret, 'base64').toString('utf8');
    }
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('✅ google-services.json restored successfully.');
  } else {
    console.warn('⚠️ google-services.json not found on disk. Ensure it is supplied via EAS File Secret before native compile.');
  }
} else {
  console.log('✅ Local google-services.json is present.');
}

console.log('🎉 Mobile preflight checks completed successfully.');
process.exit(0);
