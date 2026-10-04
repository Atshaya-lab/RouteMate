# RouteMate - On-Demand Human Navigation & Safe Escort Mobile App

**RouteMate** is an on-demand human navigation guide application built with React Native (Expo) and TypeScript. It connects solo explorers, late-night commuters, and lost travelers with vetted local companion guides for real-time wayfinding, live audio guard escort, and safety monitoring.

---

## System Architecture & Features

### 1. Platform Adaptation (Figma Web to React Native)
- **Native Primitives**: Converted all web elements (`div`, `span`, `onClick`, CSS flexbox) to `View`, `Text`, `TouchableOpacity`, `ScrollView`, and `KeyboardAvoidingView`.
- **Design Tokens**: Standardized palette (`#1D4ED8` Cobalt Blue, `#059669` Emerald Green, `#DC2626` Crimson Red, `#FAF8FF` Surface), Inter typography hierarchy, 8pt baseline rhythm, and elevated shadows matching [`wayfinding_safety_system/DESIGN.md`](./wayfinding_safety_system/DESIGN.md).
- **Map Substrate**: Integrated [`react-native-maps`](https://github.com/react-native-maps/react-native-maps) across all screens with custom traveler pulsing markers, guide pins, animated radar search circles, and turn-by-turn route polyline overlays.

### 2. Matching Engine & Live Radar
- **Expanding Geofence**: Animated live radar circles synced with the server (1 km → 3 km → 5 km bounds).
- **Real-Time Dispatch**: Socket.io event pipeline (`request:new`, `request:radius_expanded`, `request:accepted`, `request:cancelled`).
- **30-Second Accept Ring**: Server-enforced expiration countdown for incoming escort dispatches.

### 3. Active Escort Sessions
- **Live Encrypted Audio Guard**: In-app voice call modal with mute, speakerphone, live duration, and 256-bit encrypted audio indicators.
- **Real-Time Room Chat**: Socket.io bidirectional message stream with timestamp synchronization and auto-scrolling.
- **Server Timer Synchronization**: Session timer driven by server timestamps (`startedAt`), eliminating client clock drift.

### 4. Offline & Low-Signal Fallback
- **Vector Route Caching**: Caches trip directions and polyline coordinates using `expo-file-system` and AsyncStorage.
- **Network State Detection**: Uses `@react-native-community/netinfo` to detect connectivity dropouts or 2G connections and display **Low-Signal Prep** guidance.
- **Push Notification Waitlist**: Registers traveler push notifications via `expo-notifications` to trigger as soon as a local escort comes online.

### 5. Critical Safety Layer
- **Persistent SOS Trigger**: Floating circular emergency button (64×64pt) with **1.5-second mechanical hold-to-confirm delay** and haptics to prevent accidental triggering.
- **Emergency Screen Takeover**: Instant GPS coordinate broadcast to 3 verified responders and one-touch direct dial to emergency services (`112` / `911`).
- **24/7 Security Sentinel & Fake Call**: Safety Hub with fake check-in call simulation and emergency contact management.

---

## Technical Notes & Architectural Flags

> [!IMPORTANT]
> **Expo Managed Workflow vs. Native Voice SDKs (Twilio Voice RN SDK / WebRTC)**
> - In standard Expo Go / managed workflow, in-app audio communication operates over Expo Audio and Socket.io signaling.
> - For production native WebRTC or Twilio Voice SDK (`react-native-webrtc` / `@twilio/voice-react-native-sdk`), use Expo Config Plugins with a **Custom Dev Client** (`npx expo run:ios` / `npx expo run:android`) without ejecting to bare workflow.

> [!NOTE]
> **Background Location Permissions**
> - Background GPS tracking during active escort sessions (`ACCESS_BACKGROUND_LOCATION` / `UIBackgroundModes: location`) is configured in `app.json`.
> - App Store and Google Play require clear user justification banners for battery and privacy compliance.

---

## Getting Started

### 1. Start the RouteMate Backend Server
```bash
npm run server
```
*Runs Express + Socket.io + PostGIS/Redis emulation on `http://localhost:3000`.*

### 2. Start the Expo Mobile App
```bash
npm start
```
*Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with the Expo Go app.*
