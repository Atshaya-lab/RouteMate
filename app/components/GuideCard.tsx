import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GuideProfile } from '../types';

export interface GuideCardProps {
  guide: GuideProfile;
  onSelect: (guide: GuideProfile) => void;
  isSelected?: boolean;
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide, onSelect, isSelected = false }) => {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onSelect(guide)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: guide.avatarUrl }} style={styles.avatar} />
      <View style={styles.infoCol}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{guide.name}</Text>
          {guide.isVerified && (
            <MaterialIcons name="verified" size={16} color="#006b5b" />
          )}
        </View>
        <Text style={styles.meta}>
          ★ {guide.rating} ({guide.reviewCount}) • {guide.distance}
        </Text>
        <Text style={styles.specialty}>{guide.specialty || 'Verified Local Guide'}</Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.eta}>{guide.eta}</Text>
        <View style={styles.selectBtn}>
          <Text style={styles.selectBtnText}>{isSelected ? 'Selected' : 'Connect'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: '#0037b0',
    backgroundColor: '#f3f4ff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  infoCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1c20',
  },
  meta: {
    fontSize: 12,
    color: '#43474e',
    marginTop: 2,
  },
  specialty: {
    fontSize: 11,
    color: '#73777f',
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  eta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006b5b',
  },
  selectBtn: {
    backgroundColor: '#0037b0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
