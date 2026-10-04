import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { User, UserRole } from '../types';

import { PRESET_USERS } from '../services/auth';

interface ProfileSettingsScreenProps {
  user: User;
  onToggleRole: () => void;
  onSelectUser: (user: User) => void;
  onSignOut: () => void;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  user,
  onToggleRole,
  onSelectUser,
  onSignOut,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <Image source={{ uri: user.avatarUrl }} style={styles.profileAvatar} />
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userPhone}>{user.phoneNumber}</Text>

        <View style={styles.rolePill}>
          <MaterialIcons
            name={user.role === 'guide' ? 'handshake' : 'explore'}
            size={14}
            color={Colors.primaryContainer}
          />
          <Text style={styles.rolePillText}>
            {user.role === 'guide' ? 'Certified Local Guide' : 'Verified Traveler'}
          </Text>
        </View>
      </View>

      {/* Device Identity Selector (Multi-Device Setup) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select This Phone's Identity</Text>
        <View style={styles.personaRow}>
          {PRESET_USERS.map((p) => {
            const isSelected = p.id === user.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.personaChip, isSelected && styles.personaChipActive]}
                onPress={() => onSelectUser(p)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: p.avatarUrl }} style={styles.personaAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.personaName, isSelected && styles.personaNameActive]}>
                    {p.name}
                  </Text>
                  <Text style={[styles.personaRole, isSelected && styles.personaRoleActive]}>
                    {p.role === 'guide' ? '🛡️ Guide' : '🧭 Traveler'}
                  </Text>
                </View>
                {isSelected && (
                  <MaterialIcons name="check-circle" size={18} color={Colors.secondaryLive} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Role Switcher Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Mode Switch</Text>
        <TouchableOpacity
          style={styles.modeSwitchCard}
          onPress={onToggleRole}
          activeOpacity={0.85}
        >
          <View style={styles.modeIconBg}>
            <MaterialIcons
              name="sync-alt"
              size={22}
              color={user.role === 'guide' ? Colors.secondaryLive : Colors.primaryContainer}
            />
          </View>
          <View style={styles.modeTextCol}>
            <Text style={styles.modeTitle}>
              Switch to {user.role === 'guide' ? 'Traveler Mode' : 'Guide Mode'}
            </Text>
            <Text style={styles.modeSub}>
              {user.role === 'guide'
                ? 'Request companions and navigate unfamiliar areas'
                : 'Accept incoming companion escort requests and broadcast GPS'}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.outline} />
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts (SOS Beacon)</Text>
        <View style={styles.contactItem}>
          <View style={styles.contactAvatar}>
            <Text style={styles.contactInitials}>SM</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Sarah Morgan (Sister)</Text>
            <Text style={styles.contactPhone}>+1 (555) 392-1049</Text>
          </View>
          <View style={styles.beaconStatusPill}>
            <MaterialIcons name="check" size={12} color={Colors.secondaryLive} />
            <Text style={styles.beaconStatusText}>Linked</Text>
          </View>
        </View>

        <View style={styles.contactItem}>
          <View style={styles.contactAvatar}>
            <Text style={styles.contactInitials}>JM</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>James Miller (Friend)</Text>
            <Text style={styles.contactPhone}>+1 (555) 881-3920</Text>
          </View>
          <View style={styles.beaconStatusPill}>
            <MaterialIcons name="check" size={12} color={Colors.secondaryLive} />
            <Text style={styles.beaconStatusText}>Linked</Text>
          </View>
        </View>
      </View>

      {/* Security & Verification Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trust & Verification</Text>
        <View style={styles.badgeRowItem}>
          <MaterialIcons name="verified-user" size={20} color={Colors.secondaryLive} />
          <Text style={styles.badgeRowText}>Government ID Verified</Text>
          <MaterialIcons name="check-circle" size={16} color={Colors.secondaryLive} />
        </View>
        <View style={styles.badgeRowItem}>
          <MaterialIcons name="lock" size={20} color={Colors.primaryContainer} />
          <Text style={styles.badgeRowText}>256-Bit Telemetry Encryption</Text>
          <MaterialIcons name="check-circle" size={16} color={Colors.secondaryLive} />
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: onSignOut },
          ]);
        }}
        activeOpacity={0.8}
      >
        <MaterialIcons name="logout" size={18} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out of RouteMate</Text>
      </TouchableOpacity>
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
  profileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: 20,
    alignItems: 'center',
    ...Elevation.level2,
    gap: 4,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    marginTop: 8,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  personaRow: {
    gap: 8,
  },
  personaChip: {
    ...Elevation.level1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  personaChipActive: {
    borderColor: Colors.secondaryLive,
    backgroundColor: Colors.surfaceContainerLow,
  },
  personaAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
  },
  personaName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  personaNameActive: {
    color: Colors.primaryContainer,
  },
  personaRole: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  personaRoleActive: {
    color: Colors.secondaryLive,
    fontWeight: '700',
  },
  modeSwitchCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Elevation.level1,
  },
  modeIconBg: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTextCol: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modeSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  contactItem: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Elevation.level1,
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  contactPhone: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  beaconStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  beaconStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryContainer,
  },
  badgeRowItem: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Elevation.level1,
  },
  badgeRowText: {
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '600',
    flex: 1,
  },
  signOutBtn: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.errorContainer,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
  },
});
