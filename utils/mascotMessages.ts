// /utils/mascotMessages.ts
// Messages contextuels de la mascotte

import { MascotMood } from '../components/Mascot';
import i18n from '../config/i18n';

export interface MascotMessage {
  message: string;
  mood: MascotMood;
}

// Messages basés sur le contexte
export const getMascotMessageForContext = (
  context: 'welcome' | 'newBadge' | 'speedDrillStart' | 'perfectScore' | 'goodProgress' | 'comeback' | 'streak' | 'moduleComplete',
  data?: any
): MascotMessage => {
  switch (context) {
    case 'welcome':
      const hour = new Date().getHours();
      if (hour < 12) {
        return { message: i18n.t('mascot.welcome_morning'), mood: 'happy' };
      } else if (hour < 18) {
        return { message: i18n.t('mascot.welcome_afternoon'), mood: 'happy' };
      } else {
        return { message: i18n.t('mascot.welcome_evening'), mood: 'happy' };
      }

    case 'newBadge':
      return { message: i18n.t('mascot.new_badge'), mood: 'celebrating' };

    case 'speedDrillStart':
      return { message: i18n.t('mascot.speed_drill_start'), mood: 'excited' };

    case 'perfectScore':
      return { message: i18n.t('mascot.perfect_score'), mood: 'celebrating' };

    case 'goodProgress':
      return { message: i18n.t('mascot.good_progress'), mood: 'encouraging' };

    case 'comeback':
      return { message: i18n.t('mascot.comeback'), mood: 'happy' };

    case 'streak':
      const days = data?.days || 0;
      if (days >= 7) {
        return { message: i18n.t('mascot.streak_high', { days }), mood: 'celebrating' };
      } else if (days >= 3) {
        return { message: i18n.t('mascot.streak_medium', { days }), mood: 'excited' };
      } else {
        return { message: i18n.t('mascot.streak_low'), mood: 'encouraging' };
      }

    case 'moduleComplete':
      return { message: i18n.t('mascot.module_complete'), mood: 'celebrating' };

    default:
      return { message: i18n.t('mascot.default'), mood: 'happy' };
  }
};

// Messages aléatoires d'encouragement
export const getRandomEncouragementMessage = (): MascotMessage => {
  const messages: MascotMessage[] = [
    { message: i18n.t('mascot.encouragement_1'), mood: 'encouraging' },
    { message: i18n.t('mascot.encouragement_2'), mood: 'happy' },
    { message: i18n.t('mascot.encouragement_3'), mood: 'excited' },
    { message: i18n.t('mascot.encouragement_4'), mood: 'excited' },
    { message: i18n.t('mascot.encouragement_5'), mood: 'encouraging' },
    { message: i18n.t('mascot.encouragement_6'), mood: 'happy' },
    { message: i18n.t('mascot.encouragement_7'), mood: 'thinking' },
    { message: i18n.t('mascot.encouragement_8'), mood: 'happy' },
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Messages basés sur les performances
export const getMascotMessageForPerformance = (
  accuracy: number,
  speed: number // temps en secondes
): MascotMessage => {
  if (accuracy === 100 && speed < 30) {
    return { message: i18n.t('mascot.perf_perfect_fast'), mood: 'celebrating' };
  } else if (accuracy === 100) {
    return { message: i18n.t('mascot.perf_perfect'), mood: 'celebrating' };
  } else if (accuracy >= 80 && speed < 45) {
    return { message: i18n.t('mascot.perf_good_fast'), mood: 'excited' };
  } else if (accuracy >= 80) {
    return { message: i18n.t('mascot.perf_good'), mood: 'happy' };
  } else if (accuracy >= 60) {
    return { message: i18n.t('mascot.perf_ok'), mood: 'encouraging' };
  } else {
    return { message: i18n.t('mascot.perf_low'), mood: 'encouraging' };
  }
};

// Messages basés sur le niveau XP
export const getMascotMessageForXP = (currentXP: number): MascotMessage => {
  if (currentXP === 0) {
    return { message: i18n.t('mascot.xp_beginner'), mood: 'happy' };
  } else if (currentXP < 500) {
    return { message: i18n.t('mascot.xp_starter'), mood: 'happy' };
  } else if (currentXP < 1000) {
    return { message: i18n.t('mascot.xp_explorer'), mood: 'excited' };
  } else if (currentXP < 3000) {
    return { message: i18n.t('mascot.xp_confirmed'), mood: 'excited' };
  } else if (currentXP < 5000) {
    return { message: i18n.t('mascot.xp_master'), mood: 'celebrating' };
  } else {
    return { message: i18n.t('mascot.xp_legend'), mood: 'celebrating' };
  }
};

