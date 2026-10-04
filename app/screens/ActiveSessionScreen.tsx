import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SessionStatusBar } from '../components/SessionStatusBar';

export interface ActiveSessionScreenProps {
  sessionId: string;
  guideId: string;
  onFinishWalk: () => void;
}

export const ActiveSessionScreen: React.FC<ActiveSessionScreenProps> = ({
  sessionId,
  guideId,
  onFinishWalk,
}) => {
  const [seconds, setSeconds] = useState(65);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Telemetry & Status Bar */}
      <SessionStatusBar
        guideName="Achu (★ 5.0)"
        destination="Campus Central Library & Tech Hub"
        durationSeconds={seconds}
        isEncrypted={true}
      />

      {/* Live Mapbox Map Area */}
      <View style={styles.mapArea}>
        <MaterialIcons name="navigation" size={32} color="#0037b0" />
        <Text style={styles.mapAreaText}>Mapbox Live Escort Tracking Active</Text>
        <Text style={styles.mapSubtext}>Achu is 150m ahead • Walking speed 4.8 km/h</Text>
      </View>

      {/* Twilio Voice Controls */}
      <View style={styles.telecomCard}>
        <Text style={styles.telecomTitle}>Twilio Encrypted Audio Relay</Text>
        <View style={styles.audioControlsRow}>
          <TouchableOpacity
            style={[styles.audioBtn, isMuted && styles.audioBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={isMuted ? 'mic-off' : 'mic'}
              size={22}
              color={isMuted ? '#ffffff' : '#0037b0'}
            />
            <Text style={[styles.audioBtnLabel, isMuted && styles.audioBtnLabelActive]}>
              {isMuted ? 'Muted' : 'Mute'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.audioBtn, isSpeaker && styles.audioBtnActive]}
            onPress={() => setIsSpeaker(!isSpeaker)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={isSpeaker ? 'volume-up' : 'volume-mute'}
              size={22}
              color={isSpeaker ? '#ffffff' : '#0037b0'}
            />
            <Text style={[styles.audioBtnLabel, isSpeaker && styles.audioBtnLabelActive]}>
              {isSpeaker ? 'Speaker On' : 'Speaker'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Finish Session Button */}
      <TouchableOpacity style={styles.finishBtn} onPress={onFinishWalk} activeOpacity={0.85}>
        <MaterialIcons name="check-circle" size={20} color="#ffffff" />
        <Text style={styles.finishBtnText}>Arrived Safely • Complete Walk</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
    padding: 20,
    justifyContent: 'space-between',
    paddingBottom: 90,
  },
  mapArea: {
    height: 220,
    backgroundColor: '#eff0f7',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e0ff',
  },
  mapAreaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0037b0',
  },
  mapSubtext: {
    fontSize: 12,
    color: '#73777f',
  },
  telecomCard: {
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
  telecomTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#73777f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  audioControlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  audioBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eff0f7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  audioBtnActive: {
    backgroundColor: '#0037b0',
  },
  audioBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0037b0',
  },
  audioBtnLabelActive: {
    color: '#ffffff',
  },
  finishBtn: {
    height: 52,
    backgroundColor: '#006b5b',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#006b5b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
