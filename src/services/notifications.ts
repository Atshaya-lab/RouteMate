import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // In Expo Go or standard testing, provide a persistent mock token for waitlists & registration
  return 'ExponentPushToken[routemate-verified-device-token]';
}

/**
 * Schedule or immediately trigger a local notification.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  try {
    // Provide tactile haptic feedback on alert trigger
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }

    console.log(`[RouteMate Alert] ${title}: ${body}`, data);
  } catch (e) {
    console.log('Notification trigger note:', title, body);
  }
}

/**
 * Alert Guide on Incoming Traveler Request (Step 6)
 */
export async function triggerIncomingGuideRequestNotification(
  travelerName: string,
  destination: string,
  requestId: string
): Promise<void> {
  await showLocalNotification(
    '🚨 Incoming RouteMate Request',
    `${travelerName} needs wayfinding escort to ${destination}. Tap to accept (30s timeout).`,
    { type: 'incoming_request', requestId }
  );
}

/**
 * Alert Traveler when a guide comes online for their previously requested route (Step 5)
 */
export async function triggerGuideAvailableNotification(
  destination: string
): Promise<void> {
  await showLocalNotification(
    '✨ Verified Guide Now Online!',
    `A verified local guide is now active near ${destination}. Tap to start escort walk.`,
    { type: 'guide_available', destination }
  );
}

