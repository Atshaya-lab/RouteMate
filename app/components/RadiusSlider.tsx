import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export interface RadiusSliderProps {
  value: number; // e.g. 1.0, 2.5, 5.0
  onValueChange: (val: number) => void;
  options?: number[];
}

export const RadiusSlider: React.FC<RadiusSliderProps> = ({
  value,
  onValueChange,
  options = [1.0, 2.5, 5.0, 10.0],
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Search Radius: {value.toFixed(1)} km</Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => {
          const isSelected = opt === value;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.optionChip, isSelected && styles.optionChipSelected]}
              onPress={() => onValueChange(opt)}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {opt} km
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#43474e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eff0f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipSelected: {
    backgroundColor: '#0037b0',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#43474e',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
});
