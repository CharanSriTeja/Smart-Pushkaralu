# Smart Pushkaralu 2027: Manual & Field QA Checklist

This document details verification steps for hardware, telecommunications, offline states, and OS-specific behavior that cannot be fully validated through headless automated tests.

---

## 1. Physical Device & Telecom Testing

### 1.1 Real SMS Webhook & Delivery (Module 7: Emergency SOS)
- [ ] **Test Setup:** Configure Karix / Twilio production SMS Gateway webhook to point to `POST /v1/sos/sms-webhook`.
- [ ] **Action:** Send an SMS containing `SOS MED KOTILINGALA` from a feature phone (no smartphone / 2G network) to the official helpline number.
- [ ] **Verification:**
  1. Verify carrier delivery receipt.
  2. Confirm `sos_alerts` row is created with `channel = 'sms'`, `type = 'medical'`.
  3. Verify automated return SMS is received on the user's phone with 112 guidance and tracking URL.
  4. Confirm audio/visual alert flashes on the Admin Command Center (`/sos`) within < 1 second via WebSocket.

### 1.2 FCM Push Notification Delivery on Physical Android & iOS Devices
- [ ] **Test Setup:** Install production release build on:
  - Budget Android device (e.g., Android 10/11 Go edition with 2GB RAM).
  - High-end Android device (Android 14+ with notification permission dialog).
  - Physical iPhone (iOS 16+ with APNs certificate).
- [ ] **Action:** Admin publishes an urgent advisory from Admin Panel (`/news`) targeting topic `news_urgent`.
- [ ] **Verification:**
  1. Notification appears in system notification shade while app is in background.
  2. Notification appears when device is locked.
  3. Sound and vibration trigger according to `pushkaralu_alerts` MAX importance channel.
  4. Tapping notification opens the specific news item (`/(app)/news/[id]`).

---

## 2. Network Resilience & Mid-Flow Disconnection

### 2.1 Airplane Mode During Emergency SOS
- [ ] **Action:** On the SOS screen (`/(app)/sos`), tap "Medical Emergency", initiating the 3-second countdown. Immediately toggle Airplane Mode ON before countdown reaches 0.
- [ ] **Verification:**
  1. Countdown completes without freezing or crashing.
  2. Location falls back to last cached GPS or displays prompt to call 112 directly.
  3. Prominent dial button for **112** remains interactive and one-tap callable.
  4. App queues or stores alert locally and notifies pilgrim that 112 should be dialed immediately.

### 2.2 Offline Browsing & Cache Validation (Ghats & News)
- [ ] **Action:** Open the app while connected to Wi-Fi/4G. Browse Ghats directory and News. Turn on Airplane Mode. Force-kill and restart the app.
- [ ] **Verification:**
  1. App loads without white screen or unhandled promise rejection.
  2. Amber banner displays: *"You are offline. Showing cached data."*
  3. Cached list of ghats, safety status, and contacts are visible.
  4. Pull-to-refresh displays graceful offline warning without erasing cached data.

### 2.3 Network Drop During Issue / Grievance Submission
- [ ] **Action:** Fill in grievance form with a photo. Tap "Submit Issue". Disable network during upload.
- [ ] **Verification:**
  1. App displays clear retry prompt: *"Network unavailable. Please retry when connection is restored."*
  2. Selected photo and entered description are preserved in the form state without data loss.

---

## 3. Hardware, Camera & Low-Memory Behavior

### 3.1 EXIF Metadata Stripping & Camera Capture
- [ ] **Action:** Take a live photo with location tagging enabled in native camera. Upload via Grievance screen (`/(app)/issues/report`).
- [ ] **Verification:**
  1. Inspect uploaded image file on the backend (`/uploads/issues/...`).
  2. Run `exiftool` or metadata inspector: confirm GPS tags, camera model, and personal EXIF metadata are completely stripped.
  3. Image dimensions are resized (max 1920x1080) and file size is optimized (< 2MB).

### 3.2 Low-Memory App Lifecycle (Android LMK / iOS Background Kill)
- [ ] **Action:** Open Smart Pushkaralu app. Navigate to Ghat details. Switch to memory-intensive apps (Camera, YouTube 4K, 3D Game) until OS reclaims memory. Switch back to Pushkaralu.
- [ ] **Verification:**
  1. App resumes smoothly without crash.
  2. User authentication and guest state are preserved from `expo-secure-store`.
  3. Selected language (Telugu / English / Hindi) remains active.

---

## 4. Multilingual & Accessibility Field Audit

- [ ] **Telugu Font Rendering:** Inspect all screens on low-end Android devices to verify Telugu glyphs render cleanly without box characters (tofu `[]`).
- [ ] **Hindi Font Rendering:** Verify Devanagari conjuncts and matras display correctly in emergency banners and ghat directions.
- [ ] **Screen Reader (TalkBack / VoiceOver):**
  - Verify SOS button announces: *"Emergency SOS, double tap to open emergency dispatch options"*.
  - Verify 112 emergency call card announces: *"National Emergency Helpline 112, double tap to call"*.

