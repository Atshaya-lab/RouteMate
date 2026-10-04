import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IncomingRequestModal } from '../components/IncomingRequestModal';
import { TripRequest } from '../types';

export interface GuideDashboardScreenProps {
  onSwitchToTraveler: () => void;
}

export const GuideDashboardScreen: React.FC<GuideDashboardScreenProps> = ({
  onSwitchToTraveler,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sampleRequest, setSampleRequest] = useState<TripRequest | null>({
    id: 'req-demo-1',
    travelerId: 'traveler-001',
    travelerName: 'Alex Morgan',
    travelerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    destination: 'Campus Central Library',
    pickupLocation: { latitude: 9.5747, longitude: 77.6815 },
    status: 'searching',
    searchRadiusKm: 2.5,
    respondingGuides: [],
    selectedMode: 'call',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30000,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Guide Dispatch Portal</Text>
          <Text style={styles.subtitle}>Achu • Verified Campus Sentinel</Text>
        </View>

        <TouchableOpacity style={styles.switchModeBtn} onPress={onSwitchToTraveler} activeOpacity={0.8}>
          <MaterialIcons name="explore" size={16} color="#0037b0" />
          <Text style={styles.switchModeText}>Traveler View</Text>
        </TouchableOpacity>
      </View>

      {/* Online Status Card */}
      <View style={[styles.statusCard, isOnline ? styles.cardOnline : styles.cardOffline]}>
        <View style={styles.statusLeft}>
          <View style={[styles.dot, isOnline ? styles.dotGreen : styles.dotGray]} />
          <View>
            <Text style={styles.statusTitle}>
              {isOnline ? 'Online & Broadcasting GPS' : 'Offline'}
            </Text>
            <Text style={styles.statusDesc}>
              {isOnline ? 'Ready to receive nearby walker requests' : 'Toggle to start receiving signals'}
            </Text>
          </View>
        </View>

        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: '#eff0f7', true: '#b8eedc' }}
          thumbColor={isOnline ? '#006b5b' : '#73777f'}
        />
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>$64.00</Text>
          <Text style={styles.metricLabel}>Today's Earnings</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>8</Text>
          <Text style={styles.metricLabel}>Walks Completed</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>5.0 ★</Text>
          <Text style={styles.metricLabel}>Rating (248 reviews)</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>3.5h</Text>
          <Text style={styles.metricLabel}>Active Today</Text>
        </View>
      </View>

      {/* Dispatch QA Ring Simulator */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Simulate Incoming Request</Text>
        <TouchableOpacity
          style={styles.simBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="notifications-active" size={18} color="#ffffff" />
          <Text style={styles.simBtnText}>Test Incoming Dispatch Ring (30s Modal)</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <IncomingRequestModal
        visible={showModal}
        request={sampleRequest}
        onAccept={() => setShowModal(false)}
        onDecline={() => setShowModal(false)}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1c20',
  },
  subtitle: {
    fontSize: 12,
    color: '#43474e',
    marginTop: 2,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0037b0',
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0037b0',
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardOnline: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#006b5b',
  },
  cardOffline: {
    backgroundColor: '#eff0f7',
    borderLeftWidth: 4,
    borderLeftColor: '#73777f',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotGreen: {
    backgroundColor: '#006b5b',
  },
  dotGray: {
    backgroundColor: '#73777f',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c20',
  },
  statusDesc: {
    fontSize: 11,
    color: '#73777f',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    gap: 4,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0037b0',
  },
  metricLabel: {
    fontSize: 11,
    color: '#73777f',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#73777f',
    textTransform: 'uppercase',
  },
  simBtn: {
    height: 48,
    backgroundColor: '#0037b0',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  simBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
