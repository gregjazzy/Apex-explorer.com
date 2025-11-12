// /components/XPCounter.tsx
// Compteur XP animé avec effet "slot machine"

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import PremiumTheme from '../config/premiumTheme';

interface XPCounterProps {
  value: number;
  style?: any;
  animated?: boolean;
}

const XPCounter: React.FC<XPCounterProps> = ({ value, style, animated = true }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const previousValue = useRef(0);

  useEffect(() => {
    if (animated && value !== previousValue.current) {
      animatedValue.setValue(previousValue.current);
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 800,
        useNativeDriver: false,
      }).start();
      previousValue.current = value;
    } else if (!animated) {
      animatedValue.setValue(value);
    }
  }, [value, animated]);

  // Interpolation pour créer l'effet de compteur
  const displayValue = animatedValue.interpolate({
    inputRange: [0, value || 1],
    outputRange: [0, value || 1],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.Text style={styles.xpText}>
        {animated ? (
          displayValue.interpolate({
            inputRange: [0, value || 1],
            outputRange: ['0', String(value)],
          })
        ) : (
          value
        )} XP
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontSize: PremiumTheme.typography.fontSize.xl,
    fontWeight: PremiumTheme.typography.fontWeight.semibold,
    color: PremiumTheme.colors.orange,
  },
});

export default XPCounter;

