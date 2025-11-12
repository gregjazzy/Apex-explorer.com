// /hooks/useBadgeUnlock.tsx
// Hook personnalisé pour détecter et afficher automatiquement les badges débloqués

import { useState, useEffect, useCallback } from 'react';
import { EarnedBadge } from '../services/dataService';

export const useBadgeUnlock = () => {
  const [unlockedBadge, setUnlockedBadge] = useState<EarnedBadge | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<EarnedBadge[]>([]);

  // Afficher le prochain badge dans la file
  useEffect(() => {
    if (!unlockedBadge && badgeQueue.length > 0) {
      const nextBadge = badgeQueue[0];
      setUnlockedBadge(nextBadge);
      setBadgeQueue(prev => prev.slice(1));
    }
  }, [unlockedBadge, badgeQueue]);

  // Ajouter un ou plusieurs badges à la file d'attente
  const triggerBadgeUnlock = useCallback((badges: EarnedBadge | EarnedBadge[]) => {
    const badgesToAdd = Array.isArray(badges) ? badges : [badges];
    setBadgeQueue(prev => [...prev, ...badgesToAdd]);
  }, []);

  // Fermer le modal actuel
  const closeBadgeModal = useCallback(() => {
    setUnlockedBadge(null);
  }, []);

  return {
    unlockedBadge,
    triggerBadgeUnlock,
    closeBadgeModal,
    hasPendingBadges: badgeQueue.length > 0,
  };
};

