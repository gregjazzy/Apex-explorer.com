// /components/CircularTimer.tsx
// Timer circulaire animé pour Speed Drills

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import PremiumTheme from '../config/premiumTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  duration: number; // Durée totale en secondes
  remainingTime: number; // Temps restant en secondes
  size?: number;
  strokeWidth?: number;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ 
  duration, 
  remainingTime, 
  size = 120, 
  strokeWidth = 8 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    const progress = 1 - (remainingTime / duration);
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [remainingTime, duration]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  // Couleur dynamique selon le temps restant
  const getColor = () => {
    const percentage = (remainingTime / duration) * 100;
    if (percentage > 50) return PremiumTheme.colors.green;
    if (percentage > 20) return PremiumTheme.colors.orange;
    return PremiumTheme.colors.red;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Cercle de fond */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={PremiumTheme.colors.lightGray}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Cercle de progression */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {/* Temps affiché au centre */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: getColor() }]}>
          {remainingTime}
        </Text>
        <Text style={styles.timeLabel}>sec</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 32,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
  },
  timeLabel: {
    fontSize: 12,
    color: PremiumTheme.colors.gray,
    marginTop: -4,
  },
});

export default CircularTimer;

