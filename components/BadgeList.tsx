// /components/BadgeList.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface Badge {
  id: string;
  title: string;
  icon: string; // Utiliser un emoji ou un nom de ressource
  earned: boolean;
}

interface BadgeListProps {
  badges: Badge[];
}

const BadgeList: React.FC<BadgeListProps> = ({ badges }) => {
  const { t } = useTranslation();
  
  if (!badges || badges.length === 0) {
    return <Text style={styles.emptyText}>{t('badges.no_badges') || "Commencez un module pour gagner votre premier badge!"}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('badges.title') || "Vos Badges d'Honneur"}</Text>
      <ScrollView horizontal contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false}>
        {badges.map((badge) => (
          <View key={badge.id} style={[styles.badgeContainer, !badge.earned && styles.lockedBadge]}>
            <Text style={styles.badgeIcon}>{badge.icon}</Text>
            <Text style={styles.badgeTitle} numberOfLines={1}>{badge.title}</Text>
            {!badge.earned && <Text style={styles.lockedOverlay}>🔒</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 15,
  },
  scrollContent: {
    paddingRight: 20, // Espace pour défilement
  },
  badgeContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
    opacity: 1,
    position: 'relative',
  },
  lockedBadge: {
    opacity: 0.3,
  },
  badgeIcon: {
    fontSize: 36,
    marginBottom: 5,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  badgeTitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1F2937',
    fontWeight: '600',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    fontSize: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  }
});

export default BadgeList;

