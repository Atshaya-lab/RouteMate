import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { GuideProfile, TripRequest, ActiveSession, User, LocationCoordinate } from '../types';
import { updateGuideAvailability } from '../services/api';
import { socketService } from '../services/socket';
import { triggerIncomingGuideRequestNotification } from '../services/notifications';
import { IncomingRequestModal } from '../components/modals/IncomingRequestModal';
import { watchDeviceLocation, getCurrentDeviceLocation } from '../services/location';
import { updateGuideLiveLocation } from '../services/supabase';

interface GuideDashboardScreenProps {
  currentUser?: User | null;
  onAcceptEscort: (session: ActiveSession) => void;
  onSwitchProfile?: () => void;
}

export const GuideDashboardScreen: React.FC<GuideDashboardScreenProps> = ({
  currentUser,
  onAcceptEscort,
  onSwitchProfile,
}) => {
  const guideId = currentUser?.id || 'guide-001';
  const guideName = currentUser?.name || 'Achu';
  const [isOnline, setIsOnline] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<LocationCoordinate | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Connecting GPS...');
  const [incomingRequest, setIncomingRequest] = useState<TripRequest | null>(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);

  useEffect(() => {
    let cleanupLocationWatcher: (() => void) | null = null;

    if (isOnline) {
      // 1. Get immediate position and sync
      getCurrentDeviceLocation().then((loc) => {
        setCurrentCoords(loc);
        updateGuideLiveLocation(guideId, loc.latitude, loc.longitude, true);
        setLastSyncTime(new Date().toLocaleTimeString());
      });

      // 2. Watch device movements and continuously update Supabase
      watchDeviceLocation((loc) => {
        setCurrentCoords(loc);
        updateGuideLiveLocation(guideId, loc.latitude, loc.longitude, true);
        setLastSyncTime(new Date().toLocaleTimeString());
      }).then((unsub) => {
        cleanupLocationWatcher = unsub;
      });
    } else {
      if (currentCoords) {
        updateGuideLiveLocation(guideId, currentCoords.latitude, currentCoords.longitude, false);
      }
    }

    return () => {
      if (cleanupLocationWatcher) cleanupLocationWatcher();
    };
  }, [isOnline, guideId]);

  useEffect(() => {
    // Subscribe to Socket.io incoming request alerts
    const unsubscribe = socketService.subscribeToGuideIncomingRequests((data) => {
      if (isOnline) {
        setIncomingRequest(data.request);
        setShowIncomingModal(true);
        triggerIncomingGuideRequestNotification(
          data.request.travelerName,
          data.request.destination,
          data.request.id
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline]);

  const handleToggleOnline = async (val: boolean) => {
    setIsOnline(val);
    await updateGuideAvailability(guideId, val);
    if (currentCoords) {
      await updateGuideLiveLocation(guideId, currentCoords.latitude, currentCoords.longitude, val);
    }
  };

  const handleSimulateIncomingRequest = () => {
    const mockRequest: TripRequest = {
      id: 'req-sim-' + Date.now(),
      travelerId: 'traveler-001',
      travelerName: 'Alex Morgan',
      travelerPhone: '+1 (555) 019-2834',
      travelerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhlQT9am7-K9l0E8HNIXDfK0bN-G661Y1zSw-UFYNyTMQaUHJ-UnTEshZ5e_GSF7waHHAfVIk6mwkBilYF1NRPtmRmEO-HNBymTKsB6Zw4UeVuusG_8HIVM2L0N_PVghpHbZFihUulIDYgornlgmUrt7JZERHuXyvwWt6soGX01gwcE6J6UYdWLFymPfUT9QA89rhqbgmQc8yJcvv31-uExTdNtNuQ14cGd-C5i7F7lk8V9reYGwuo',
      destination: 'Mustek Metro Station, Exit A',
      pickupLocation: { latitude: 50.0875, longitude: 14.4211 },
      status: 'searching',
      searchRadiusKm: 1.0,
      respondingGuides: [],
      selectedMode: 'call',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30000,
    };

    setIncomingRequest(mockRequest);
    setShowIncomingModal(true);
    triggerIncomingGuideRequestNotification('Alex Morgan', 'Mustek Metro Station, Exit A', mockRequest.id);
  };

  const handleAccept = (req: TripRequest) => {
    setShowIncomingModal(false);
    const mockSession: ActiveSession = {
      id: 'sess-' + Date.now(),
      requestId: req.id,
      travelerId: req.travelerId,
      guideId: 'guide-001',
      guide: {
        id: 'guide-001',
        name: 'Elena Rostova',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhlQT9am7-K9l0E8HNIXDfK0bN-G661Y1zSw-UFYNyTMQaUHJ-UnTEshZ5e_GSF7waHHAfVIk6mwkBilYF1NRPtmRmEO-HNBymTKsB6Zw4UeVuusG_8HIVM2L0N_PVghpHbZFihUulIDYgornlgmUrt7JZERHuXyvwWt6soGX01gwcE6J6UYdWLFymPfUT9QA89rhqbgmQc8yJcvv31-uExTdNtNuQ14cGd-C5i7F7lk8V9reYGwuo',
        rating: 4.9,
        reviewCount: 184,
        distance: '0.4 km away',
        distanceKm: 0.4,
        eta: '2 min walk',
        pricePerSession: 8,
        languages: ['English', 'Spanish', 'Italian'],
        location: { latitude: 50.0882, longitude: 14.4225 },
        isOnline: true,
        isVerified: true,
        fastResponder: true,
        specialty: 'Historic Old Town Alleyway Specialist',
        modes: ['call', 'chat', 'meetup'],
      },
      traveler: {
        id: req.travelerId,
        name: req.travelerName,
        avatarUrl: req.travelerAvatar,
        location: req.pickupLocation,
      },
      status: 'active',
      mode: req.selectedMode,
      startedAt: Date.now(),
      durationSeconds: 0,
      destination: req.destination,
      currentGuideLocation: { latitude: 50.0882, longitude: 14.4225 },
      currentTravelerLocation: req.pickupLocation,
      audioEncrypted: true,
      beaconActive: true,
    };
    onAcceptEscort(mockSession);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Availability Status Card */}
      <View style={[styles.statusCard, isOnline ? styles.statusCardOnline : styles.statusCardOffline]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusIndicatorDot, isOnline ? styles.dotGreen : styles.dotGray]} />
          <View>
            <Text style={styles.statusHeading}>{guideName} • {isOnline ? 'Online & Discoverable' : 'Offline'}</Text>
            <Text style={styles.statusSubheading}>
              {isOnline
                ? `Broadcasting Live GPS: ${currentCoords ? `${currentCoords.latitude.toFixed(4)}°, ${currentCoords.longitude.toFixed(4)}°` : 'Acquiring...'}`
                : 'Toggle switch to start receiving escort dispatches'}
            </Text>
            {isOnline && (
              <Text style={{ fontSize: 10, color: Colors.secondaryLive, marginTop: 3, fontWeight: '600' }}>
                ⚡ Synced to Supabase: {lastSyncTime}
              </Text>
            )}
          </View>
        </View>

        <Switch
          value={isOnline}
          onValueChange={handleToggleOnline}
          trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.secondaryContainer }}
          thumbColor={isOnline ? Colors.secondaryLive : Colors.outline}
        />
      </View>

      {/* Guide Performance Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconBg}>
            <MaterialIcons name="payments" size={20} color={Colors.secondaryLive} />
          </View>
          <Text style={styles.metricValue}>$64.00</Text>
          <Text style={styles.metricLabel}>Today's Earnings</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconBg}>
            <MaterialIcons name="directions-walk" size={20} color={Colors.primaryContainer} />
          </View>
          <Text style={styles.metricValue}>8 walks</Text>
          <Text style={styles.metricLabel}>Completed Today</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconBg}>
            <MaterialIcons name="star" size={20} color={Colors.amber} />
          </View>
          <Text style={styles.metricValue}>4.98 ★</Text>
          <Text style={styles.metricLabel}>Rating (340 walks)</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconBg}>
            <MaterialIcons name="schedule" size={20} color={Colors.onSurfaceVariant} />
          </View>
          <Text style={styles.metricValue}>3.5 hrs</Text>
          <Text style={styles.metricLabel}>Online Time</Text>
        </View>
      </View>

      {/* Test Incoming Request Simulator Button */}
      <View style={styles.testSection}>
        <Text style={styles.testSectionHeading}>Dispatch Simulation & QA</Text>
        <TouchableOpacity
          style={styles.testDispatchBtn}
          onPress={handleSimulateIncomingRequest}
          activeOpacity={0.85}
        >
          <MaterialIcons name="play-arrow" size={20} color={Colors.onPrimary} />
          <Text style={styles.testDispatchBtnText}>Test Incoming Request (30s Ring Modal)</Text>
        </TouchableOpacity>
      </View>

      {/* Verified Safety Badge Status */}
      <View style={styles.safetyStatusBox}>
        <View style={styles.safetyHeaderRow}>
          <MaterialIcons name="verified" size={20} color={Colors.secondaryLive} />
          <Text style={styles.safetyBoxTitle}>Verified RouteMate Guide Credential Active</Text>
        </View>
        <Text style={styles.safetyBoxDesc}>
          Background check passed • Live biometric authentication valid • 24/7 Security Sentinel linked
        </Text>
      </View>

      {/* Incoming Request Ring Modal */}
      <IncomingRequestModal
        visible={showIncomingModal}
        request={incomingRequest}
        onAccept={handleAccept}
        onDecline={() => setShowIncomingModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    padding: Spacing.gutter,
    gap: 16,
    paddingBottom: 120,
  },
  statusCard: {
    padding: 16,
    borderRadius: Radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.level2,
  },
  statusCardOnline: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderLeftWidth: 5,
    borderLeftColor: Colors.secondaryLive,
  },
  statusCardOffline: {
    backgroundColor: Colors.surfaceContainerLow,
    borderLeftWidth: 5,
    borderLeftColor: Colors.outline,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  statusIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: Radii.full,
  },
  dotGreen: {
    backgroundColor: Colors.secondaryLive,
  },
  dotGray: {
    backgroundColor: Colors.outline,
  },
  statusHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statusSubheading: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 14,
    ...Elevation.level1,
    gap: 6,
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  testSection: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.xl,
    padding: 14,
    gap: 10,
  },
  testSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  testDispatchBtn: {
    height: 48,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Elevation.level2,
  },
  testDispatchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  safetyStatusBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: 14,
    gap: 6,
    ...Elevation.level1,
  },
  safetyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  safetyBoxDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
});
