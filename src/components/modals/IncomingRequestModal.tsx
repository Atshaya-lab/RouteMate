import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Vibration,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../../theme/tokens';
import { TripRequest } from '../../types';

interface IncomingRequestModalProps {
  visible: boolean;
  request: TripRequest | null;
  onAccept: (request: TripRequest) => void;
  onDecline: (request: TripRequest) => void;
}

export const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
  visible,
  request,
  onAccept,
  onDecline,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && request) {
      // Calculate remaining seconds from server expiresAt timestamp
      const diff = Math.max(0, Math.floor((request.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff > 0 ? diff : 30);

      try {
        Vibration.vibrate([0, 300, 200, 300]);
      } catch {}

      const interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onDecline(request);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();

      return () => {
        clearInterval(interval);
        loop.stop();
      };
    }
  }, [visible, request]);

  if (!visible || !request) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
          {/* Top Banner Alert */}
          <View style={styles.alertHeader}>
            <View style={styles.alertIconBadge}>
              <MaterialIcons name="notifications-active" size={20} color={Colors.primary} />
            </View>
            <View style={styles.alertTitleCol}>
              <Text style={styles.alertTitle}>Incoming Escort Request</Text>
              <Text style={styles.alertSubtitle}>Wayfinding companion needed</Text>
            </View>
            <View style={styles.timerBadge}>
              <MaterialIcons name="timer" size={14} color={Colors.tertiaryCrimson} />
              <Text style={styles.timerText}>{secondsRemaining}s</Text>
            </View>
          </View>

          {/* Traveler Details */}
          <View style={styles.travelerBox}>
            <Image source={{ uri: request.travelerAvatar }} style={styles.travelerAvatar} />
            <View style={styles.travelerInfo}>
              <Text style={styles.travelerName}>{request.travelerName}</Text>
              <View style={styles.destinationRow}>
                <MaterialIcons name="place" size={16} color={Colors.primary} />
                <Text style={styles.destinationText} numberOfLines={1}>
                  {request.destination}
                </Text>
              </View>
              <Text style={styles.phoneText}>Encrypted Call • {request.selectedMode.toUpperCase()}</Text>
            </View>
          </View>

          {/* Earnings Preview */}
          <View style={styles.payoutBox}>
            <Text style={styles.payoutLabel}>Estimated Payout</Text>
            <Text style={styles.payoutAmount}>$8.00 <Text style={styles.payoutTime}>(15-min walk)</Text></Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => onDecline(request)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAccept(request)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check" size={22} color={Colors.onPrimary} />
              <Text style={styles.acceptText}>Accept Escort</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.gutter,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    ...Elevation.level3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  alertIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitleCol: {
    flex: 1,
    marginLeft: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  alertSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onTertiaryFixedVariant,
  },
  travelerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 14,
    padding: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.lg,
  },
  travelerAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radii.full,
  },
  travelerInfo: {
    flex: 1,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  destinationText: {
    fontSize: 13,
    color: Colors.primaryContainer,
    fontWeight: '600',
    flex: 1,
  },
  phoneText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  payoutBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radii.md,
    marginBottom: 16,
  },
  payoutLabel: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.secondaryLive,
  },
  payoutTime: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  acceptButton: {
    flex: 2,
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.secondaryLive,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    ...Elevation.level2,
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
});
