import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface NoGuideFallbackScreenProps {
  destination: string;
  onBackHome: () => void;
}

export const NoGuideFallbackScreen: React.FC<NoGuideFallbackScreenProps> = ({
  destination,
  onBackHome,
}) => {
  const steps = [
    'Head along the illuminated pedestrian walkway (120m)',
    'Pass the 24/7 emergency sentinel station on your left (80m)',
    'Arrive safely at destination safe haven',
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Offline Prep Banner */}
      <View style={styles.banner}>
        <MaterialIcons name="offline-pin" size={20} color="#006b5b" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Auto-Loaded Offline Pedestrian Route</Text>
          <Text style={styles.bannerSub}>
            Turn vectors and safe-haven waypoints are pre-cached to storage.
          </Text>
        </View>
      </View>

      {/* Mapbox Route Preview */}
      <View style={styles.mapCard}>
        <MaterialIcons name="directions-walk" size={32} color="#0037b0" />
        <Text style={styles.mapCardTitle}>Verified Safe-Corridor Route</Text>
        <Text style={styles.mapCardSub}>To: {destination} (350m • 4 mins walk)</Text>
      </View>

      {/* Turn-by-Turn Steps */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Step-by-Step Directions</Text>
        {steps.map((step, idx) => (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>{idx + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Back to Home Button */}
      <TouchableOpacity style={styles.backBtn} onPress={onBackHome} activeOpacity={0.85}>
        <MaterialIcons name="arrow-back" size={18} color="#ffffff" />
        <Text style={styles.backBtnText}>Return to Explore</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 90,
  },
  banner: {
    backgroundColor: '#b8eedc',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002019',
  },
  bannerSub: {
    fontSize: 11,
    color: '#005144',
    marginTop: 2,
  },
  mapCard: {
    height: 180,
    backgroundColor: '#eff0f7',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e0ff',
  },
  mapCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0037b0',
  },
  mapCardSub: {
    fontSize: 12,
    color: '#73777f',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#73777f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0037b0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#1a1c20',
  },
  backBtn: {
    height: 50,
    backgroundColor: '#0037b0',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
