import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GuideProfile } from '../types';
import { GuideCard } from '../components/GuideCard';

export interface GuideResultsScreenProps {
  requestId: string;
  destination: string;
  onSelectGuide: (guideId: string) => void;
  onCancel: () => void;
}

export const GuideResultsScreen: React.FC<GuideResultsScreenProps> = ({
  requestId,
  destination,
  onSelectGuide,
  onCancel,
}) => {
  const [selectedGuideId, setSelectedGuideId] = useState<string>('guide-001');

  const guides: GuideProfile[] = [
    {
      id: 'guide-001',
      name: 'Achu',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: 5.0,
      reviewCount: 248,
      distance: '170m away',
      distanceKm: 0.17,
      eta: '1 min walk',
      pricePerSession: 8,
      languages: ['Tamil', 'English'],
      location: { latitude: 9.5758, longitude: 77.6824 },
      isOnline: true,
      isVerified: true,
      fastResponder: true,
      specialty: 'Campus & Safe Egress Specialist',
      modes: ['call', 'chat', 'meetup'],
    },
    {
      id: 'guide-002',
      name: 'Malar',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      rating: 4.98,
      reviewCount: 195,
      distance: '260m away',
      distanceKm: 0.26,
      eta: '2 min walk',
      pricePerSession: 7.5,
      languages: ['Tamil', 'English'],
      location: { latitude: 9.5728, longitude: 77.6829 },
      isOnline: true,
      isVerified: true,
      fastResponder: true,
      specialty: 'Neighborhood & Night Walk Escort',
      modes: ['call', 'chat', 'meetup'],
    },
    {
      id: 'guide-003',
      name: 'Ashika',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      rating: 4.95,
      reviewCount: 310,
      distance: '330m away',
      distanceKm: 0.33,
      eta: '2 min walk',
      pricePerSession: 8,
      languages: ['Tamil', 'English', 'Malayalam'],
      location: { latitude: 9.5768, longitude: 77.6794 },
      isOnline: true,
      isVerified: true,
      fastResponder: false,
      specialty: 'Transit Hub & Wayfinding',
      modes: ['call', 'chat', 'meetup'],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Verified Guides</Text>
        <Text style={styles.subtitle}>Found {guides.length} companions near your location</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {guides.map((g) => (
          <GuideCard
            key={g.id}
            guide={g}
            isSelected={selectedGuideId === g.id}
            onSelect={(guide) => setSelectedGuideId(guide.id)}
          />
        ))}
      </ScrollView>

      {/* Start Escort Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={() => onSelectGuide(selectedGuideId)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="handshake" size={20} color="#ffffff" />
          <Text style={styles.connectBtnText}>Start Accompanied Walk</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
          <Text style={styles.cancelText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1c20',
  },
  subtitle: {
    fontSize: 13,
    color: '#43474e',
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 10,
  },
  footer: {
    gap: 10,
    marginTop: 10,
  },
  connectBtn: {
    height: 52,
    backgroundColor: '#0037b0',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#0037b0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  connectBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#73777f',
  },
});
