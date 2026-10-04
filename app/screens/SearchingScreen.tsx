import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface SearchingScreenProps {
  destination: string;
  searchRadiusKm: number;
  onFoundGuides: () => void;
  onFallback: () => void;
  onCancel: () => void;
}

export const SearchingScreen: React.FC<SearchingScreenProps> = ({
  destination,
  searchRadiusKm,
  onFoundGuides,
  onFallback,
  onCancel,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.radarCard}>
        <View style={styles.pulseContainer}>
          <View style={styles.radarPulseOuter} />
          <View style={styles.radarPulseMiddle} />
          <View style={styles.radarCenter}>
            <MaterialIcons name="radar" size={32} color="#0037b0" />
          </View>
        </View>

        <Text style={styles.searchingTitle}>Scanning for Nearby Guides</Text>
        <Text style={styles.searchingSub}>
          Searching within {searchRadiusKm.toFixed(1)} km of your physical location
        </Text>
        <Text style={styles.timerText}>Timeout: {secondsRemaining}s</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.destLabel}>Destination</Text>
        <Text style={styles.destValue}>{destination}</Text>

        <View style={styles.metaRow}>
          <MaterialIcons name="security" size={16} color="#006b5b" />
          <Text style={styles.metaText}>Only government-verified companions are notified</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.simulateFoundBtn} onPress={onFoundGuides} activeOpacity={0.85}>
          <MaterialIcons name="people" size={18} color="#ffffff" />
          <Text style={styles.simulateFoundText}>View Responding Guides (Demo)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fallbackBtn} onPress={onFallback} activeOpacity={0.85}>
          <MaterialIcons name="offline-bolt" size={18} color="#0037b0" />
          <Text style={styles.fallbackText}>Test No Guide Found Fallback</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
          <Text style={styles.cancelText}>Cancel Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
    padding: 24,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  radarCard: {
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  pulseContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarPulseOuter: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(0, 55, 176, 0.08)',
  },
  radarPulseMiddle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 55, 176, 0.15)',
  },
  radarCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1c20',
  },
  searchingSub: {
    fontSize: 13,
    color: '#43474e',
    textAlign: 'center',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#73777f',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  destLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#73777f',
    textTransform: 'uppercase',
  },
  destValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c20',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#006b5b',
    fontWeight: '600',
  },
  buttonGroup: {
    gap: 10,
  },
  simulateFoundBtn: {
    height: 50,
    backgroundColor: '#0037b0',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  simulateFoundText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  fallbackBtn: {
    height: 48,
    backgroundColor: '#eff0f7',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0037b0',
  },
  cancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ba1a1a',
  },
});
