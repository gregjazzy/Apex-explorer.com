// /components/ConfettiAnimation.tsx
// Animation de confettis pour célébrer les succès

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
}

const ConfettiAnimation: React.FC<ConfettiProps> = ({ active, count = 50, duration = 2000 }) => {
  const confettiPieces = useRef(
    Array.from({ length: count }).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (active) {
      // Animer tous les confettis
      confettiPieces.forEach((piece, index) => {
        Animated.parallel([
          // Tomber
          Animated.timing(piece.y, {
            toValue: height + 50,
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
          // Rotation
          Animated.timing(piece.rotation, {
            toValue: Math.random() * 10 - 5,
            duration: duration,
            useNativeDriver: true,
          }),
          // Fade out
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [active]);

  if (!active) return null;

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: piece.opacity,
              backgroundColor: colors[index % colors.length],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});

export default ConfettiAnimation;

