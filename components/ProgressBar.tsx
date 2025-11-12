// /components/ProgressBar.tsx
// Barre de progression premium avec gradient animé

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number; // 0 à 1
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: progress,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.progressWrapper, { width }]}>
          <LinearGradient
            colors={progress === 1 ? ['#10B981', '#059669'] : ['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progress}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  track: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressWrapper: {
    height: '100%',
  },
  progress: {
    height: '100%',
    borderRadius: 10,
  },
});

export default ProgressBar;
