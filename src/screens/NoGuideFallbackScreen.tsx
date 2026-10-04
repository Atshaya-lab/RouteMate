import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { LocationCoordinate, OfflineRouteData, RouteTip } from '../types';
import { LiveMapView } from '../components/map/LiveMapView';
import { fetchDirections, fetchRouteTips, subscribeToGuideAvailability } from '../services/api';
import { cacheTripRoute, getLastCachedRoute, subscribeToNetworkStatus, LOW_SIGNAL_SAFETY_TIPS } from '../services/offline';
import { registerForPushNotificationsAsync } from '../services/notifications';

interface NoGuideFallbackScreenProps {
  destination: string;
  travelerLocation: LocationCoordinate;
  onBackToExplore: () => void;
}

export const NoGuideFallbackScreen: React.FC<NoGuideFallbackScreenProps> = ({
  destination,
  travelerLocation,
  onBackToExplore,
}) => {
  const destCoords: LocationCoordinate = {
    latitude: travelerLocation.latitude + 0.002,
    longitude: travelerLocation.longitude + 0.0015,
  };

  const initialPolyline: LocationCoordinate[] = [
    travelerLocation,
    { latitude: travelerLocation.latitude + 0.0008, longitude: travelerLocation.longitude + 0.0006 },
    { latitude: travelerLocation.latitude + 0.0015, longitude: travelerLocation.longitude + 0.0011 },
    destCoords,
  ];

  const [routePolyline, setRoutePolyline] = useState<LocationCoordinate[]>(initialPolyline);
  const [distanceText, setDistanceText] = useState('350m');
  const [durationText, setDurationText] = useState('4 mins');
  const [turnSteps, setTurnSteps] = useState<string[]>([
    'Head along the illuminated pedestrian walkway (120m)',
    'Pass the 24/7 emergency sentinel station on your left (80m)',
    'Arrive safely at destination safe haven',
  ]);
  const [tips, setTips] = useState<RouteTip[]>(LOW_SIGNAL_SAFETY_TIPS);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isLowSignal, setIsLowSignal] = useState(false);

  useEffect(() => {
    // 1. Subscribe to network connectivity
    const unsubNet = subscribeToNetworkStatus((connected, lowSig) => {
      setIsConnected(connected);
      setIsLowSignal(lowSig);
    });

    // 2. Auto-fetch directions and cache offline on mount
    loadRouteAndTips();

    return () => {
      unsubNet();
    };
  }, []);

  const loadRouteAndTips = async () => {
    try {
      const dirData = await fetchDirections(travelerLocation, destCoords);
      const fetchedTips = await fetchRouteTips();

      setRoutePolyline(dirData.polyline);
      setDistanceText(dirData.distanceText);
      setDurationText(dirData.durationText);
      setTurnSteps(dirData.steps);
      setTips(fetchedTips.length > 0 ? fetchedTips : LOW_SIGNAL_SAFETY_TIPS);

      // Cache offline using expo-file-system & AsyncStorage (STEP 8)
      const offlineData: OfflineRouteData = {
        id: 'route-' + Date.now(),
        destination,
        origin: travelerLocation,
        destinationCoords: destCoords,
        polylineCoords: dirData.polyline,
        distanceText: dirData.distanceText,
        durationText: dirData.durationText,
        cachedAt: Date.now(),
        tips: fetchedTips,
      };
      await cacheTripRoute(offlineData);
    } catch {
      // Fallback to cached route if offline
      const cached = await getLastCachedRoute();
      if (cached) {
        setRoutePolyline(cached.polylineCoords);
        setDistanceText(cached.distanceText);
        setDurationText(cached.durationText);
        setTips(cached.tips);
      }
    }
  };

  const handleToggleNotify = async (val: boolean) => {
    setNotifyEnabled(val);
    if (val) {
      const pushToken = await registerForPushNotificationsAsync();
      await subscribeToGuideAvailability(destination, 'traveler-001', pushToken || undefined);
      Alert.alert(
        'Push Notification Scheduled',
        `We will immediately notify you when a verified guide comes online near ${destination}.`
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Low-Signal / Offline Banner */}
      {(!isConnected || isLowSignal) && (
        <View style={styles.lowSignalBanner}>
          <MaterialIcons name="signal-cellular-connected-no-internet-0-bar" size={20} color={Colors.amber} />
          <View style={styles.lowSignalTextCol}>
            <Text style={styles.lowSignalTitle}>Low-Signal Prep Active</Text>
            <Text style={styles.lowSignalSubtitle}>
              Offline route & turn vectors are cached to local storage. Turn navigation will continue uninterrupted.
            </Text>
          </View>
        </View>
      )}

      {/* Auto-Fetched Directions Map Overlay */}
      <View style={styles.mapWrapper}>
        <LiveMapView
          travelerLocation={travelerLocation}
          routePolyline={routePolyline}
          height={320}
        />

        <View style={styles.mapFloatingInfo}>
          <View style={styles.etaPill}>
            <MaterialIcons name="directions-walk" size={16} color={Colors.primaryContainer} />
            <Text style={styles.etaText}>{durationText} ({distanceText})</Text>
          </View>
          <View style={styles.cachedBadge}>
            <MaterialIcons name="offline-pin" size={14} color={Colors.secondaryLive} />
            <Text style={styles.cachedText}>Cached Offline</Text>
          </View>
        </View>
      </View>

      {/* Main Guidance Container */}
      <View style={styles.contentContainer}>
        {/* Status Alert: No Guides Online Right Now */}
        <View style={styles.noGuideAlertBox}>
          <View style={styles.alertIconBadge}>
            <MaterialIcons name="person-search" size={24} color={Colors.primaryContainer} />
          </View>
          <View style={styles.alertTextGroup}>
            <Text style={styles.alertHeading}>No Guides Currently Online in Area</Text>
            <Text style={styles.alertSubtext}>
              All escorts within 5 km are currently engaged. We have loaded the verified safe route for you.
            </Text>
          </View>
        </View>

        {/* Push Notification Toggle Card (STEP 5) */}
        <View style={styles.notifyCard}>
          <View style={styles.notifyTextCol}>
            <View style={styles.notifyTitleRow}>
              <MaterialIcons name="notifications-active" size={18} color={Colors.primaryContainer} />
              <Text style={styles.notifyTitle}>Notify Me When Guide Available</Text>
            </View>
            <Text style={styles.notifyDesc}>
              Receive an instant push alert the moment a certified local mate comes online.
            </Text>
          </View>
          <Switch
            value={notifyEnabled}
            onValueChange={handleToggleNotify}
            trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.secondaryContainer }}
            thumbColor={notifyEnabled ? Colors.secondaryLive : Colors.outline}
          />
        </View>

        {/* Turn-by-Turn Safe Path Steps */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionHeaderTitle}>Verified Path Directions</Text>
          {turnSteps.map((step, idx) => (
            <View key={idx} style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepItemText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Local Tips Query List (from route_tips table) */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionHeaderTitle}>Local Safety & Egress Tips</Text>
          {tips.map((tip) => (
            <View key={tip.id} style={styles.tipCard}>
              <View style={styles.tipIconBox}>
                <MaterialIcons
                  name={
                    tip.category === 'safety'
                      ? 'security'
                      : tip.category === 'transit'
                      ? 'subway'
                      : 'lightbulb'
                  }
                  size={18}
                  color={Colors.secondaryLive}
                />
              </View>
              <View style={styles.tipTextCol}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Back to Explore */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBackToExplore}
          activeOpacity={0.85}
        >
          <MaterialIcons name="arrow-back" size={18} color={Colors.onPrimary} />
          <Text style={styles.backBtnText}>Return to Explore Map</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  lowSignalBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lowSignalTextCol: {
    flex: 1,
  },
  lowSignalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  lowSignalSubtitle: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 15,
  },
  mapWrapper: {
    position: 'relative',
  },
  mapFloatingInfo: {
    position: 'absolute',
    top: 14,
    left: Spacing.gutter,
    right: Spacing.gutter,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    ...Elevation.level2,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  cachedText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSecondaryContainer,
  },
  contentContainer: {
    padding: Spacing.gutter,
    gap: 14,
  },
  noGuideAlertBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    ...Elevation.level2,
  },
  alertIconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTextGroup: {
    flex: 1,
  },
  alertHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  alertSubtext: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 16,
  },
  notifyCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notifyTextCol: {
    flex: 1,
  },
  notifyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  notifyDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  stepsSection: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: 14,
    gap: 10,
    ...Elevation.level1,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  stepItemText: {
    fontSize: 12,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 16,
  },
  tipsSection: {
    gap: 10,
  },
  tipCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    ...Elevation.level1,
  },
  tipIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radii.md,
    backgroundColor: Colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextCol: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  tipDescription: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 15,
  },
  backBtn: {
    height: 50,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    ...Elevation.level2,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
});
