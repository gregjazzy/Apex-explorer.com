// /components/Badge3D.tsx
// Badge ultra sophistiqué avec effets 3D et animations

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { BadgeTier, BADGE_GRADIENTS, BADGE_BORDERS } from '../config/badgeSystem';

const isWeb = Platform.OS === 'web';

interface Badge3DProps {
  tier: BadgeTier;
  icon: string;
  earned: boolean;
  size?: number;
  showGlow?: boolean;
  animated?: boolean;
  progress?: number; // 0-100 pour badges avec niveaux
}

const Badge3D: React.FC<Badge3DProps> = ({ 
  tier, 
  icon, 
  earned, 
  size = 80, 
  showGlow = true,
  animated = true,
  progress,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (earned && animated) {
      // Animation de rotation continue
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();

      // Animation de pulsation du glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation de scale subtile
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [earned, animated]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'], // Légère rotation pour effet 3D
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const gradient = BADGE_GRADIENTS[tier];
  const border = BADGE_BORDERS[tier];

  return (
    <View style={[styles.container, { width: size + 20, height: size + 20 }]}>
      {/* Glow extérieur */}
      {earned && showGlow && (
        <Animated.View
          style={[
            styles.glowOuter,
            {
              width: size + 30,
              height: size + 30,
              borderRadius: (size + 30) / 2,
              backgroundColor: gradient.glow,
              opacity: glowOpacity,
            },
          ]}
        />
      )}

      {/* Badge principal */}
      <Animated.View
        style={[
          styles.badgeWrapper,
          {
            transform: [{ scale: scaleAnim }, { rotateZ: rotation }],
          },
        ]}
      >
        <LinearGradient
          colors={earned ? gradient.colors : ['#E5E7EB', '#9CA3AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: border.width,
              borderColor: earned ? border.color : '#D1D5DB',
              opacity: earned ? 1 : 0.4,
            },
          ]}
        >
          {/* Reflet brillant (effet 3D) */}
          {earned && (
            <View style={[styles.shine, { borderRadius: size / 2 }]} />
          )}

          {/* Icône */}
          <Text style={[styles.icon, { fontSize: size * 0.5 }]}>{icon}</Text>

          {/* Cercle de progression (si badges à niveaux) */}
          {progress !== undefined && earned && (
            <View style={[styles.progressRing, { width: size + 8, height: size + 8 }]}>
              <svg width={size + 8} height={size + 8}>
                <circle
                  cx={(size + 8) / 2}
                  cy={(size + 8) / 2}
                  r={size / 2 + 2}
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx={(size + 8) / 2}
                  cy={(size + 8) / 2}
                  r={size / 2 + 2}
                  stroke={border.color}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(progress / 100) * (2 * Math.PI * (size / 2 + 2))} ${2 * Math.PI * (size / 2 + 2)}`}
                  strokeDashoffset={0}
                  transform={`rotate(-90 ${(size + 8) / 2} ${(size + 8) / 2})`}
                />
              </svg>
            </View>
          )}

          {/* Cadenas pour badges non gagnés */}
          {!earned && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
        </LinearGradient>

        {/* Particules pour tiers élevés */}
        {earned && (tier === 'platinum' || tier === 'diamond') && (
          <Animatable.View
            animation="flash"
            iterationCount="infinite"
            duration={3000}
            style={styles.sparkle1}
          >
            <Text style={styles.sparkleIcon}>✨</Text>
          </Animatable.View>
        )}

        {earned && tier === 'diamond' && (
          <>
            <Animatable.View
              animation="flash"
              iterationCount="infinite"
              duration={2500}
              delay={500}
              style={styles.sparkle2}
            >
              <Text style={styles.sparkleIcon}>💫</Text>
            </Animatable.View>
            <Animatable.View
              animation="flash"
              iterationCount="infinite"
              duration={3500}
              delay={1000}
              style={styles.sparkle3}
            >
              <Text style={styles.sparkleIcon}>⭐</Text>
            </Animatable.View>
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowOuter: {
    position: 'absolute',
    zIndex: 0,
  },
  badgeWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Ombres pour effet 3D
    ...(!isWeb && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    }),
    ...(isWeb && {
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
    }),
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  } as ViewStyle,
  icon: {
    zIndex: 2,
  },
  progressRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: 0,
  },
  lockOverlay: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    ...(!isWeb && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    }),
    ...(isWeb && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    }),
  },
  lockIcon: {
    fontSize: 18,
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 4,
  },
  sparkle2: {
    position: 'absolute',
    top: -5,
    left: -10,
    zIndex: 4,
  },
  sparkle3: {
    position: 'absolute',
    bottom: -10,
    right: 0,
    zIndex: 4,
  },
  sparkleIcon: {
    fontSize: 16,
  },
});

export default Badge3D;

