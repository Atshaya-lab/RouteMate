import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface SOSButtonProps {
  onTriggerSOS: () => void;
  isTriggering?: boolean;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTriggerSOS, isTriggering = false }) => {
  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={onTriggerSOS}
      activeOpacity={0.85}
      accessibilityLabel="Emergency SOS Beacon"
    >
      <View style={styles.pulseRing} />
      <MaterialIcons name="emergency-share" size={24} color="#ffffff" />
      <Text style={styles.buttonText}>{isTriggering ? 'ACTIVE' : 'SOS'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ba1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#ba1a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 9999,
  },
  pulseRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(186, 26, 26, 0.4)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
