import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { GuideProfile, LocationCoordinate, TripRequest, ActiveSession } from '../types';
import { LiveMapView } from '../components/map/LiveMapView';
import { socketService } from '../services/socket';
import { acceptTripRequest } from '../services/api';

interface LiveRadarSearchScreenProps {
  request: TripRequest;
  travelerLocation: LocationCoordinate;
  onGuideAccepted: (session: ActiveSession) => void;
  onCancelSearch: () => void;
  onNavigateToOfflineFallback: () => void;
}

export const LiveRadarSearchScreen: React.FC<LiveRadarSearchScreenProps> = ({
  request,
  travelerLocation,
  onGuideAccepted,
  onCancelSearch,
  onNavigateToOfflineFallback,
}) => {
  const [currentRadiusKm, setCurrentRadiusKm] = useState<number>(1.0);
  const [respondingGuides, setRespondingGuides] = useState<GuideProfile[]>(request.respondingGuides || []);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  useEffect(() => {
    // 1. Live synchronized timer
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // 2. Subscribe to server radius expansion and auto-accept events via Socket.io
    const unsubscribe = socketService.subscribeToRequestRadius(
      request.id,
      (data) => {
        setCurrentRadiusKm(data.radiusKm);
        if (data.respondingGuides && data.respondingGuides.length > 0) {
          setRespondingGuides(data.respondingGuides);
        }
      },
      (data) => {
        onGuideAccepted(data.session);
      }
    );

    // 3. Fallback client-side simulated radius expansion if offline
    const t1 = setTimeout(() => {
      setCurrentRadiusKm(3.0);
    }, 4000);

    const t2 = setTimeout(() => {
      setCurrentRadiusKm(5.0);
    }, 9000);

    return () => {
      clearInterval(timer);
      clearTimeout(t1);
      clearTimeout(t2);
      unsubscribe();
    };
  }, [request.id]);

  const handleAcceptGuide = async (guide: GuideProfile) => {
    setIsConnecting(true);
    try {
      const session = await acceptTripRequest(request.id, guide.id);
      setIsConnecting(false);
      onGuideAccepted(session);
    } catch {
      setIsConnecting(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Dynamic Radar Map Canvas Container */}
      <View style={styles.mapWrapper}>
        <LiveMapView
          travelerLocation={travelerLocation}
          guides={respondingGuides}
          searchRadiusKm={currentRadiusKm}
          height={420}
        />

        {/* Top Floating Radar HUD Banner */}
        <View style={styles.topRadarBanner}>
          <View style={styles.radarIconBox}>
            <MaterialIcons name="radar" size={22} color={Colors.onPrimary} />
          </View>
          <View style={styles.radarMetaCol}>
            <View style={styles.statusLiveRow}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.radarStatusTitle}>Searching within {currentRadiusKm} km...</Text>
            </View>
            <Text style={styles.radarStatusSubtitle}>Scanning 18 verified local guides</Text>
          </View>
          <View style={styles.timerPill}>
            <MaterialIcons name="timer" size={14} color={Colors.primaryContainer} />
            <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
          </View>
        </View>
      </View>

      {/* Reassurance Sheet Card Container */}
      <View style={styles.sheetContainer}>
        <View style={styles.dragHandleBar} />

        {/* Live Dispatch Status Summary */}
        <View style={styles.dispatchHeader}>
          <View style={styles.dispatchTitleGroup}>
            <View style={styles.shieldIconBadge}>
              <MaterialIcons name="verified-user" size={18} color={Colors.onSecondaryContainer} />
            </View>
            <View>
              <Text style={styles.dispatchTitle}>Finding Your RouteMate</Text>
              <View style={styles.dispatchRespondingRow}>
                <View style={styles.greenPulseDotSmall} />
                <Text style={styles.dispatchRespondingText}>
                  {respondingGuides.length > 0
                    ? `${respondingGuides.length} guides responding to your signal`
                    : 'Broadcasting to nearby verified escorts...'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.safeConnectBadge}>
            <Text style={styles.safeConnectText}>Safe Connect</Text>
          </View>
        </View>

        {/* Calming Traveler Safety Tip */}
        <View style={styles.safetyTipCard}>
          <MaterialIcons name="lightbulb" size={20} color={Colors.primaryContainer} />
          <View style={styles.safetyTipTextCol}>
            <Text style={styles.safetyTipHeading}>Traveler Safety Tip</Text>
            <Text style={styles.safetyTipBody}>
              Stay in well-lit public spots while we connect you. All RouteMate guides are identity-verified and location-monitored.
            </Text>
          </View>
        </View>

        {/* Responding Guides Quick Match Cards */}
        <View style={styles.respondingListSection}>
          {respondingGuides.map((guide) => (
            <View key={guide.id} style={styles.guideMatchCard}>
              <Image source={{ uri: guide.avatarUrl }} style={styles.guideAvatar} />
              <View style={styles.guideInfoCol}>
                <View style={styles.guideNameBadgeRow}>
                  <Text style={styles.guideName}>{guide.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ {guide.rating}</Text>
                  </View>
                </View>
                <Text style={styles.guideSubtext} numberOfLines={1}>
                  {guide.languages.slice(0, 2).join(' · ')} · {guide.eta}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.acceptMatchBtn}
                onPress={() => handleAcceptGuide(guide)}
                disabled={isConnecting}
                activeOpacity={0.8}
              >
                {isConnecting ? (
                  <ActivityIndicator color={Colors.onPrimary} size="small" />
                ) : (
                  <Text style={styles.acceptMatchBtnText}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}

          {/* Skeleton Placeholder for upcoming guides */}
          {respondingGuides.length < 3 && (
            <View style={styles.skeletonCard}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonTextCol}>
                <View style={styles.skeletonLineLong} />
                <View style={styles.skeletonLineShort} />
              </View>
              <View style={styles.skeletonPill} />
            </View>
          )}
        </View>

        {/* Secondary Escapes & Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancelSearch}
            activeOpacity={0.8}
          >
            <MaterialIcons name="close" size={18} color={Colors.onSurface} />
            <Text style={styles.cancelBtnText}>Cancel Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.offlineBtn}
            onPress={onNavigateToOfflineFallback}
            activeOpacity={0.8}
          >
            <MaterialIcons name="offline-bolt" size={18} color={Colors.primaryContainer} />
            <Text style={styles.offlineBtnText}>Offline Route</Text>
          </TouchableOpacity>
        </View>

        {/* 24/7 Security Sentinel Micro-bar */}
        <View style={styles.sentinelBar}>
          <View style={styles.sentinelLeft}>
            <MaterialIcons name="security" size={18} color={Colors.secondaryLive} />
            <Text style={styles.sentinelText}>RouteMate 24/7 Security Sentinel Active</Text>
          </View>
          <Text style={styles.encryptedTag}>Encrypted</Text>
        </View>
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
  mapWrapper: {
    position: 'relative',
  },
  topRadarBanner: {
    position: 'absolute',
    top: 14,
    left: Spacing.gutter,
    right: Spacing.gutter,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Radii.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.level3,
    zIndex: 30,
  },
  radarIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarMetaCol: {
    flex: 1,
    marginLeft: 10,
  },
  statusLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  greenPulseDotSmall: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  radarStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  radarStatusSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryContainer,
    fontVariant: ['tabular-nums'],
  },
  sheetContainer: {
    marginHorizontal: Spacing.gutter,
    marginTop: -16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    ...Elevation.level3,
    gap: 12,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: 4,
  },
  dispatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dispatchTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  shieldIconBadge: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dispatchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  dispatchRespondingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dispatchRespondingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryLive,
  },
  safeConnectBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  safeConnectText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSecondaryContainer,
  },
  safetyTipCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  safetyTipTextCol: {
    flex: 1,
  },
  safetyTipHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  safetyTipBody: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
    marginTop: 2,
  },
  respondingListSection: {
    gap: 8,
  },
  guideMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.md,
    padding: 10,
    gap: 10,
  },
  guideAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
  },
  guideInfoCol: {
    flex: 1,
  },
  guideNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guideName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ratingBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.sm,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  guideSubtext: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  acceptMatchBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  acceptMatchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.md,
    padding: 10,
    gap: 10,
    opacity: 0.6,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  skeletonTextCol: {
    flex: 1,
    gap: 6,
  },
  skeletonLineLong: {
    width: '60%',
    height: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.sm,
  },
  skeletonLineShort: {
    width: '40%',
    height: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.sm,
  },
  skeletonPill: {
    width: 60,
    height: 28,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  offlineBtn: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  offlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  sentinelBar: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  sentinelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sentinelText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  encryptedTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryLive,
  },
});
