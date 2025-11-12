// /components/Mascot.tsx
// Mascotte interactive pour gamification

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumTheme from '../config/premiumTheme';

const isWeb = Platform.OS === 'web';

export type MascotMood = 
  | 'happy'       // Content normal
  | 'excited'     // Super content (badge débloqué, bon score)
  | 'encouraging' // Encouragement
  | 'thinking'    // Réflexion
  | 'celebrating' // Célébration
  | 'sleeping'    // Inactif
  | 'surprised';  // Surpris

export type MascotSize = 'small' | 'medium' | 'large';

interface MascotProps {
  mood?: MascotMood;
  size?: MascotSize;
  message?: string;
  showBubble?: boolean;
  animated?: boolean;
}

// Configuration des emojis et couleurs par mood
const MASCOT_CONFIG = {
  happy: {
    emoji: '🦊',
    color: '#F59E0B',
    animation: 'bounce',
    bubble: '👋 Salut ! Prêt pour l\'aventure ?',
  },
  excited: {
    emoji: '🤩',
    color: '#10B981',
    animation: 'tada',
    bubble: '🎉 Incroyable ! Tu es génial !',
  },
  encouraging: {
    emoji: '💪',
    color: '#3B82F6',
    animation: 'pulse',
    bubble: '💪 Tu peux le faire ! Continue !',
  },
  thinking: {
    emoji: '🤔',
    color: '#8B5CF6',
    animation: 'swing',
    bubble: '🤔 Hmm... intéressant !',
  },
  celebrating: {
    emoji: '🎊',
    color: '#EC4899',
    animation: 'jello',
    bubble: '🎊 Bravo champion !',
  },
  sleeping: {
    emoji: '😴',
    color: '#6B7280',
    animation: 'pulse',
    bubble: '💤 Zzz...',
  },
  surprised: {
    emoji: '😮',
    color: '#F97316',
    animation: 'wobble',
    bubble: '😮 Wow ! Impressionnant !',
  },
};

const SIZE_CONFIG = {
  small: { emoji: 40, bubble: 12, container: 60 },
  medium: { emoji: 60, bubble: 14, container: 80 },
  large: { emoji: 80, bubble: 16, container: 100 },
};

const Mascot: React.FC<MascotProps> = ({
  mood = 'happy',
  size = 'medium',
  message,
  showBubble = true,
  animated = true,
}) => {
  const config = MASCOT_CONFIG[mood];
  const sizes = SIZE_CONFIG[size];
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Animation de flottement continu
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  return (
    <View style={[styles.container, { width: size === 'large' ? 350 : size === 'medium' ? 280 : 220 }]}>
      {/* Layout horizontal : Renard à gauche + Bulle à droite */}
      <View style={styles.horizontalLayout}>
        {/* Mascotte */}
        <Animated.View
          style={[
            styles.mascotContainer,
            {
              width: sizes.container,
              height: sizes.container,
              transform: [{ translateY: bounceAnim }],
            },
          ]}
        >
          <Animatable.View
            animation={animated ? config.animation : undefined}
            iterationCount="infinite"
            duration={2000}
            style={[
              styles.mascot,
              {
                width: sizes.container,
                height: sizes.container,
                backgroundColor: config.color + '20',
                borderColor: config.color,
              },
            ]}
          >
            <Text style={[styles.emoji, { fontSize: sizes.emoji }]}>
              {config.emoji}
            </Text>
            
            {/* Effet de brillance */}
            <View style={[styles.shine, { borderRadius: sizes.container / 2 }]} />
          </Animatable.View>

          {/* Ombre au sol */}
          <View style={[styles.shadow, { width: sizes.container * 0.8 }]} />
        </Animated.View>

        {/* Bulle de dialogue à droite */}
        {showBubble && (
          <Animatable.View
            animation={animated ? "fadeIn" : undefined}
            duration={600}
            style={[styles.bubble, { flex: 1, marginLeft: PremiumTheme.spacing.sm }]}
          >
            <LinearGradient
              colors={[config.color + '20', config.color + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bubbleGradient}
            >
              <Text style={[styles.bubbleText, { fontSize: sizes.bubble }]}>
                {message || config.bubble}
              </Text>
            </LinearGradient>
          </Animatable.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginVertical: PremiumTheme.spacing.xs,
  },
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  bubble: {
    borderRadius: PremiumTheme.borderRadius.large,
    overflow: 'hidden',
    ...(!isWeb && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
    ...(isWeb && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }),
  },
  bubbleGradient: {
    paddingHorizontal: PremiumTheme.spacing.md,
    paddingVertical: PremiumTheme.spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: PremiumTheme.borderRadius.large,
  },
  bubbleText: {
    color: PremiumTheme.colors.darkGray,
    fontWeight: PremiumTheme.typography.fontWeight.semibold,
  },
  mascotContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascot: {
    borderRadius: 999,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Ombres cross-platform
    ...(!isWeb && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    }),
    ...(isWeb && {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }),
  },
  emoji: {
    zIndex: 2,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 1,
  } as ViewStyle,
  shadow: {
    position: 'absolute',
    bottom: -8,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 999,
  },
});

export default Mascot;

