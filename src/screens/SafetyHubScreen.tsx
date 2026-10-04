import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { LocationCoordinate } from '../types';

interface SafetyHubScreenProps {
  travelerLocation: LocationCoordinate;
  onTriggerSOS: () => void;
}

export const SafetyHubScreen: React.FC<SafetyHubScreenProps> = ({
  travelerLocation,
  onTriggerSOS,
}) => {
  const handleCall112 = () => {
    Linking.openURL('tel:112');
  };

  const handleSimulateFakeCall = () => {
    Alert.alert(
      'Fake Check-in Call Simulated',
      'Incoming simulated safety call triggered. Your ringtone will sound in 5 seconds to help you gracefully exit an uncomfortable situation.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 24/7 Security Sentinel Banner */}
      <View style={styles.sentinelCard}>
        <View style={styles.sentinelHeader}>
          <View style={styles.sentinelIconBadge}>
            <MaterialIcons name="security" size={24} color={Colors.secondaryLive} />
          </View>
          <View style={styles.sentinelInfo}>
            <Text style={styles.sentinelTitle}>RouteMate Security Sentinel</Text>
            <View style={styles.statusLiveRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusLiveText}>Armed & Monitoring 24/7</Text>
            </View>
          </View>
        </View>
        <Text style={styles.sentinelBody}>
          Every active escort walk is tracked with real-time GPS telemetry, dead-man check-in timers, and instant local responder dispatch.
        </Text>
      </View>

      {/* Immediate Emergency Triggers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Escalation</Text>

        <TouchableOpacity
          style={styles.sosBannerBtn}
          onPress={onTriggerSOS}
          activeOpacity={0.88}
        >
          <View style={styles.sosIconCircle}>
            <MaterialIcons name="sos" size={28} color={Colors.onTertiary} />
          </View>
          <View style={styles.sosTextCol}>
            <Text style={styles.sosBannerTitle}>Trigger Emergency SOS</Text>
            <Text style={styles.sosBannerSub}>
              Transmits coordinates (Lat: {travelerLocation.latitude.toFixed(4)}, Lng: {travelerLocation.longitude.toFixed(4)}) to 3 contacts
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={Colors.onTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.call112Btn}
          onPress={handleCall112}
          activeOpacity={0.85}
        >
          <MaterialIcons name="phone-in-talk" size={20} color={Colors.tertiaryCrimson} />
          <Text style={styles.call112Text}>Direct Dial Emergency Desk (112 / 911)</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Tools & Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Tools</Text>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={handleSimulateFakeCall}
          activeOpacity={0.8}
        >
          <View style={styles.toolIconBg}>
            <MaterialIcons name="phone-callback" size={20} color={Colors.primaryContainer} />
          </View>
          <View style={styles.toolTextCol}>
            <Text style={styles.toolTitle}>Fake Check-in Call</Text>
            <Text style={styles.toolDesc}>Triggers an incoming call simulation in 5 seconds.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
        </TouchableOpacity>

        <View style={styles.toolItem}>
          <View style={styles.toolIconBg}>
            <MaterialIcons name="share-location" size={20} color={Colors.secondaryLive} />
          </View>
          <View style={styles.toolTextCol}>
            <Text style={styles.toolTitle}>Realtime Beacon Broadcast</Text>
            <Text style={styles.toolDesc}>Live link sent to 2 trusted emergency contacts.</Text>
          </View>
          <Text style={styles.activeStatusPill}>Active</Text>
        </View>

        <View style={styles.toolItem}>
          <View style={styles.toolIconBg}>
            <MaterialIcons name="mic" size={20} color={Colors.primary} />
          </View>
          <View style={styles.toolTextCol}>
            <Text style={styles.toolTitle}>Audio Guard Mic Encryption</Text>
            <Text style={styles.toolDesc}>Live audio stream is end-to-end encrypted.</Text>
          </View>
          <Text style={styles.activeStatusPill}>Active</Text>
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
    padding: Spacing.gutter,
    gap: 16,
    paddingBottom: 120,
  },
  sentinelCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: 16,
    ...Elevation.level2,
    gap: 10,
  },
  sentinelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sentinelIconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentinelInfo: {
    flex: 1,
  },
  sentinelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statusLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  statusLiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryLive,
  },
  sentinelBody: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 17,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sosBannerBtn: {
    backgroundColor: Colors.tertiaryCrimson,
    borderRadius: Radii.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Elevation.level3,
  },
  sosIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosTextCol: {
    flex: 1,
  },
  sosBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onTertiary,
  },
  sosBannerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    lineHeight: 14,
  },
  call112Btn: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.tertiaryFixedDim,
  },
  call112Text: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tertiaryCrimson,
  },
  toolItem: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Elevation.level1,
  },
  toolIconBg: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolTextCol: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  toolDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  activeStatusPill: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryLive,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
});
