import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserRole } from '../types';

export interface OnboardingScreenProps {
  onContinue: (role: UserRole) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onContinue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.logoBadge}>
          <MaterialIcons name="security" size={40} color="#0037b0" />
        </View>
        <Text style={styles.title}>RouteMate</Text>
        <Text style={styles.subtitle}>Human Companion Wayfinding & Safety Sentinel</Text>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.cardHeader}>Select Your Experience</Text>
        
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => onContinue('traveler')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="explore" size={22} color="#ffffff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.btnTitle}>I Need a Walking Companion</Text>
            <Text style={styles.btnSub}>Explore map & request verified guides</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => onContinue('guide')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="handshake" size={22} color="#0037b0" />
          <View style={{ flex: 1 }}>
            <Text style={styles.secBtnTitle}>I Am a Local Guide</Text>
            <Text style={styles.secBtnSub}>Accept escort signals and guide walkers</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color="#0037b0" />
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
    paddingVertical: 60,
  },
  heroSection: {
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1c20',
  },
  subtitle: {
    fontSize: 14,
    color: '#43474e',
    textAlign: 'center',
    maxWidth: 280,
  },
  actionCard: {
    gap: 14,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#73777f',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  primaryBtn: {
    backgroundColor: '#0037b0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  btnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  secondaryBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#0037b0',
  },
  secBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0037b0',
  },
  secBtnSub: {
    fontSize: 11,
    color: '#43474e',
    marginTop: 2,
  },
});
