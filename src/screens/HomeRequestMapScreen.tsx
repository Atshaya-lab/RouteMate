import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { GuideProfile, LocationCoordinate } from '../types';
import { LiveMapView } from '../components/map/LiveMapView';
import {
  requestForegroundLocationPermission,
  getCurrentDeviceLocation,
  watchDeviceLocation,
  reverseGeocodeLocation,
  DEFAULT_FALLBACK_LOCATION,
  DESTINATION_PRESETS,
} from '../services/location';
import { fetchNearbyGuides } from '../services/api';

interface HomeRequestMapScreenProps {
  onRequestGuide: (destination: string, pickupLocation: LocationCoordinate) => void;
  onSelectSpecificGuide?: (guide: GuideProfile) => void;
}

export const HomeRequestMapScreen: React.FC<HomeRequestMapScreenProps> = ({
  onRequestGuide,
  onSelectSpecificGuide,
}) => {
  const [destination, setDestination] = useState('Campus Main Gate');
  const [location, setLocation] = useState<LocationCoordinate>(DEFAULT_FALLBACK_LOCATION);
  const [addressName, setAddressName] = useState<string>('Detecting GPS location...');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [loadingGuides, setLoadingGuides] = useState<boolean>(false);

  useEffect(() => {
    let unsubscribeLocation: (() => void) | null = null;

    const setupLiveLocation = async () => {
      await initLocationAndGuides();
      unsubscribeLocation = await watchDeviceLocation(async (newLoc) => {
        setLocation(newLoc);
        const addr = await reverseGeocodeLocation(newLoc);
        setAddressName(addr);
      });
    };

    setupLiveLocation();

    return () => {
      if (unsubscribeLocation) {
        unsubscribeLocation();
      }
    };
  }, []);

  const initLocationAndGuides = async () => {
    setIsLocating(true);
    const perm = await requestForegroundLocationPermission();
    setPermissionGranted(perm.granted);

    const loc = await getCurrentDeviceLocation();
    setLocation(loc);
    const addr = await reverseGeocodeLocation(loc);
    setAddressName(addr);
    setIsLocating(false);

    setLoadingGuides(true);
    const nearby = await fetchNearbyGuides(loc.latitude, loc.longitude);
    setGuides(nearby);
    setLoadingGuides(false);
  };

  const handlePresetSelect = (name: string) => {
    setDestination(name);
    if (DESTINATION_PRESETS[name]) {
      // Preset coordinates can be used for route estimation
    }
  };

  const topGuide = guides.length > 0 ? guides[0] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Location Permission Denied Fallback Alert */}
      {!permissionGranted && (
        <View style={styles.permissionAlertBox}>
          <View style={styles.alertIconCol}>
            <MaterialIcons name="location-off" size={24} color={Colors.error} />
          </View>
          <View style={styles.alertTextCol}>
            <Text style={styles.alertTitle}>Location Access Needed</Text>
            <Text style={styles.alertDescription}>
              RouteMate requires GPS to match you with nearby local escorts.
            </Text>
            <TouchableOpacity style={styles.alertBtn} onPress={initLocationAndGuides}>
              <Text style={styles.alertBtnText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Interactive Map Section */}
      <View style={styles.mapWrapper}>
        <LiveMapView
          travelerLocation={location}
          guides={guides}
          height={380}
          onSelectGuide={onSelectSpecificGuide}
          onRecenterPress={initLocationAndGuides}
        />

        {/* Live Guides Online Badge */}
        <View style={styles.activeGuidesPill}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.activeGuidesText}>14 Verified Guides Active</Text>
        </View>
      </View>

      {/* Bottom Sheet Action Container */}
      <View style={styles.sheetContainer}>
        {/* Drag Handle */}
        <View style={styles.dragHandleBar} />

        {/* Current GPS Pickup Location Indicator */}
        <TouchableOpacity
          style={styles.currentLocationRow}
          onPress={initLocationAndGuides}
          activeOpacity={0.8}
        >
          <View style={styles.currentLocationIconBox}>
            <MaterialIcons name="my-location" size={18} color={Colors.primary} />
          </View>
          <View style={styles.currentLocationTextBox}>
            <Text style={styles.currentLocationLabel}>YOUR PICKUP LOCATION (GPS)</Text>
            <Text style={styles.currentLocationValue} numberOfLines={1}>
              {isLocating ? 'Acquiring GPS fix...' : addressName}
            </Text>
          </View>
          <View style={styles.refreshLocBtn}>
            {isLocating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialIcons name="refresh" size={18} color={Colors.primary} />
            )}
          </View>
        </TouchableOpacity>

        {/* Header Title */}
        <View style={styles.sheetHeaderRow}>
          <View style={styles.sheetTitleGroup}>
            <View style={styles.liveDotRing}>
              <View style={styles.liveDotCore} />
            </View>
            <Text style={styles.sheetHeadline}>Safe Wayfinding Connection</Text>
          </View>
          <View style={styles.liveMatesBadge}>
            <MaterialIcons name="verified" size={14} color={Colors.onSecondaryFixedVariant} />
            <Text style={styles.liveMatesText}>Live Mates</Text>
          </View>
        </View>

        {/* Destination Search Bar */}
        <View style={styles.searchBarBox}>
          <MaterialIcons name="explore" size={22} color={Colors.primaryContainer} />
          <TextInput
            style={styles.searchInput}
            value={destination}
            onChangeText={setDestination}
            placeholder="Where are you trying to reach?"
            placeholderTextColor={Colors.onSurfaceVariant}
          />
          {destination.length > 0 && (
            <TouchableOpacity onPress={() => setDestination('')} style={styles.clearBtn}>
              <MaterialIcons name="close" size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Destination Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionLabel}>Nearby Walking Spots</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
            <TouchableOpacity
              style={[styles.presetChip, destination === 'Hostel Block & Gate' && styles.presetChipActive]}
              onPress={() => handlePresetSelect('Hostel Block & Gate')}
            >
              <MaterialIcons name="apartment" size={16} color={Colors.primaryContainer} />
              <Text style={styles.presetChipText}>Hostel Block & Gate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, destination === 'Library & Tech Block' && styles.presetChipActive]}
              onPress={() => handlePresetSelect('Library & Tech Block')}
            >
              <MaterialIcons name="menu-book" size={16} color={Colors.secondaryLive} />
              <Text style={styles.presetChipText}>Library & Tech Block</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, destination === 'Food Court & Canteen' && styles.presetChipActive]}
              onPress={() => handlePresetSelect('Food Court & Canteen')}
            >
              <MaterialIcons name="restaurant" size={16} color={Colors.primary} />
              <Text style={styles.presetChipText}>Food Court & Canteen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, destination === 'Safe Haven / Health Center' && styles.presetChipActive]}
              onPress={() => handlePresetSelect('Safe Haven / Health Center')}
            >
              <MaterialIcons name="local-hospital" size={16} color={Colors.primaryContainer} />
              <Text style={styles.presetChipText}>Safe Haven / Medicals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, destination === 'Main Arch & Auto Stand' && styles.presetChipActive]}
              onPress={() => handlePresetSelect('Main Arch & Auto Stand')}
            >
              <MaterialIcons name="local-taxi" size={16} color={Colors.secondaryLive} />
              <Text style={styles.presetChipText}>Main Arch & Autos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetChip, destination === 'Krishnankoil Bus Stop' && styles.presetChipActive]}
              onPress={() => handlePresetSelect('Krishnankoil Bus Stop')}
            >
              <MaterialIcons name="directions-bus" size={16} color={Colors.outline} />
              <Text style={styles.presetChipText}>Krishnankoil Bus Stop</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Top Recommended Guide Preview Card */}
        {topGuide && (
          <TouchableOpacity
            style={styles.topGuideCard}
            onPress={() => onSelectSpecificGuide && onSelectSpecificGuide(topGuide)}
            activeOpacity={0.9}
          >
            <View style={styles.guideAvatarWrapper}>
              <Image source={{ uri: topGuide.avatarUrl }} style={styles.guideAvatarImg} />
              <View style={styles.guideStatusBadge} />
            </View>

            <View style={styles.guideMetaCol}>
              <View style={styles.guideNameRow}>
                <View style={styles.guideNameVerified}>
                  <Text style={styles.guideNameText}>{topGuide.name}</Text>
                  <MaterialIcons name="verified" size={16} color={Colors.secondaryLive} />
                </View>
                <Text style={styles.distanceMetricText}>{topGuide.distance}</Text>
              </View>

              <View style={styles.guideRatingRow}>
                <MaterialIcons name="star" size={14} color={Colors.amber} />
                <Text style={styles.guideRatingText}>
                  {topGuide.rating} ({topGuide.reviewCount} walks)
                </Text>
                <Text style={styles.dotDivider}>•</Text>
                <Text style={styles.languagesText} numberOfLines={1}>
                  {topGuide.languages.slice(0, 2).join(', ')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Main CTA: Find a Local Guide Now */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.findGuideBtn}
            onPress={() => onRequestGuide(destination, location)}
            activeOpacity={0.88}
          >
            <MaterialIcons name="record-voice-over" size={22} color={Colors.onPrimary} />
            <Text style={styles.findGuideBtnText}>Find a Local Guide Now</Text>
          </TouchableOpacity>

          <View style={styles.dispatchTimeNotice}>
            <MaterialIcons name="bolt" size={15} color={Colors.secondaryLive} />
            <Text style={styles.dispatchTimeText}>
              Average dispatch time: <Text style={styles.boldText}>45 secs</Text> • 14 verified guides online
            </Text>
          </View>
        </View>
      </View>

      {/* Route Safety Features Strip */}
      <View style={styles.safetyFeaturesContainer}>
        <View style={styles.safetySectionHeader}>
          <Text style={styles.safetySectionTitle}>Route Safety Features</Text>
          <Text style={styles.alwaysEnabledText}>Always Enabled</Text>
        </View>

        <View style={styles.safetyGrid}>
          <View style={styles.safetyCard}>
            <View style={styles.safetyIconBoxPrimary}>
              <MaterialIcons name="lock" size={18} color={Colors.primaryContainer} />
            </View>
            <View style={styles.safetyTextCol}>
              <Text style={styles.safetyCardTitle}>Audio Guard</Text>
              <Text style={styles.safetyCardDesc}>Encrypted live mic sharing during active guidance walk.</Text>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <View style={styles.safetyIconBoxSecondary}>
              <MaterialIcons name="share-location" size={18} color={Colors.secondaryLive} />
            </View>
            <View style={styles.safetyTextCol}>
              <Text style={styles.safetyCardTitle}>Realtime Beacon</Text>
              <Text style={styles.safetyCardDesc}>Emergency contacts receive your live path updates.</Text>
            </View>
          </View>
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
  permissionAlertBox: {
    margin: Spacing.gutter,
    padding: 12,
    backgroundColor: Colors.errorContainer,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconCol: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTextCol: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onErrorContainer,
  },
  alertDescription: {
    fontSize: 12,
    color: Colors.onErrorContainer,
    marginTop: 2,
  },
  alertBtn: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Colors.tertiaryCrimson,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
  },
  alertBtnText: {
    color: Colors.onTertiary,
    fontSize: 12,
    fontWeight: '700',
  },
  mapWrapper: {
    position: 'relative',
  },
  activeGuidesPill: {
    position: 'absolute',
    bottom: 24,
    right: Spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    ...Elevation.level2,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  activeGuidesText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
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
    width: 40,
    height: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDotRing: {
    width: 12,
    height: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDotCore: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  sheetHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.2,
  },
  liveMatesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  liveMatesText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSecondaryFixedVariant,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    height: 52,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  clearBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetsSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  presetsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  presetChipActive: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  topGuideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 12,
    borderRadius: Radii.lg,
  },
  guideAvatarWrapper: {
    position: 'relative',
  },
  guideAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
  },
  guideStatusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
  },
  guideMetaCol: {
    flex: 1,
  },
  guideNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideNameVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  distanceMetricText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryLive,
  },
  guideRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  guideRatingText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  dotDivider: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  languagesText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  ctaSection: {
    gap: 8,
    marginTop: 4,
  },
  findGuideBtn: {
    height: 54,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Elevation.level2,
  },
  findGuideBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  dispatchTimeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dispatchTimeText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  safetyFeaturesContainer: {
    paddingHorizontal: Spacing.gutter,
    marginTop: 16,
    gap: 10,
  },
  safetySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safetySectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  alwaysEnabledText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryContainer,
  },
  safetyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  safetyCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 12,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  safetyIconBoxPrimary: {
    width: 32,
    height: 32,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyIconBoxSecondary: {
    width: 32,
    height: 32,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyTextCol: {
    flex: 1,
  },
  safetyCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  safetyCardDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 14,
    marginTop: 2,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    marginHorizontal: Spacing.gutter,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHighest,
    gap: 10,
  },
  currentLocationIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0, 55, 176, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationTextBox: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  currentLocationValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    marginTop: 1,
  },
  refreshLocBtn: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
