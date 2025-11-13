// /components/BadgeUnlockModal.tsx
// Modal de célébration spectaculaire lors du déblocage d'un badge

import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from 'react-i18next';
import PremiumTheme from '../config/premiumTheme';
import ConfettiAnimation from './ConfettiAnimation';
import Badge3D from './Badge3D';
import { BadgeTier, BADGE_GRADIENTS } from '../config/badgeSystem';

const isWeb = Platform.OS === 'web';

interface BadgeUnlockModalProps {
  visible: boolean;
  badge: {
    icon: string;
    title: string;
    description?: string;
    tier?: BadgeTier;
    xpReward?: number;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  } | null;
  onClose: () => void;
}

const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ visible, badge, onClose }) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const xpCounterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Haptic feedback intensif sur mobile
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Triple vibration pour effet dramatique
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
      }

      // Séquence d'animations spectaculaire
      Animated.sequence([
        // 1. Fade in du fond
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // 2. Badge apparaît avec explosion
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        // 3. Texte slide in
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        // 4. Compteur XP animé
        Animated.timing(xpCounterAnim, {
          toValue: badge.xpReward || 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      xpCounterAnim.setValue(0);
    }
  }, [visible, badge]);

  if (!badge) return null;

  const tier = badge.tier || 'gold';
  const gradient = BADGE_GRADIENTS[tier];
  
  // Nombre de confettis selon la rareté
  const confettiCount = {
    common: 60,
    rare: 100,
    epic: 150,
    legendary: 250,
  }[badge.rarity || 'common'];

  // Couleur du texte selon la rareté
  const rarityColors = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#A855F7',
    legendary: '#F59E0B',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{ flex: 1 }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <ConfettiAnimation active={visible} count={confettiCount} duration={4000} />
        
          {/* Rayons de lumière */}
          <Animatable.View
            animation="rotate"
            iterationCount="infinite"
            duration={20000}
            easing="linear"
            style={styles.raysContainer}
          >
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.ray,
                  {
                    transform: [{ rotate: `${i * 30}deg` }],
                    backgroundColor: gradient.colors[0],
                  },
                ]}
              />
            ))}
          </Animatable.View>

          {/* Content */}
          <View style={styles.content}>
          {/* Titre animé */}
          <Animatable.Text
            animation="flash"
            iterationCount={3}
            duration={500}
            style={styles.mainTitle}
          >
            {t('badges.new_badge_title')}
          </Animatable.Text>

          {/* Badge 3D spectaculaire */}
          <Animated.View
            style={[
              styles.badgeWrapper,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Badge3D
              tier={tier}
              icon={badge.icon}
              earned={true}
              size={140}
              showGlow={true}
              animated={true}
            />
          </Animated.View>

          {/* Titre du badge */}
          <Animated.View
            style={[
              styles.infoContainer,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <LinearGradient
              colors={gradient.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <Text style={styles.badgeTitle}>{badge.title}</Text>
            </LinearGradient>

            {/* Rareté */}
            {badge.rarity && (
              <View style={[styles.rarityBadge, { borderColor: rarityColors[badge.rarity] }]}>
                <Text style={[styles.rarityText, { color: rarityColors[badge.rarity] }]}>
                  {badge.rarity.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Description */}
            {badge.description && (
              <Text style={styles.badgeDescription}>{badge.description}</Text>
            )}

            {/* XP Reward animé */}
            {badge.xpReward && (
              <Animatable.View animation="bounceIn" delay={800} style={styles.xpReward}>
                <Text style={styles.xpIcon}>⭐</Text>
                <Text style={styles.xpText}>
                  +{badge.xpReward} XP
                </Text>
              </Animatable.View>
            )}
          </Animated.View>

          {/* Bouton de fermeture */}
          <Animatable.View animation="bounceIn" delay={500}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradient.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Génial ! ✨</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
          
          {/* Hint pour fermer */}
          <Animatable.Text 
            animation="fadeIn" 
            delay={800} 
            style={styles.tapHint}
          >
            Tape n'importe où pour fermer
          </Animatable.Text>
        </View>
      </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  raysContainer: {
    position: 'absolute',
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ray: {
    position: 'absolute',
    width: 4,
    height: 200,
    opacity: 0.3,
  },
  content: {
    width: '90%',
    maxWidth: 450,
    alignItems: 'center',
    zIndex: 10,
  },
  mainTitle: {
    fontSize: PremiumTheme.typography.fontSize.xxxl,
    fontWeight: PremiumTheme.typography.fontWeight.extrabold,
    color: PremiumTheme.colors.white,
    textAlign: 'center',
    marginBottom: PremiumTheme.spacing.xl,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  badgeWrapper: {
    marginVertical: PremiumTheme.spacing.xxxl,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  titleGradient: {
    paddingHorizontal: PremiumTheme.spacing.xxxl,
    paddingVertical: PremiumTheme.spacing.md,
    borderRadius: PremiumTheme.borderRadius.large,
    marginBottom: PremiumTheme.spacing.md,
  },
  badgeTitle: {
    fontSize: PremiumTheme.typography.fontSize.xxxl,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rarityBadge: {
    borderWidth: 2,
    paddingHorizontal: PremiumTheme.spacing.lg,
    paddingVertical: PremiumTheme.spacing.xs,
    borderRadius: PremiumTheme.borderRadius.full,
    marginBottom: PremiumTheme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  rarityText: {
    fontSize: PremiumTheme.typography.fontSize.sm,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
  },
  badgeDescription: {
    fontSize: PremiumTheme.typography.fontSize.lg,
    color: PremiumTheme.colors.white,
    textAlign: 'center',
    marginBottom: PremiumTheme.spacing.lg,
    opacity: 0.9,
    paddingHorizontal: PremiumTheme.spacing.xl,
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: PremiumTheme.spacing.xl,
    paddingVertical: PremiumTheme.spacing.md,
    borderRadius: PremiumTheme.borderRadius.full,
    marginTop: PremiumTheme.spacing.lg,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  xpIcon: {
    fontSize: 24,
    marginRight: PremiumTheme.spacing.sm,
  },
  xpText: {
    fontSize: PremiumTheme.typography.fontSize.xxl,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: '#FFD700',
  },
  closeButton: {
    marginTop: PremiumTheme.spacing.xxxl,
    borderRadius: PremiumTheme.borderRadius.large,
    overflow: 'hidden',
    // Ombres cross-platform
    ...(!isWeb && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }),
    ...(isWeb && {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    }),
  },
  closeButtonGradient: {
    paddingVertical: PremiumTheme.spacing.lg,
    paddingHorizontal: PremiumTheme.spacing.xxxl,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: PremiumTheme.typography.fontSize.xl,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.white,
  },
  tapHint: {
    fontSize: PremiumTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: PremiumTheme.spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BadgeUnlockModal;

