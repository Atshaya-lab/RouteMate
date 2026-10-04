import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RadiusSlider } from '../components/RadiusSlider';
import { LanguagePill } from '../components/LanguagePill';

export interface HomeRequestScreenProps {
  onRequestCompanion: (destination: string, searchRadiusKm: number) => void;
  onOpenGuideDashboard: () => void;
}

export const HomeRequestScreen: React.FC<HomeRequestScreenProps> = ({
  onRequestCompanion,
  onOpenGuideDashboard,
}) => {
  const [destination, setDestination] = useState('Campus Central Library & Tech Hub');
  const [searchRadius, setSearchRadius] = useState(2.5);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const walkingDestinations = [
    'Campus Central Library & Tech Hub',
    'Hostel Block & Main Gate',
    'Food Court & Canteen',
    'Health Center Safe Haven',
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Evening, Alex</Text>
          <Text style={styles.subtitle}>Where would you like to walk safely?</Text>
        </View>
        <TouchableOpacity style={styles.guideModeBtn} onPress={onOpenGuideDashboard} activeOpacity={0.8}>
          <MaterialIcons name="dashboard" size={16} color="#0037b0" />
          <Text style={styles.guideModeText}>Guide Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Mapbox Map Placeholder Preview */}
      <View style={styles.mapCard}>
        <MaterialIcons name="map" size={32} color="#0037b0" />
        <Text style={styles.mapCardText}>Mapbox Native Vector View Active</Text>
        <Text style={styles.mapSubtext}>GPS: 9.5747° N, 77.6815° E • ±3m accuracy</Text>
      </View>

      {/* Destination Selector */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Immediate Walking Spots</Text>
        <View style={styles.chipGrid}>
          {walkingDestinations.map((dest) => {
            const isSelected = destination === dest;
            return (
              <TouchableOpacity
                key={dest}
                style={[styles.destChip, isSelected && styles.destChipSelected]}
                onPress={() => setDestination(dest)}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="place"
                  size={14}
                  color={isSelected ? '#0037b0' : '#43474e'}
                />
                <Text style={[styles.destChipText, isSelected && styles.destChipTextSelected]}>
                  {dest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="Or type custom destination..."
        />
      </View>

      {/* Radius Configuration */}
      <View style={styles.card}>
        <RadiusSlider value={searchRadius} onValueChange={setSearchRadius} />
      </View>

      {/* Language Preference */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Guide Language Preference</Text>
        <View style={styles.langRow}>
          {['English', 'Tamil', 'Hindi', 'Malayalam'].map((lang) => (
            <LanguagePill
              key={lang}
              language={lang}
              selected={selectedLanguage === lang}
              onPress={() => setSelectedLanguage(lang)}
            />
          ))}
        </View>
      </View>

      {/* Request Button */}
      <TouchableOpacity
        style={styles.requestBtn}
        onPress={() => onRequestCompanion(destination, searchRadius)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="radar" size={20} color="#ffffff" />
        <Text style={styles.requestBtnText}>Request Human Companion</Text>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1c20',
  },
  subtitle: {
    fontSize: 13,
    color: '#43474e',
    marginTop: 2,
  },
  guideModeBtn: {
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
  guideModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0037b0',
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
  mapCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0037b0',
  },
  mapSubtext: {
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
    letterSpacing: 0.5,
  },
  chipGrid: {
    gap: 6,
  },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  destChipSelected: {
    backgroundColor: '#e0e0ff',
    borderWidth: 1,
    borderColor: '#0037b0',
  },
  destChipText: {
    fontSize: 13,
    color: '#1a1c20',
    fontWeight: '500',
  },
  destChipTextSelected: {
    color: '#0037b0',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#faf8ff',
    borderWidth: 1,
    borderColor: '#c3c7cf',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1a1c20',
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requestBtn: {
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
    marginTop: 6,
  },
  requestBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
