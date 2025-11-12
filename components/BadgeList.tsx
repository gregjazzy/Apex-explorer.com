// /components/BadgeList.tsx
// Liste de badges avec design premium et animations

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from 'react-i18next';
import PremiumTheme from '../config/premiumTheme';
import BadgeUnlockModal from './BadgeUnlockModal';
import { EarnedBadge } from '../services/dataService';
import { BADGE_GRADIENTS } from '../config/badgeSystem';

const isWeb = Platform.OS === 'web';

interface BadgeListProps {
  badges: EarnedBadge[];
}

const BadgeList: React.FC<BadgeListProps> = ({ badges }) => {
  const { t } = useTranslation();
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  if (!badges || badges.length === 0) {
    return (
      <Text style={styles.emptyText}>
        {t('badges.no_badges') || "Commencez un module pour gagner votre premier badge!"}
      </Text>
    );
  }

  const handleBadgePress = (badge: EarnedBadge) => {
    if (badge.earned) {
      setSelectedBadge(badge);
      setModalVisible(true);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>
            {t('badges.title') || "Vos Badges d'Honneur"}
          </Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {badges.filter(b => b.earned).length}/{badges.length}
            </Text>
          </View>
        </View>
        
        <ScrollView 
          horizontal 
          contentContainerStyle={styles.scrollContent} 
          showsHorizontalScrollIndicator={false}
        >
          {badges.map((badge, index) => (
            <BadgeItem 
              key={badge.id} 
              badge={badge} 
              index={index}
              onPress={() => handleBadgePress(badge)}
            />
          ))}
        </ScrollView>
      </View>

      {selectedBadge && (
        <BadgeUnlockModal
          badge={selectedBadge}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
};

// Composant BadgeItem séparé pour les animations
const BadgeItem: React.FC<{ badge: EarnedBadge; index: number; onPress: () => void }> = ({ badge, index, onPress }) => {
  const [hovered, setHovered] = useState(false);

  // Délai d'animation basé sur l'index pour effet en cascade
  const animationDelay = index * 100;

  // Déterminer le gradient selon le statut
  const gradientColors = badge.earned
    ? PremiumTheme.gradients.gold.colors
    : ['#E5E7EB', '#9CA3AF'];

  return (
    <Animatable.View
      animation={badge.earned ? "bounceIn" : "fadeIn"}
      delay={animationDelay}
      duration={800}
      style={styles.badgeWrapper}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={!badge.earned}
        activeOpacity={0.8}
        onMouseEnter={() => isWeb && setHovered(true)}
        onMouseLeave={() => isWeb && setHovered(false)}
        style={[
          styles.badgeTouchable,
          hovered && badge.earned && styles.badgeHovered,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={PremiumTheme.gradients.gold.start}
          end={PremiumTheme.gradients.gold.end}
          style={[
            styles.badgeContainer,
            !badge.earned && styles.lockedBadge,
          ]}
        >
          {/* Effet de brillance pour les badges gagnés */}
          {badge.earned && (
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              duration={2000}
              style={styles.glowEffect}
            />
          )}
          
          <Text style={styles.badgeIcon}>{badge.icon}</Text>
          
          {!badge.earned && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
        </LinearGradient>
        
        <Text 
          style={[
            styles.badgeTitle, 
            !badge.earned && styles.lockedText
          ]} 
          numberOfLines={2}
        >
          {badge.title}
        </Text>

        {/* Étoiles pour les badges gagnés */}
        {badge.earned && (
          <Animatable.View 
            animation="flash" 
            iterationCount="infinite"
            duration={3000}
            style={styles.starContainer}
          >
            <Text style={styles.star}>✨</Text>
          </Animatable.View>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: PremiumTheme.spacing.xl,
    borderTopWidth: 2,
    borderTopColor: PremiumTheme.colors.lightGray,
    marginTop: PremiumTheme.spacing.xxl,
    marginBottom: PremiumTheme.spacing.xl,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: PremiumTheme.spacing.lg,
    paddingHorizontal: isWeb ? 0 : PremiumTheme.spacing.sm,
  },
  header: {
    fontSize: PremiumTheme.typography.fontSize.xxl,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.darkGray,
  },
  counterBadge: {
    backgroundColor: PremiumTheme.colors.primary,
    paddingHorizontal: PremiumTheme.spacing.md,
    paddingVertical: PremiumTheme.spacing.xs,
    borderRadius: PremiumTheme.borderRadius.large,
    // Ombres cross-platform
    ...(isWeb 
      ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }
    ),
  },
  counterText: {
    color: PremiumTheme.colors.white,
    fontSize: PremiumTheme.typography.fontSize.sm,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
  },
  scrollContent: {
    paddingRight: PremiumTheme.spacing.xl,
    paddingLeft: isWeb ? 0 : PremiumTheme.spacing.sm,
  },
  badgeWrapper: {
    marginRight: PremiumTheme.spacing.lg,
  },
  badgeTouchable: {
    alignItems: 'center',
    width: 100,
    transition: 'transform 0.2s ease',
  },
  badgeHovered: {
    transform: [{ scale: 1.05 }],
  },
  badgeContainer: {
    width: 80,
    height: 80,
    borderRadius: PremiumTheme.borderRadius.xxlarge,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: PremiumTheme.colors.white,
    position: 'relative',
    // Ombres cross-platform
    ...(isWeb 
      ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
        }
    ),
  },
  lockedBadge: {
    opacity: 0.4,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: PremiumTheme.borderRadius.xxlarge,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  badgeIcon: {
    fontSize: 40,
    zIndex: 2,
  },
  lockOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: PremiumTheme.colors.white,
    borderRadius: PremiumTheme.borderRadius.round,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    // Ombres cross-platform
    ...(isWeb 
      ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }
    ),
    zIndex: 3,
  },
  lockIcon: {
    fontSize: 16,
  },
  badgeTitle: {
    fontSize: PremiumTheme.typography.fontSize.xs,
    textAlign: 'center',
    color: PremiumTheme.colors.darkGray,
    fontWeight: PremiumTheme.typography.fontWeight.semibold,
    marginTop: PremiumTheme.spacing.sm,
    height: 32,
  },
  lockedText: {
    color: PremiumTheme.colors.gray,
    opacity: 0.6,
  },
  starContainer: {
    position: 'absolute',
    top: 0,
    right: 5,
  },
  star: {
    fontSize: 20,
  },
  emptyText: {
    fontSize: PremiumTheme.typography.fontSize.sm,
    color: PremiumTheme.colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: PremiumTheme.spacing.xl,
  },
});

export default BadgeList;
