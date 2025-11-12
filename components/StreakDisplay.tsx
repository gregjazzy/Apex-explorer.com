// /components/StreakDisplay.tsx
// Affichage visuel du streak (jours consécutifs)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import PremiumTheme from '../config/premiumTheme';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  compact = false,
}) => {
  // Déterminer la couleur du feu selon le streak
  const getStreakColor = (): readonly [string, string] => {
    if (currentStreak >= 30) return ['#FF6B00', '#FF0000'] as const; // Rouge/Orange intense
    if (currentStreak >= 7) return ['#FFA500', '#FF4500'] as const; // Orange vif
    if (currentStreak >= 3) return ['#FFD700', '#FFA500'] as const; // Or
    return ['#FFA500', '#FF8C00'] as const; // Orange basique
  };

  const getStreakEmoji = () => {
    if (currentStreak >= 30) return '🔥🔥🔥';
    if (currentStreak >= 7) return '🔥🔥';
    if (currentStreak >= 3) return '🔥';
    if (currentStreak >= 1) return '✨';
    return '💤';
  };

  if (compact) {
    return (
      <Animatable.View
        animation={currentStreak > 0 ? "pulse" : undefined}
        iterationCount="infinite"
        duration={2000}
        style={styles.compactContainer}
      >
        <LinearGradient
          colors={getStreakColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.compactGradient}
        >
          <Text style={styles.compactEmoji}>{getStreakEmoji()}</Text>
          <Text style={styles.compactStreak}>{currentStreak}</Text>
        </LinearGradient>
      </Animatable.View>
    );
  }

  return (
    <Animatable.View
      animation={currentStreak > 0 ? "pulse" : undefined}
      iterationCount="infinite"
      duration={2000}
      style={styles.container}
    >
      <LinearGradient
        colors={getStreakColor()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>{getStreakEmoji()}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Série Actuelle</Text>
            <Text style={styles.value}>{currentStreak} {currentStreak > 1 ? 'jours' : 'jour'}</Text>
          </View>
        </View>
        
        {longestStreak > currentStreak && (
          <View style={styles.recordContainer}>
            <Text style={styles.recordLabel}>🏆 Record: {longestStreak} jours</Text>
          </View>
        )}
      </LinearGradient>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  // Mode compact
  compactContainer: {
    borderRadius: PremiumTheme.borderRadius.full,
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: PremiumTheme.spacing.xs,
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PremiumTheme.spacing.md,
    paddingVertical: PremiumTheme.spacing.xs,
    gap: PremiumTheme.spacing.xs,
  },
  compactEmoji: {
    fontSize: 18,
  },
  compactStreak: {
    fontSize: PremiumTheme.typography.fontSize.lg,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.white,
  },
  
  // Mode normal
  container: {
    marginVertical: PremiumTheme.spacing.md,
    borderRadius: PremiumTheme.borderRadius.large,
    overflow: 'hidden',
  },
  gradient: {
    padding: PremiumTheme.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PremiumTheme.spacing.md,
  },
  emoji: {
    fontSize: 48,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: PremiumTheme.typography.fontSize.sm,
    color: PremiumTheme.colors.white,
    opacity: 0.9,
    fontWeight: PremiumTheme.typography.fontWeight.medium,
  },
  value: {
    fontSize: PremiumTheme.typography.fontSize.xxxl,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.white,
  },
  recordContainer: {
    marginTop: PremiumTheme.spacing.sm,
    paddingTop: PremiumTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordLabel: {
    fontSize: PremiumTheme.typography.fontSize.sm,
    color: PremiumTheme.colors.white,
    fontWeight: PremiumTheme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default StreakDisplay;

