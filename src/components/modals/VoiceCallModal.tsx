import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../../theme/tokens';
import { GuideProfile } from '../../types';

interface VoiceCallModalProps {
  visible: boolean;
  guide: GuideProfile | null;
  startedAt: number;
  onEndCall: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  visible,
  guide,
  startedAt,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [durationText, setDurationText] = useState('00:00');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      const interval = setInterval(() => {
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(elapsedSeconds % 60).padStart(2, '0');
        setDurationText(`${mins}:${secs}`);
      }, 1000);

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        ])
      );
      loop.start();

      return () => {
        clearInterval(interval);
        loop.stop();
      };
    }
  }, [visible, startedAt]);

  if (!visible || !guide) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header Security Status */}
          <View style={styles.headerBadge}>
            <MaterialIcons name="lock" size={14} color={Colors.secondaryLive} />
            <Text style={styles.headerBadgeText}>256-Bit Encrypted Audio Guard</Text>
          </View>

          {/* Guide Avatar with Audio Waves */}
          <View style={styles.avatarSection}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <Image source={{ uri: guide.avatarUrl }} style={styles.avatar} />
            <View style={styles.liveIndicator}>
              <View style={styles.greenDot} />
            </View>
          </View>

          <Text style={styles.guideName}>{guide.name}</Text>
          <Text style={styles.specialtyText}>{guide.specialty || 'Verified Escort Guide'}</Text>
          <Text style={styles.callDuration}>{durationText}</Text>

          {/* Call Controls */}
          <View style={styles.controlsRow}>
            {/* Mute Button */}
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
              onPress={() => setIsMuted(!isMuted)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={isMuted ? 'mic-off' : 'mic'}
                size={26}
                color={isMuted ? Colors.onPrimary : Colors.onSurface}
              />
              <Text style={[styles.controlLabel, isMuted && styles.controlLabelActive]}>
                {isMuted ? 'Muted' : 'Mute'}
              </Text>
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={onEndCall}
              activeOpacity={0.8}
            >
              <MaterialIcons name="call-end" size={32} color={Colors.onTertiary} />
            </TouchableOpacity>

            {/* Speaker Button */}
            <TouchableOpacity
              style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
              onPress={() => setIsSpeaker(!isSpeaker)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={isSpeaker ? 'volume-up' : 'volume-down'}
                size={26}
                color={isSpeaker ? Colors.onPrimary : Colors.onSurface}
              />
              <Text style={[styles.controlLabel, isSpeaker && styles.controlLabelActive]}>
                Speaker
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.audioGuardNote}>
            Audio is streamed through RouteMate voice relay. Your personal phone number remains private.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
    ...Elevation.level3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    marginBottom: 20,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSecondaryContainer,
  },
  avatarSection: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(5, 150, 105, 0.18)',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radii.full,
    borderWidth: 3,
    borderColor: Colors.secondaryLive,
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  guideName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  specialtyText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  callDuration: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryContainer,
    fontVariant: ['tabular-nums'],
    marginVertical: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: Colors.primaryContainer,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  controlLabelActive: {
    color: Colors.onPrimary,
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.tertiaryCrimson,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.level4SOS,
  },
  audioGuardNote: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
