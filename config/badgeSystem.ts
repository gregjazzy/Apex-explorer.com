// /config/badgeSystem.ts
// Système de badges sophistiqué pour gamification

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type BadgeCategory = 'completion' | 'speed' | 'accuracy' | 'streak' | 'special';

export interface BadgeConfig {
  id: string;
  tier: BadgeTier;
  category: BadgeCategory;
  icon: string;
  title: string;
  description: string;
  requirement: string;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  // Pour progression
  hasLevels?: boolean;
  maxLevel?: number;
  currentLevel?: number;
  progressToNext?: number; // 0-100
}

// Gradients selon le tier
export const BADGE_GRADIENTS = {
  bronze: {
    colors: ['#CD7F32', '#8B4513'] as const,
    glow: 'rgba(205, 127, 50, 0.4)',
  },
  silver: {
    colors: ['#C0C0C0', '#A8A8A8'] as const,
    glow: 'rgba(192, 192, 192, 0.4)',
  },
  gold: {
    colors: ['#FFD700', '#FFA500'] as const,
    glow: 'rgba(255, 215, 0, 0.5)',
  },
  platinum: {
    colors: ['#E5E4E2', '#BCC6CC'] as const,
    glow: 'rgba(229, 228, 226, 0.5)',
  },
  diamond: {
    colors: ['#B9F2FF', '#00BFFF'] as const,
    glow: 'rgba(185, 242, 255, 0.6)',
  },
};

// Bordures animées selon le tier
export const BADGE_BORDERS = {
  bronze: {
    color: '#CD7F32',
    width: 3,
  },
  silver: {
    color: '#C0C0C0',
    width: 3,
  },
  gold: {
    color: '#FFD700',
    width: 4,
  },
  platinum: {
    color: '#E5E4E2',
    width: 4,
  },
  diamond: {
    color: '#B9F2FF',
    width: 5,
  },
};

