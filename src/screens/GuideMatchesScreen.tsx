import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { GuideProfile, LocationCoordinate, ActiveSession } from '../types';
import { LiveMapView } from '../components/map/LiveMapView';
import { acceptTripRequest } from '../services/api';

interface GuideMatchesScreenProps {
  travelerLocation: LocationCoordinate;
  guides: GuideProfile[];
  requestId: string;
  onConnectGuide: (session: ActiveSession) => void;
}

export const GuideMatchesScreen: React.FC<GuideMatchesScreenProps> = ({
  travelerLocation,
  guides,
  requestId,
  onConnectGuide,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'fastest' | 'in_person' | 'english' | 'verified'>('fastest');
  const [selectedMode, setSelectedMode] = useState<'call' | 'chat' | 'meetup'>('call');
  const [selectedGuide, setSelectedGuide] = useState<GuideProfile>(guides[0] || null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async (guide: GuideProfile) => {
    setLoading(true);
    try {
      const session = await acceptTripRequest(requestId, guide.id);
      session.mode = selectedMode;
      setLoading(false);
      onConnectGuide(session);
    } catch {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Dynamic Map Substrate */}
      <View style={styles.mapWrapper}>
        <LiveMapView
          travelerLocation={travelerLocation}
          guides={guides}
          selectedGuide={selectedGuide}
          onSelectGuide={setSelectedGuide}
          height={320}
        />

        {/* Floating Top Shield Banner */}
        <View style={styles.shieldBanner}>
          <View style={styles.shieldBadge}>
            <MaterialIcons name="verified-user" size={16} color={Colors.secondaryLive} />
            <Text style={styles.shieldBadgeText}>LIVE SAFETY SHIELD ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* Multi-State Interactive Sheet Surface */}
      <View style={styles.sheetContainer}>
        <View style={styles.dragHandleBar} />

        {/* Sheet Header Section */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.sheetTitle}>{guides.length} Verified Guides Ready</Text>
              <View style={styles.greenPulseDot} />
            </View>
            <View style={styles.locationPill}>
              <Text style={styles.locationPillText}>Old Town Central</Text>
            </View>
          </View>
          <Text style={styles.sheetSubtitle}>
            Average local dispatch time is under 3 minutes
          </Text>

          {/* Scrollable Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'fastest' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('fastest')}
            >
              <MaterialIcons
                name="bolt"
                size={16}
                color={selectedFilter === 'fastest' ? Colors.onPrimary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.filterChipText, selectedFilter === 'fastest' && styles.filterChipTextActive]}>
                Fastest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'in_person' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('in_person')}
            >
              <MaterialIcons
                name="directions-walk"
                size={16}
                color={selectedFilter === 'in_person' ? Colors.onPrimary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.filterChipText, selectedFilter === 'in_person' && styles.filterChipTextActive]}>
                In-Person
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'english' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('english')}
            >
              <MaterialIcons
                name="translate"
                size={16}
                color={selectedFilter === 'english' ? Colors.onPrimary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.filterChipText, selectedFilter === 'english' && styles.filterChipTextActive]}>
                Speaks English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'verified' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('verified')}
            >
              <MaterialIcons
                name="verified"
                size={16}
                color={selectedFilter === 'verified' ? Colors.onPrimary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.filterChipText, selectedFilter === 'verified' && styles.filterChipTextActive]}>
                Police Checked
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Guides List Section */}
        <View style={styles.guidesListSection}>
          {guides.map((guide, idx) => {
            const isTopMatch = idx === 0;
            return (
              <View key={guide.id} style={[styles.guideCard, isTopMatch && styles.guideCardHighlight]}>
                {/* High Priority Match Badge Ribbon */}
                {isTopMatch && (
                  <View style={styles.ribbonRow}>
                    <View style={styles.topMatchPill}>
                      <MaterialIcons name="stars" size={14} color={Colors.onSecondaryFixedVariant} />
                      <Text style={styles.topMatchText}>Top Match • {guide.eta}</Text>
                    </View>
                    <View style={styles.speedPill}>
                      <MaterialIcons name="speed" size={14} color={Colors.primaryContainer} />
                      <Text style={styles.speedText}>Responds &lt;1m</Text>
                    </View>
                  </View>
                )}

                {/* Profile Top Row */}
                <View style={styles.profileRow}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: guide.avatarUrl }} style={styles.guideAvatarLarge} />
                    <View style={styles.guideLiveIndicator} />
                  </View>

                  <View style={styles.guideDetailCol}>
                    <View style={styles.namePriceRow}>
                      <Text style={styles.guideFullName}>{guide.name}</Text>
                      <Text style={styles.guidePriceText}>${guide.pricePerSession}</Text>
                    </View>

                    <View style={styles.ratingSessionsRow}>
                      <MaterialIcons name="star" size={15} color={Colors.amber} />
                      <Text style={styles.ratingNumber}>{guide.rating}</Text>
                      <Text style={styles.sessionsCountText}>({guide.reviewCount} guided sessions)</Text>
                    </View>

                    <View style={styles.distanceSpecialtyRow}>
                      <MaterialIcons name="near-me" size={14} color={Colors.onSurfaceVariant} />
                      <Text style={styles.distanceText}>{guide.distance}</Text>
                      <Text style={styles.dotDivider}>•</Text>
                      <Text style={styles.specialtySnippet} numberOfLines={1}>
                        {guide.specialty}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Language Proficiency Chips */}
                <View style={styles.languagesRow}>
                  {guide.languages.map((lang, lIdx) => (
                    <View key={lIdx} style={styles.langPill}>
                      <Text style={styles.langText}>{lang}</Text>
                    </View>
                  ))}
                </View>

                {/* Mode Selector (for Top Match) or Select CTA */}
                {isTopMatch ? (
                  <>
                    <View style={styles.modeSelectorBox}>
                      <TouchableOpacity
                        style={[styles.modeToggleBtn, selectedMode === 'call' && styles.modeToggleBtnActive]}
                        onPress={() => setSelectedMode('call')}
                      >
                        <MaterialIcons
                          name="call"
                          size={16}
                          color={selectedMode === 'call' ? Colors.onPrimary : Colors.onSurfaceVariant}
                        />
                        <Text
                          style={[
                            styles.modeToggleText,
                            selectedMode === 'call' && styles.modeToggleTextActive,
                          ]}
                        >
                          Call
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modeToggleBtn, selectedMode === 'chat' && styles.modeToggleBtnActive]}
                        onPress={() => setSelectedMode('chat')}
                      >
                        <MaterialIcons
                          name="chat"
                          size={16}
                          color={selectedMode === 'chat' ? Colors.onPrimary : Colors.onSurfaceVariant}
                        />
                        <Text
                          style={[
                            styles.modeToggleText,
                            selectedMode === 'chat' && styles.modeToggleTextActive,
                          ]}
                        >
                          Chat
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modeToggleBtn, selectedMode === 'meetup' && styles.modeToggleBtnActive]}
                        onPress={() => setSelectedMode('meetup')}
                      >
                        <MaterialIcons
                          name="directions-walk"
                          size={16}
                          color={selectedMode === 'meetup' ? Colors.onPrimary : Colors.onSurfaceVariant}
                        />
                        <Text
                          style={[
                            styles.modeToggleText,
                            selectedMode === 'meetup' && styles.modeToggleTextActive,
                          ]}
                        >
                          Meetup
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Immediate Primary Connect CTA */}
                    <View style={styles.primaryCtaRow}>
                      <TouchableOpacity
                        style={styles.connectGuideBtn}
                        onPress={() => handleConnect(guide)}
                        activeOpacity={0.88}
                      >
                        <MaterialIcons name="connect-without-contact" size={20} color={Colors.onPrimary} />
                        <Text style={styles.connectGuideBtnText}>
                          Connect with {guide.name.split(' ')[0]} (${guide.pricePerSession} / 15-min)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.previewVideoBtn}
                        onPress={() => Alert.alert('Video Intro', `${guide.name}'s verified voice & escort bio verified by RouteMate.`)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="play-circle" size={24} color={Colors.primaryContainer} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.secondaryCardFooter}>
                    <Text style={styles.availableNote}>Available for In-Person & Audio</Text>
                    <TouchableOpacity
                      style={styles.selectSmallBtn}
                      onPress={() => handleConnect(guide)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.selectSmallText}>Select</Text>
                      <MaterialIcons name="chevron-right" size={16} color={Colors.primaryContainer} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Safety Guarantee Micro-card */}
        <View style={styles.safetyGuaranteeCard}>
          <View style={styles.safetyIconBadge}>
            <MaterialIcons name="verified" size={20} color={Colors.secondaryLive} />
          </View>
          <View style={styles.safetyGuaranteeTextCol}>
            <Text style={styles.safetyGuaranteeTitle}>100% Identity Verified & Safe Walk</Text>
            <Text style={styles.safetyGuaranteeDesc}>
              Live telemetry shared with local emergency desks until safely concluded.
            </Text>
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
  mapWrapper: {
    position: 'relative',
  },
  shieldBanner: {
    position: 'absolute',
    top: 14,
    left: Spacing.gutter,
    right: Spacing.gutter,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    ...Elevation.level2,
  },
  shieldBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.6,
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
  sheetHeader: {
    gap: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  locationPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSecondaryContainer,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  filterChipActive: {
    backgroundColor: Colors.inverseSurface,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: Colors.inverseOnSurface,
  },
  guidesListSection: {
    gap: 12,
  },
  guideCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.xl,
    padding: 14,
    gap: 10,
  },
  guideCardHighlight: {
    borderWidth: 1.5,
    borderColor: Colors.primaryFixed,
  },
  ribbonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  topMatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  topMatchText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSecondaryFixedVariant,
    textTransform: 'uppercase',
  },
  speedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  guideAvatarLarge: {
    width: 58,
    height: 58,
    borderRadius: Radii.full,
  },
  guideLiveIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
  },
  guideDetailCol: {
    flex: 1,
  },
  namePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideFullName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  guidePriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  ratingSessionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  sessionsCountText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  distanceSpecialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  distanceText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  dotDivider: {
    fontSize: 11,
    color: Colors.outline,
  },
  specialtySnippet: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  languagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 8,
  },
  langPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  langText: {
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  modeSelectorBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 3,
    marginTop: 4,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  modeToggleBtnActive: {
    backgroundColor: Colors.primaryContainer,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  modeToggleTextActive: {
    color: Colors.onPrimary,
  },
  primaryCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  connectGuideBtn: {
    flex: 1,
    height: 50,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Elevation.level2,
  },
  connectGuideBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  previewVideoBtn: {
    width: 50,
    height: 50,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 8,
    marginTop: 2,
  },
  availableNote: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  selectSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
  },
  selectSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  safetyGuaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainer,
    padding: 12,
    borderRadius: Radii.lg,
    marginTop: 4,
  },
  safetyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyGuaranteeTextCol: {
    flex: 1,
  },
  safetyGuaranteeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  safetyGuaranteeDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 14,
    marginTop: 1,
  },
});
