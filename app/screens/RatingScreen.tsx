import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface RatingScreenProps {
  guideName?: string;
  onSubmitRating: (stars: number, feedback: string) => void;
}

export const RatingScreen: React.FC<RatingScreenProps> = ({
  guideName = 'Achu',
  onSubmitRating,
}) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('Super safe walk! Friendly and on time.');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <MaterialIcons name="star" size={36} color="#006b5b" />
        </View>

        <Text style={styles.title}>How Was Your Escort?</Text>
        <Text style={styles.subtitle}>
          Rate your walking session with <Text style={{ fontWeight: '700' }}>{guideName}</Text>
        </Text>

        {/* 5-Star Rating Selector */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <MaterialIcons
                name={star <= rating ? 'star' : 'star-border'}
                size={38}
                color={star <= rating ? '#e8a100' : '#c3c7cf'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback Input */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Leave a Compliment or Note</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Share feedback to help keep RouteMate safe..."
          />
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() => onSubmitRating(rating, feedback)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="check" size={20} color="#ffffff" />
        <Text style={styles.submitBtnText}>Submit Review & Finish</Text>
      </TouchableOpacity>
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
  content: {
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#b8eedc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1c20',
  },
  subtitle: {
    fontSize: 14,
    color: '#43474e',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#73777f',
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#faf8ff',
    borderWidth: 1,
    borderColor: '#c3c7cf',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1a1c20',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
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
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
