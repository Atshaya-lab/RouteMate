import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii } from '../../theme/tokens';

interface SOSButtonProps {
  onTriggerSOS: () => void;
  style?: any;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTriggerSOS, style }) => {
  const [isPressing, setIsPressing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Ambient breathing pulse
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handlePressIn = () => {
    setIsPressing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    // Animate the circular fill over 1.5 seconds (hold to confirm)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      try {
        Vibration.vibrate([0, 200, 100, 400]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setIsPressing(false);
      progressAnim.setValue(0);
      onTriggerSOS();
    }, 1500);
  };

  const handlePressOut = () => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const ringScale = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const ringOpacity = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.9],
  });

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.holdRing,
          {
            transform: [{ scale: isPressing ? ringScale : pulseAnim }],
            opacity: ringOpacity,
          },
        ]}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, isPressing && styles.buttonActive]}
        accessibilityLabel="Emergency SOS Hold 1.5 seconds to alert"
        accessibilityRole="button"
      >
        <MaterialIcons name="sos" size={28} color={Colors.onTertiary} />
        <Text style={styles.buttonLabel}>
          {isPressing ? 'HOLD' : 'SOS'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    zIndex: 99,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holdRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.tertiaryCrimson,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.tertiaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.level4SOS,
  },
  buttonActive: {
    backgroundColor: Colors.tertiary,
    transform: [{ scale: 0.95 }],
  },
  buttonLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -2,
  },
});
