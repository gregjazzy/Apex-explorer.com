// /utils/mascotMessages.ts
// Messages contextuels de la mascotte

import { MascotMood } from '../components/Mascot';

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
        return { message: '🌅 Bonjour ! Prêt pour une belle journée d\'apprentissage ?', mood: 'happy' };
      } else if (hour < 18) {
        return { message: '☀️ Bon après-midi ! Continue ton aventure !', mood: 'happy' };
      } else {
        return { message: '🌙 Bonsoir ! Dernière session avant de dormir ?', mood: 'happy' };
      }

    case 'newBadge':
      return { message: '🏆 Tu viens de débloquer un nouveau badge ! Incroyable !', mood: 'celebrating' };

    case 'speedDrillStart':
      return { message: '⚡ Speed Drill ! Montre-moi ta rapidité !', mood: 'excited' };

    case 'perfectScore':
      return { message: '💯 Parfait ! Tu es un champion !', mood: 'celebrating' };

    case 'goodProgress':
      return { message: '🚀 Tu progresses super bien ! Continue !', mood: 'encouraging' };

    case 'comeback':
      return { message: '👋 Content de te revoir ! On continue l\'aventure ?', mood: 'happy' };

    case 'streak':
      const days = data?.days || 0;
      if (days >= 7) {
        return { message: `🔥 ${days} jours de suite ! Tu es inarrêtable !`, mood: 'celebrating' };
      } else if (days >= 3) {
        return { message: `✨ ${days} jours consécutifs ! Super régularité !`, mood: 'excited' };
      } else {
        return { message: '💪 Continue à revenir chaque jour !', mood: 'encouraging' };
      }

    case 'moduleComplete':
      return { message: '🎉 Module terminé ! Tu es brillant !', mood: 'celebrating' };

    default:
      return { message: '👋 Salut ! Prêt pour l\'aventure ?', mood: 'happy' };
  }
};

// Messages aléatoires d'encouragement
export const getRandomEncouragementMessage = (): MascotMessage => {
  const messages: MascotMessage[] = [
    { message: '💪 Chaque petit pas compte !', mood: 'encouraging' },
    { message: '🌟 Tu es sur la bonne voie !', mood: 'happy' },
    { message: '🚀 Continue comme ça !', mood: 'excited' },
    { message: '✨ Tu fais des progrès incroyables !', mood: 'excited' },
    { message: '🎯 Concentre-toi, tu peux y arriver !', mood: 'encouraging' },
    { message: '🏆 Champion en devenir !', mood: 'happy' },
    { message: '💡 L\'apprentissage est une aventure !', mood: 'thinking' },
    { message: '🌈 Chaque défi est une opportunité !', mood: 'happy' },
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Messages basés sur les performances
export const getMascotMessageForPerformance = (
  accuracy: number,
  speed: number // temps en secondes
): MascotMessage => {
  if (accuracy === 100 && speed < 30) {
    return { message: '⚡💯 Parfait ET rapide ! Incroyable !', mood: 'celebrating' };
  } else if (accuracy === 100) {
    return { message: '💯 Score parfait ! Bravo champion !', mood: 'celebrating' };
  } else if (accuracy >= 80 && speed < 45) {
    return { message: '🚀 Rapide et précis ! Excellent !', mood: 'excited' };
  } else if (accuracy >= 80) {
    return { message: '👍 Très bon travail ! Continue !', mood: 'happy' };
  } else if (accuracy >= 60) {
    return { message: '💪 Pas mal ! Tu progresses !', mood: 'encouraging' };
  } else {
    return { message: '🤗 N\'abandonne pas ! Tu vas y arriver !', mood: 'encouraging' };
  }
};

// Messages basés sur le niveau XP
export const getMascotMessageForXP = (currentXP: number): MascotMessage => {
  if (currentXP === 0) {
    return { message: '🌱 Bienvenue explorateur ! Commence ton aventure !', mood: 'happy' };
  } else if (currentXP < 500) {
    return { message: '🌟 Bon début ! Continue à explorer !', mood: 'happy' };
  } else if (currentXP < 1000) {
    return { message: '✨ Tu deviens un vrai explorateur !', mood: 'excited' };
  } else if (currentXP < 3000) {
    return { message: '🚀 Explorateur confirmé ! Impressionnant !', mood: 'excited' };
  } else if (currentXP < 5000) {
    return { message: '🏆 Maître explorateur en vue !', mood: 'celebrating' };
  } else {
    return { message: '👑 Légende d\'Apex ! Tu es exceptionnel !', mood: 'celebrating' };
  }
};

