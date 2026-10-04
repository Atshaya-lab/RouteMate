import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TripRequest } from '../types';

export interface IncomingRequestModalProps {
  visible: boolean;
  request: TripRequest | null;
  onAccept: (req: TripRequest) => void;
  onDecline: () => void;
}

export const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
  visible,
  request,
  onAccept,
  onDecline,
}) => {
  if (!request) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.ringHeader}>
            <View style={styles.ringDot} />
            <Text style={styles.ringTitle}>INCOMING ESCORT DISPATCH</Text>
          </View>

          <View style={styles.profileRow}>
            <Image source={{ uri: request.travelerAvatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.travelerName}>{request.travelerName}</Text>
              <Text style={styles.destText}>To: {request.destination}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.8}>
              <MaterialIcons name="close" size={20} color="#ba1a1a" />
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(request)} activeOpacity={0.8}>
              <MaterialIcons name="check" size={20} color="#ffffff" />
              <Text style={styles.acceptText}>Accept (30s)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  ringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ringDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006b5b',
  },
  ringTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006b5b',
    letterSpacing: 0.5,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  travelerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1c20',
  },
  destText: {
    fontSize: 13,
    color: '#43474e',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  declineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffdad6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  declineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  acceptBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#006b5b',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
