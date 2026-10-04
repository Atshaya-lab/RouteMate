import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface SessionStatusBarProps {
  guideName: string;
  destination: string;
  durationSeconds: number;
  isEncrypted: boolean;
}

export const SessionStatusBar: React.FC<SessionStatusBarProps> = ({
  guideName,
  destination,
  durationSeconds,
  isEncrypted,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.statusBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>LIVE ESCORT • {formatTime(durationSeconds)}</Text>
        </View>
        {isEncrypted && (
          <View style={styles.encryptionBadge}>
            <MaterialIcons name="lock" size={12} color="#006b5b" />
            <Text style={styles.encryptionText}>256-bit Encrypted</Text>
          </View>
        )}
      </View>
      <Text style={styles.guideTitle}>Guide: {guideName}</Text>
      <Text style={styles.destinationText}>Destination: {destination}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0037b0',
    letterSpacing: 0.5,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b8eedc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  encryptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#002019',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c20',
  },
  destinationText: {
    fontSize: 12,
    color: '#43474e',
  },
});
