# Manual Testing Checklist — Smart Pushkaralu 2027

This document provides step-by-step procedures for testing capabilities that require physical devices, real cellular networks, background notification handlers, or OS-level accessibility configurations that cannot be completely verified through automated headless runners.

---

## 1. Firebase Phone OTP on a Real Physical Device

### Prerequisites:
- Physical Android or iOS device with an active SIM card.
- Build generated via Expo EAS or debug build (`npx expo run:android` / `npx expo run:ios`).
- Firebase project configured with Phone Authentication enabled in the Firebase Console.

### Procedure:
1. Launch the app on the physical device.
2. Tap the Profile icon or navigate to **More > Sign In**.
3. Enter a valid 10-digit Indian mobile number (`+91 9XXXXXXXXX`).
4. Tap **Send OTP**.
5. Verify that an SMS containing the 6-digit verification code arrives on the handset.
6. Verify auto-fill or enter the code manually into the OTP text input boxes.
7. Tap **Verify & Continue**.

### Expected Result:
- Handset authenticates with Firebase, receives an ID token, exchanges it with the backend `/v1/auth/session` endpoint, and transitions to the logged-in state displaying the user's phone number.

---

## 2. Real GPS Movement Along Godavari Route

### Prerequisites:
- Physical phone with GPS enabled.
- Location in the Godavari Pushkaralu region (or use Android Studio Location Mocking with a GPX track from Rajahmundry Railway Station to Kotilingala Ghat).

### Procedure:
1. Open the app and navigate to **Ghats**.
2. Tap **Sort by Nearest** or open **Directions**.
3. Select **Origin: My Current Location** and **Destination: Kotilingala Ghat**.
4. Begin transit along the corridor.
5. Observe the map view and distance indicators as physical coordinates change.

### Expected Result:
- Route updates as location moves; polyline renders correctly; corridor temples within detour distance appear along the corridor.
- Nearest ghat distance updates smoothly without app freeze or memory leaks.

---

## 3. Background Push Notifications (FCM)

### Prerequisites:
- Physical handset registered with an active FCM token.
- Admin panel open at `/notifications`.

### Procedure:
1. Open the mobile app and ensure it is registered.
2. Minimize the mobile app (press Home button to move app into background).
3. In the Admin Panel (`/notifications`):
   - Enter Title: `Important Ghat Advisory`
   - Enter Body: `Temporary crowd diversion active near Kotilingala steps.`
   - Select Target: `All Pushkaralu Pilgrims`
   - Enter Audit Reason: `Testing background push delivery on physical device`
   - Tap **Dispatch Push Notification**.
4. Observe the mobile device notification shade.

### Expected Result:
- Push notification arrives in the system status bar with the app icon (`#FFF7ED` background), title, and body.
- Tapping the notification opens the app to the relevant advisory/notice screen.

---

## 4. Offline Resilience & SMS SOS Fallback

### Prerequisites:
- Handset with cellular SIM.

### Procedure:
1. Open the app while online and visit **Ghats** and **Nearby Places** to populate the offline cache.
2. Plan and save a trip in **Plan > Saved Trips**.
3. Enable **Airplane Mode** (disable Wi-Fi and mobile data).
4. Re-open the app:
   - Observe **Offline Banner** at top of screen: `Showing cached information`.
   - Verify previously visited Ghats list and detail view still load from local storage.
   - Verify saved trip itinerary loads from storage.
5. Tap the floating **SOS Button**:
   - Select **Medical Emergency**.
   - Allow the 3-second countdown to expire.
   - Since network is unavailable, verify prompt to send offline SMS alert.
   - Tap **Send SMS**.

### Expected Result:
- Native SMS messenger launches with recipient pre-filled to `112` and pre-filled body containing: `SOS MEDICAL GPS:<lat>,<lng>`.
- Alert is also queued locally in SQLite/AsyncStorage and syncs automatically once connectivity returns.

---

## 5. Live Admin SOS Control Room Dispatch (Socket.io)

### Prerequisites:
- Admin panel open on a workstation at `/sos` with Sound Chime enabled (`🔔 Chime: ON`).
- Mobile app open on a phone or separate browser session.

### Procedure:
1. On the mobile app, tap the red **SOS Button** and trigger a **Police Assistance** alert.
2. Observe the Admin Panel `/sos` in real time.
3. Observe audio chime and immediate visual alert arrival at top of the queue.
4. On Admin Panel:
   - Click the alert row to open incident details.
   - In "Assign Responder", enter: `Inspector Sharma (+91 9876543210)` and tap **Assign**.
   - Change Status to `Dispatched` with reason: `Unit dispatched from North Gate cordons`.
5. Observe the mobile phone screen.

### Expected Result:
- Mobile screen receives live update displaying field responder `Inspector Sharma` and status `Dispatched` via polling/Socket.io.
- Citizen can type a note: `Waiting near Pillar 14` which immediately appears in the Admin incident timeline.

---

## 6. System Font Scaling (1.3x) & Telugu Typography

### Prerequisites:
- Android device or emulator running Android 12+.

### Procedure:
1. Go to **Android Settings > Display > Font Size** and set to **Largest (1.3x scale)**.
2. In the Smart Pushkaralu app, switch language to **తెలుగు (Telugu)** via the top language switcher.
3. Navigate through:
   - **Home Screen**: Quick action grid, urgent advisory banner.
   - **Ghats Screen**: Filter chips, ghat cards, bathing status chips.
   - **Ghat Detail**: Aarti timings table, facilities list, source links.
   - **Report Issue**: Category cards, location pills, text fields.
   - **SOS Screen**: Emergency dialer banner, active tracking card.

### Expected Result:
- No text clipped, truncated illegibly, or overlapping adjacent views.
- Telugu conjunct glyphs (వత్తులు, దీర్ఘాలు) render cleanly with adequate line height (tokens specify line height >= 1.5).
- Touch targets remain at least 48dp (56dp for primary and SOS actions).

---

## 7. Small Screen (360x640 dp) Layout & Touch Targets

### Prerequisites:
- Small screen device or emulator set to viewport `360 x 640 dp` (e.g. standard budget Android handset).

### Procedure:
1. Test all primary buttons: Verify touch height is >= 48dp (and SOS button is >= 56dp).
2. Check horizontal scroll: Verify no inadvertent horizontal scrolling on screens except deliberate horizontal chip lists.
3. Check bottom navigation tabs: Ensure all 5 tabs (`Home`, `Ghats`, `Plan`, `News`, `More`) are visible and readable without truncation.
4. Verify floating SOS button does not obscure important form submit buttons or list items.

### Expected Result:
- Clean layout without horizontal overflow; comfortable tap targets; full accessibility compliance.

