import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Elevation } from '../../theme/tokens';
import { UserRole } from '../../types';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  userRole?: UserRole;
  onToggleRole?: () => void;
  avatarUrl?: string;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Explore Map',
  subtitle = 'RouteMate',
  showBack = false,
  onBack,
  userRole = 'traveler',
  onToggleRole,
  avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhlQT9am7-K9l0E8HNIXDfK0bN-G661Y1zSw-UFYNyTMQaUHJ-UnTEshZ5e_GSF7waHHAfVIk6mwkBilYF1NRPtmRmEO-HNBymTKsB6Zw4UeVuusG_8HIVM2L0N_PVghpHbZFihUulIDYgornlgmUrt7JZERHuXyvwWt6soGX01gwcE6J6UYdWLFymPfUT9QA89rhqbgmQc8yJcvv31-uExTdNtNuQ14cGd-C5i7F7lk8V9reYGwuo',
  onProfilePress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.leftRow}>
          {showBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="arrow-back-ios" size={20} color={Colors.onSurface} />
            </TouchableOpacity>
          )}

          <View style={styles.logoBadge}>
            <MaterialIcons name="navigation" size={20} color={Colors.primary} />
          </View>

          <View style={styles.titleColumn}>
            <Text style={styles.brandTitle}>{subtitle}</Text>
            <Text style={styles.screenTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        <View style={styles.rightRow}>
          {onToggleRole && (
            <TouchableOpacity
              onPress={onToggleRole}
              style={[
                styles.roleToggle,
                userRole === 'guide' ? styles.roleToggleGuide : styles.roleToggleTraveler,
              ]}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="navigation"
                size={16}
                color={userRole === 'guide' ? Colors.onPrimary : Colors.secondaryLive}
              />
              <Text
                style={[
                  styles.roleToggleText,
                  userRole === 'guide' ? styles.roleToggleTextGuide : styles.roleToggleTextTraveler,
                ]}
              >
                {userRole === 'guide' ? 'Guide Mode' : 'Live'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onProfilePress}
            style={styles.profileButton}
            accessibilityLabel="Profile"
          >
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 50,
  },
  content: {
    height: 60,
    paddingHorizontal: Spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: Radii.default,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
    letterSpacing: -0.2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  roleToggleTraveler: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  roleToggleGuide: {
    backgroundColor: Colors.primaryContainer,
  },
  roleToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleToggleTextTraveler: {
    color: Colors.onSurface,
  },
  roleToggleTextGuide: {
    color: Colors.onPrimary,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
  },
});
