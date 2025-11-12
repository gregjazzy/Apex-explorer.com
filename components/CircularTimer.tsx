// /components/CircularTimer.tsx
// Timer circulaire animé pour Speed Drills

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import PremiumTheme from '../config/premiumTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  duration: number; // Durée totale en secondes
  remainingTime?: number; // Temps restant en secondes
  timeLeft?: number; // Alias pour remainingTime
  progress?: number; // Progress 0-1 (optionnel, calculé à partir du temps)
  size?: number;
  strokeWidth?: number;
  showTime?: boolean;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ 
  duration, 
  remainingTime, 
  timeLeft,
  progress,
  size = 120, 
  strokeWidth = 8,
  showTime = true
}) => {
  // Utiliser timeLeft ou remainingTime
  const actualTime = timeLeft !== undefined ? timeLeft : (remainingTime !== undefined ? remainingTime : duration);
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    const calcProgress = 1 - (actualTime / duration);
    Animated.timing(animatedValue, {
      toValue: calcProgress,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [actualTime, duration]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  // Couleur dynamique selon le temps restant
  const getColor = () => {
    const percentage = (actualTime / duration) * 100;
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
      
      {showTime && (
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: getColor() }]}>
            {actualTime}
          </Text>
          <Text style={styles.timeLabel}>sec</Text>
        </View>
      )}
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

