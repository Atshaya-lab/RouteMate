import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

export interface LanguagePillProps {
  language: string;
  selected?: boolean;
  onPress?: () => void;
}

export const LanguagePill: React.FC<LanguagePillProps> = ({
  language,
  selected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{language}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#eff0f7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: '#f3f4ff',
    borderColor: '#0037b0',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#43474e',
  },
  textSelected: {
    color: '#0037b0',
    fontWeight: '700',
  },
});
