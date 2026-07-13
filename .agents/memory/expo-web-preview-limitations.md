---
name: Expo web preview limitations
description: Two recurring false-alarm failure modes when verifying Expo/React Native apps via the web-preview screenshot tool.
---

When verifying an Expo Router app's preview/screenshot (which renders via the web target), two issues are environment artifacts, not app bugs:

1. **`react-native-maps` fails Metro's web bundle** with "Importing native-only module ... on web" (it imports RN internals like `codegenNativeCommands`). Fix: never import `react-native-maps` directly in a shared screen file. Split into `Component.tsx` (native, real MapView) + `Component.web.tsx` (lightweight placeholder) — Metro's platform-extension resolution keeps the native-only import out of the web bundle entirely.

**Why:** react-native-maps has no web renderer; without the split, any screen using it makes the whole app un-bundleable on web, which shows as a blank white screen / 500 error in preview.

2. **External APIs without CORS headers fail from the web-preview browser** ("blocked by CORS policy") even though `curl`/native HTTP clients reach them fine. This is a browser-only restriction — the real Expo Go / native app is unaffected.

**How to apply:** When a mobile app's screenshot shows a blank/loading state with CORS console errors for a third-party API, confirm the API works via `curl` from the shell, then treat it as expected/unfixable in web-preview rather than a real bug — don't chase server-side CORS fixes for APIs you don't control.