// Catalogue de badges
export const BADGE_CATALOG: BadgeConfig[] = [
  // BADGES DE COMPLÉTION
  {
    id: 'first_module',
    tier: 'bronze',
    category: 'completion',
    icon: '🎯',
    title: 'Premier Pas',
    description: 'Complété ton premier module !',
    requirement: 'Terminer 1 module',
    xpReward: 50,
    rarity: 'common',
  },
  {
    id: 'five_modules',
    tier: 'silver',
    category: 'completion',
    icon: '🏆',
    title: 'Explorateur Confirmé',
    description: '5 modules complétés !',
    requirement: 'Terminer 5 modules',
    xpReward: 150,
    rarity: 'rare',
  },
  {
    id: 'all_modules',
    tier: 'gold',
    category: 'completion',
    icon: '👑',
    title: 'Maître Explorateur',
    description: 'Tous les modules terminés !',
    requirement: 'Terminer tous les modules',
    xpReward: 500,
    rarity: 'epic',
  },
  
  // BADGES DE VITESSE
  {
    id: 'speed_drill_10',
    tier: 'bronze',
    category: 'speed',
    icon: '⚡',
    title: 'Éclair de Bronze',
    description: '10/10 en Speed Drill en moins de 30s !',
    requirement: 'Score parfait sous 30s',
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: 'speed_drill_20',
    tier: 'silver',
    category: 'speed',
    icon: '🚀',
    title: 'Fusée d\'Argent',
    description: '10/10 en Speed Drill en moins de 20s !',
    requirement: 'Score parfait sous 20s',
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'speed_drill_15',
    tier: 'gold',
    category: 'speed',
    icon: '💫',
    title: 'Météore d\'Or',
    description: '10/10 en Speed Drill en moins de 15s !',
    requirement: 'Score parfait sous 15s',
    xpReward: 300,
    rarity: 'epic',
  },
  {
    id: 'speed_drill_master',
    tier: 'diamond',
    category: 'speed',
    icon: '⭐',
    title: 'Maître du Temps',
    description: '10/10 en toutes catégories sous 20s !',
    requirement: 'Perfection sur tous types',
    xpReward: 1000,
    rarity: 'legendary',
  },
  
  // BADGES DE PRÉCISION
  {
    id: 'accuracy_95',
    tier: 'silver',
    category: 'accuracy',
    icon: '🎪',
    title: 'Sniper',
    description: '95%+ de précision sur 10 Speed Drills !',
    requirement: 'Maintenir 95%+ sur 10 sessions',
    xpReward: 150,
    rarity: 'rare',
  },
  {
    id: 'accuracy_100',
    tier: 'gold',
    category: 'accuracy',
    icon: '🏹',
    title: 'Œil de Lynx',
    description: '100% de précision sur 5 Speed Drills d\'affilée !',
    requirement: '5 sessions parfaites consécutives',
    xpReward: 400,
    rarity: 'epic',
  },
  
  // BADGES DE RÉGULARITÉ (STREAK)
  {
    id: 'streak_3',
    tier: 'bronze',
    category: 'streak',
    icon: '🔥',
    title: 'Flamme Naissante',
    description: '3 jours d\'activité consécutifs !',
    requirement: '3 jours de suite',
    xpReward: 75,
    rarity: 'common',
    hasLevels: true,
    maxLevel: 10,
  },
  {
    id: 'streak_7',
    tier: 'silver',
    category: 'streak',
    icon: '🔥',
    title: 'Brasier d\'Argent',
    description: '7 jours d\'activité consécutifs !',
    requirement: '7 jours de suite',
    xpReward: 200,
    rarity: 'rare',
    hasLevels: true,
    maxLevel: 10,
  },
  {
    id: 'streak_30',
    tier: 'gold',
    category: 'streak',
    icon: '🔥',
    title: 'Inferno d\'Or',
    description: '30 jours d\'activité consécutifs !',
    requirement: '30 jours de suite',
    xpReward: 1000,
    rarity: 'epic',
    hasLevels: true,
    maxLevel: 10,
  },
  
  // BADGES SPÉCIAUX
  {
    id: 'early_bird',
    tier: 'platinum',
    category: 'special',
    icon: '🌅',
    title: 'Lève-Tôt',
    description: 'Complété 10 défis avant 8h du matin !',
    requirement: '10 défis avant 8h',
    xpReward: 250,
    rarity: 'epic',
  },
  {
    id: 'night_owl',
    tier: 'platinum',
    category: 'special',
    icon: '🦉',
    title: 'Oiseau de Nuit',
    description: 'Complété 10 défis après 22h !',
    requirement: '10 défis après 22h',
    xpReward: 250,
    rarity: 'epic',
  },
  {
    id: 'perfectionist',
    tier: 'diamond',
    category: 'special',
    icon: '💎',
    title: 'Perfectionniste',
    description: 'Tous les modules avec 100% de réussite !',
    requirement: 'Perfection absolue',
    xpReward: 2000,
    rarity: 'legendary',
  },
  
  // BADGES PAR MODULE (M12-M19)
  {
    id: 'module_m12',
    tier: 'silver',
    category: 'completion',
    icon: '💬',
    title: 'Maître Communicateur',
    description: 'Module M12 "L\'Art de Connecter" complété !',
    requirement: 'Terminer M12',
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'module_m13',
    tier: 'gold',
    category: 'completion',
    icon: '💰',
    title: 'Money Smart',
    description: 'Module M13 "Money Smart" complété !',
    requirement: 'Terminer M13',
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'module_m14',
    tier: 'platinum',
    category: 'completion',
    icon: '🤖',
    title: 'Comprendre l\'IA',
    description: 'Module M14 "Comprendre l\'IA" complété !',
    requirement: 'Terminer M14',
    xpReward: 250,
    rarity: 'epic',
  },
  {
    id: 'module_m15',
    tier: 'platinum',
    category: 'completion',
    icon: '🚀',
    title: 'Collaborateur IA',
    description: 'Module M15 "Collaborer avec l\'IA" complété !',
    requirement: 'Terminer M15',
    xpReward: 250,
    rarity: 'epic',
  },
  {
    id: 'module_m16',
    tier: 'diamond',
    category: 'completion',
    icon: '⭐',
    title: 'IA-Proof',
    description: 'Module M16 "Dépasser l\'IA" complété !',
    requirement: 'Terminer M16',
    xpReward: 300,
    rarity: 'epic',
  },
  {
    id: 'module_m17',
    tier: 'platinum',
    category: 'completion',
    icon: '💡',
    title: 'Penseur Innovant',
    description: 'Module M17 "Penser Autrement" complété !',
    requirement: 'Terminer M17',
    xpReward: 250,
    rarity: 'epic',
  },
  {
    id: 'module_m18',
    tier: 'diamond',
    category: 'completion',
    icon: '🦅',
    title: 'Rebelle Intelligent',
    description: 'Module M18 "L\'Art de Désobéir" complété !',
    requirement: 'Terminer M18',
    xpReward: 300,
    rarity: 'epic',
  },
  {
    id: 'module_m19',
    tier: 'diamond',
    category: 'completion',
    icon: '🔓',
    title: 'Maître de la Liberté',
    description: 'Module M19 "Maîtriser les Dépendances" complété !',
    requirement: 'Terminer M19',
    xpReward: 300,
    rarity: 'epic',
  },
  
  // BADGE ULTIME : BLOC IA COMPLET
  {
    id: 'ai_master',
    tier: 'diamond',
    category: 'special',
    icon: '🏆',
    title: 'Maître du Futur',
    description: 'Bloc IA complet (M14-M19) terminé !',
    requirement: 'Terminer tous les modules IA',
    xpReward: 1000,
    rarity: 'legendary',
  },
];

// Fonction pour obtenir le prochain badge à débloquer
export const getNextBadgeToUnlock = (earnedBadges: string[]): BadgeConfig | null => {
  const unearned = BADGE_CATALOG.filter(b => !earnedBadges.includes(b.id));
  
  if (unearned.length === 0) return null;
  
  // Trier par rareté et XP
  const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
  
  return unearned.sort((a, b) => {
    if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }
    return a.xpReward - b.xpReward;
  })[0];
};

// Fonction pour calculer le % de badges gagnés
export const getBadgeCompletionPercentage = (earnedBadges: string[]): number => {
  return Math.round((earnedBadges.length / BADGE_CATALOG.length) * 100);
};

