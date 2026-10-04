import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../../theme/tokens';
import { SOSAlert } from '../../types';

interface SOSAlertModalProps {
  visible: boolean;
  alert: SOSAlert | null;
  onDismiss: () => void;
}

export const SOSAlertModal: React.FC<SOSAlertModalProps> = ({
  visible,
  alert,
  onDismiss,
}) => {
  if (!visible || !alert) return null;

  const handleCallEmergency = () => {
    // 112 in EU / 911 in US
    Linking.openURL('tel:112');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Pulsing Emergency Header */}
          <View style={styles.iconContainer}>
            <View style={styles.iconPulse} />
            <View style={styles.iconBadge}>
              <MaterialIcons name="warning" size={36} color={Colors.onTertiary} />
            </View>
          </View>

          <Text style={styles.title}>EMERGENCY SOS ACTIVATED</Text>
          <Text style={styles.subtitle}>
            Your live GPS coordinate has been transmitted to RouteMate Central Dispatch and your emergency contacts.
          </Text>

          {/* Telemetry Box */}
          <View style={styles.telemetryBox}>
            <View style={styles.telemetryRow}>
              <MaterialIcons name="gps-fixed" size={16} color={Colors.secondaryLive} />
              <Text style={styles.telemetryText}>
                Lat: {alert.location.latitude.toFixed(5)}, Lng: {alert.location.longitude.toFixed(5)}
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <MaterialIcons name="security" size={16} color={Colors.primary} />
              <Text style={styles.telemetryText}>
                Responders Alerted: {alert.respondersNotified} Verified Units
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <MaterialIcons name="lock" size={16} color={Colors.onSurfaceVariant} />
              <Text style={styles.telemetryText}>Audio Guard Encrypted Channel Live</Text>
            </View>
          </View>

          {/* Quick Call Action */}
          <TouchableOpacity
            style={styles.emergencyCallBtn}
            onPress={handleCallEmergency}
            activeOpacity={0.8}
          >
            <MaterialIcons name="phone-in-talk" size={24} color={Colors.onTertiary} />
            <Text style={styles.emergencyCallText}>Call Local Emergency (112 / 911)</Text>
          </TouchableOpacity>

          {/* Safe Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>I Am Safe • Deactivate SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.gutter,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Elevation.level4SOS,
  },
  iconContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconPulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: Colors.tertiaryCrimson,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.tertiaryCrimson,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  telemetryBox: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.md,
    padding: 12,
    marginVertical: 18,
    gap: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  emergencyCallBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.tertiaryCrimson,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Elevation.level3,
  },
  emergencyCallText: {
    color: Colors.onTertiary,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
});
