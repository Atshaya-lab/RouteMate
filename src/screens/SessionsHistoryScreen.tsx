import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';

export const SessionsHistoryScreen: React.FC = () => {
  const pastSessions = [
    {
      id: 'sess-hist-1',
      date: 'Today, 7:42 PM',
      guideName: 'Elena Rostova',
      guideAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhlQT9am7-K9l0E8HNIXDfK0bN-G661Y1zSw-UFYNyTMQaUHJ-UnTEshZ5e_GSF7waHHAfVIk6mwkBilYF1NRPtmRmEO-HNBymTKsB6Zw4UeVuusG_8HIVM2L0N_PVghpHbZFihUulIDYgornlgmUrt7JZERHuXyvwWt6soGX01gwcE6J6UYdWLFymPfUT9QA89rhqbgmQc8yJcvv31-uExTdNtNuQ14cGd-C5i7F7lk8V9reYGwuo',
      destination: 'Mustek Metro Station, Exit A',
      duration: '14 mins',
      cost: '$8.00',
      rating: 5,
      mode: 'Voice Escort',
      status: 'Safely Concluded',
    },
    {
      id: 'sess-hist-2',
      date: 'Yesterday, 11:15 PM',
      guideName: 'Mateo Silva',
      guideAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6vj865EfjAwsPHxGzJmsyOqYMu8PjFcTU5gZhs3VJ6lhpW_8EV2-hiwUsB-2EefAEYoV35TAxvULFMUFnPpJnAVZyPbkZV9hVBdl6VlE-emnAXt0J8qTOFrbJ1sc25dazWWyh__OS0Ou0zlcyQyZK_BydTQ1Gg1zyhxL0gCyNja6FeTmed6jAH0O19lyoDvIf5vh_nB1axBOAAYcIisIiCUouqBaOReeYnBUXJuk2wrw6N1ibD9D5',
      destination: 'Old Town Historic Square North',
      duration: '18 mins',
      cost: '$8.00',
      rating: 5,
      mode: 'Meetup Escort',
      status: 'Safely Concluded',
    },
    {
      id: 'sess-hist-3',
      date: 'Sep 29, 9:20 PM',
      guideName: 'Sophia Chen',
      guideAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXdJq13D1UCd-gFCk6DWj1lzSnyVI60ZmxNCjk5zp-A981Ia2WGSjbq50wgt7afIoKzBWQyAgXhh6BZ-H4_UITzCc1oPRZlzSRqTXfNZvIKxorK5xH7oJnuNgY7NWMGFwRnBA468K3FJWy1aR7NUSeBV327801XKeZdvcWBZuDKVWCKXejnp3PSpKhCiX82M4Iu1gGDJRdOoAnvEv2S9Ngw7bY3N0PHzdXUjXWVNT_Ty4zDuFNBTg3',
      destination: 'Grand Palace Hotel Lobby',
      duration: '11 mins',
      cost: '$9.00',
      rating: 5,
      mode: 'Chat Guidance',
      status: 'Safely Concluded',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Route Memory Summary Header */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryMetric}>12</Text>
            <Text style={styles.summaryLabel}>Safe Walks</Text>
          </View>
          <View style={styles.dividerCol} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryMetric}>3.8 hrs</Text>
            <Text style={styles.summaryLabel}>Escort Time</Text>
          </View>
          <View style={styles.dividerCol} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryMetric}>100%</Text>
            <Text style={styles.summaryLabel}>Safety Record</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeading}>Persistent Route History</Text>

      {pastSessions.map((item) => (
        <View key={item.id} style={styles.sessionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.guideRow}>
              <Image source={{ uri: item.guideAvatar }} style={styles.guideAvatar} />
              <View>
                <Text style={styles.guideName}>{item.guideName}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <MaterialIcons name="check-circle" size={14} color={Colors.secondaryLive} />
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.destinationBox}>
            <MaterialIcons name="place" size={16} color={Colors.primaryContainer} />
            <Text style={styles.destinationText}>{item.destination}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.mode} • {item.duration}</Text>
              <View style={styles.starsRow}>
                {[...Array(item.rating)].map((_, i) => (
                  <MaterialIcons key={i} name="star" size={14} color={Colors.amber} />
                ))}
              </View>
            </View>
            <Text style={styles.costText}>{item.cost}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    padding: Spacing.gutter,
    gap: 14,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: 16,
    ...Elevation.level1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryCol: {
    alignItems: 'center',
  },
  summaryMetric: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: '500',
  },
  dividerCol: {
    width: 1,
    height: 32,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  sessionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: 14,
    gap: 10,
    ...Elevation.level1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guideAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
  },
  guideName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  dateText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryContainer,
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 8,
    borderRadius: Radii.md,
  },
  destinationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  starsRow: {
    flexDirection: 'row',
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
});
