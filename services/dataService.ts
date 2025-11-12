// /services/dataService.ts

import i18n from '../config/i18n';
import { supabase } from '../config/supabase';

// --- Interfaces de Données ---

export type DefiStatus = 'unlocked' | 'locked' | 'completed';

export interface Defi {
  id: string; // Ex: defi1, defi2
  title: string; // Titre du défi (tiré de i18n)
  status: DefiStatus;
  xpValue: number;
}

export interface Module {
  id: string; // Ex: m1, m2
  title: string; // Titre du module (tiré de i18n)
  description: string;
  isUnlocked: boolean;
  completionRate: number; // Taux de complétion
  totalXP: number; // XP accumulé pour ce module
  defis: Defi[];
}

// --- Nouvelles Interfaces ---

// Interface pour les données de progression stockées dans Supabase
interface ProgressDBItem {
    id?: number;
    user_id: string;
    module_id: string;
    defi_id: string;
    status: string;
    xp_earned: number;
    completed_at: string;
}

// Interface pour les profils Explorateurs
export interface ExplorerProfile {
    id: number;
    explorer_uuid: string;
    name: string;
    mentor_id: string;
    xp_total: number;
    created_at: string;
    is_active: boolean;
    pin_code: string;
}

// Interface de progression à afficher
export interface ExplorerProgressItem {
    id: number;
    moduleId: string;
    defiId: string;
    status: 'completed' | 'submitted';
    xpEarned: number;
    completedAt: string;
    responseText?: string;
    mentorComment?: string;
    evaluationStatus?: 'SOUMIS' | 'REVISION_DEMANDEE' | 'VALIDE' | 'COMPLETION_IMMEDIATE';
    attemptCount?: number;
}

// --- Interface Badge ---
export interface Badge {
  id: string;
  title: string;
  icon: string;
  earned: boolean;
}

// --- Données de Simulation de Base (M1-M4) ---

const BASE_MODULE_DATA_SIM = [
  { id: 'm1', isUnlocked: true },
  { id: 'm2', isUnlocked: true },
  { id: 'm3', isUnlocked: true },
  { id: 'm4', isUnlocked: true },
  { id: 'm5', isUnlocked: true },
  { id: 'm6', isUnlocked: true },
  { id: 'm7', isUnlocked: true },
  { id: 'm8', isUnlocked: true },
  { id: 'm9', isUnlocked: true },
  { id: 'm10', isUnlocked: true },
  { id: 'm11', isUnlocked: true },
];

interface BaseDefi {
    id: string;
    xpValue: number;
    requires: string[];
}

const BASE_DEFIS_SIM: Record<string, BaseDefi[]> = {
    m1: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m2: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m3: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m4: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m5: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m6: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m7: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m8: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m9: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m10: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m11: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
    ]
};

// --- Logique de Transformation des Données ---

/**
 * Récupère les modules avec la progression réelle de l'utilisateur.
 */
export const fetchModulesWithProgress = async (userId: string): Promise<Module[]> => {
    // 1. Récupérer la progression réelle depuis Supabase
    const { data: dbProgress, error } = await supabase
        .from('explorer_progress')
        .select('*')
        .eq('user_id', userId);
        
    if (error) {
        console.error("Erreur Supabase lors du fetch:", error);
        // En cas d'erreur, retourner une liste vide pour ne pas bloquer l'app
        // On continue avec une progression vide
    }
    
    // Convertir les données de la DB en un Map pour un accès rapide
    const progressMap = new Map<string, ProgressDBItem>();
    if (dbProgress) {
        dbProgress.forEach((item: any) => {
            const key = `${item.module_id}-${item.defi_id}`;
            progressMap.set(key, item);
        });
    }

    // 2. Construire la liste finale des modules
    const modules = BASE_MODULE_DATA_SIM.map(module => {
        const baseDefis = BASE_DEFIS_SIM[module.id] || [];
        let completedDefis = 0;
        let totalXP = 0;

        const defis: Defi[] = baseDefis.map((baseDefi) => {
            const key = `${module.id}-${baseDefi.id}`;
            const progress = progressMap.get(key);
            
            // Obtenir le titre traduit depuis i18n
            const defiKey = `${module.id}.${baseDefi.id}.titre`;
            const translatedTitle = i18n.t(defiKey);
            
            // Si la traduction existe, utiliser le titre traduit, sinon fallback
            let title = translatedTitle !== defiKey 
                ? translatedTitle 
                : `${i18n.t('defi.title')} ${baseDefi.id.replace('defi', '')}`;

            
            let status: DefiStatus = 'locked';
            
            if (progress) {
                // Si une entrée existe dans la DB, c'est au moins soumis/terminé
                status = progress.status as DefiStatus;
                if (status === 'completed') {
                    completedDefis++;
                    totalXP += baseDefi.xpValue;
                }
            } else {
                // Logique de déblocage :
                const isFirstDefi = baseDefi.requires.length === 0;
                const requiredDefisCompleted = baseDefi.requires.every((requiredId: string) => 
                    progressMap.get(`${module.id}-${requiredId}`)?.status === 'completed'
                );
                
                if (module.isUnlocked && (isFirstDefi || requiredDefisCompleted)) {
                    status = 'unlocked';
                }
            }

            return {
                id: baseDefi.id,
                title,
                xpValue: baseDefi.xpValue,
                status,
            };
        });

        const completionRate = baseDefis.length > 0 ? (completedDefis / baseDefis.length) : 0;
        
        return {
            id: module.id,
            title: i18n.t(`modules.${module.id}`),
            description: i18n.t(`modules.${module.id}_desc`),
            isUnlocked: module.isUnlocked,
            defis,
            completionRate,
            totalXP,
        };
    });
    
    // Simuler le temps de chargement pour le confort de développement
    await new Promise(resolve => setTimeout(resolve, 300));

    return modules;
};

// --- Nouvelle Fonction de Sauvegarde ---

/**
 * Sauvegarde la progression d'un défi spécifique pour l'utilisateur.
 */
export const saveDefiProgress = async (
    userId: string, 
    moduleId: string, 
    defiId: string, 
    responseText: string = '',
    evaluationStatus: 'VALIDE' | 'SOUMIS' | 'COMPLETION_IMMEDIATE' = 'SOUMIS',
    xpValue: number = 100
) => {
    if (!userId || userId === 'sim_explorer' || userId.startsWith('sim-')) {
        console.warn("Tentative de sauvegarde sans ID utilisateur réel.");
        return;
    }
    
    // Déterminer si c'est une nouvelle soumission ou une re-soumission
    const { data: existing } = await supabase
        .from('explorer_progress')
        .select('attempt_count')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('defi_id', defiId)
        .single();
    
    const attemptCount = existing ? (existing.attempt_count || 1) + 1 : 1;
    
    // Déterminer le statut et les XP
    const status = (evaluationStatus === 'VALIDE' || evaluationStatus === 'COMPLETION_IMMEDIATE') 
        ? 'completed' 
        : 'submitted';
    const xpEarned = (evaluationStatus === 'VALIDE' || evaluationStatus === 'COMPLETION_IMMEDIATE') 
        ? xpValue 
        : 0;
    
    // 1. Déterminer les données à insérer ou mettre à jour
    const progressData = {
        user_id: userId,
        module_id: moduleId,
        defi_id: defiId,
        status: status,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
        response_text: responseText,
        evaluation_status: evaluationStatus,
        attempt_count: attemptCount,
        mentor_comment: null, // Réinitialiser le commentaire mentor lors de la resoumission
    };
    
    // 2. Utiliser upsert pour insérer ou mettre à jour si l'entrée existe déjà
    const { data, error } = await supabase
        .from('explorer_progress')
        .upsert(progressData, { 
            onConflict: 'user_id,module_id,defi_id',
        });

    if (error) {
        console.error("Erreur Supabase lors de la sauvegarde:", error);
        throw new Error("Impossible de sauvegarder la progression.");
    }
    
    console.log(`Progression enregistrée pour ${moduleId}/${defiId} avec statut ${status}.`);
};

// --- Fonctions de Gestion des Explorateurs ---

/**
 * Génère un PIN à 4 chiffres.
 */
const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Récupère la liste des explorateurs liés à un mentor.
 */
export const fetchMentorExplorers = async (mentorId: string): Promise<ExplorerProfile[]> => {
    const { data, error } = await supabase
        .from('explorers')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('is_active', true)
        .order('name', { ascending: true });
        
    if (error) {
        console.error("Erreur Supabase lors du fetch des Explorateurs:", error);
        return [];
    }
    
    return data as ExplorerProfile[]; 
};

/**
 * Connecte l'explorateur en vérifiant le Nom et le PIN contre la table 'explorers'.
 */
export const loginExplorerByPin = async (name: string, pin: string): Promise<ExplorerProfile | null> => {
    const { data, error } = await supabase
        .from('explorers')
        .select('*')
        .eq('name', name)
        .eq('pin_code', pin)
        .eq('is_active', true)
        .single();
        
    if (error) {
        console.error("Échec de la connexion Explorateur:", error);
        return null;
    }

    return data as ExplorerProfile;
};

/**
 * Récupère la progression complète pour un Explorateur donné (par son UUID).
 */
export const fetchExplorerProgress = async (explorerUuid: string): Promise<ExplorerProgressItem[]> => {
    const { data: dbProgress, error } = await supabase
        .from('explorer_progress')
        .select('*')
        .eq('user_id', explorerUuid)
        .order('completed_at', { ascending: false });

    if (error) {
        console.error("Erreur Supabase lors du fetch de la progression Explorateur:", error);
        return [];
    }
    
    return dbProgress.map(item => ({
        id: item.id,
        moduleId: item.module_id,
        defiId: item.defi_id,
        status: item.status as 'completed' | 'submitted',
        xpEarned: item.xp_earned,
        completedAt: item.completed_at,
        responseText: item.response_text,
        mentorComment: item.mentor_comment,
        evaluationStatus: item.evaluation_status,
        attemptCount: item.attempt_count || 1,
    })) as ExplorerProgressItem[];
};

/**
 * Crée un nouveau profil Explorateur pour le mentor actuel.
 */
export const createExplorerProfile = async (mentorId: string, name: string): Promise<ExplorerProfile> => {
    if (!mentorId) throw new Error("ID Mentor manquant.");
    
    const newPin = generatePin();
    
    const { data, error } = await supabase
        .from('explorers')
        .insert({
            mentor_id: mentorId,
            name: name,
            pin_code: newPin,
        })
        .select()
        .single();

    if (error) {
        console.error("Erreur Supabase lors de la création de l'Explorateur:", error);
        throw new Error("Impossible de créer le profil Explorateur.");
    }
    
    return data as ExplorerProfile;
};

/**
 * Récupère la progression d'un défi spécifique pour un explorateur.
 */
export const fetchExplorerProgressForDefi = async (
    userId: string,
    moduleId: string,
    defiId: string
): Promise<ExplorerProgressItem | null> => {
    const { data, error } = await supabase
        .from('explorer_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('defi_id', defiId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') { // No rows returned
            return null;
        }
        console.error("Erreur Supabase lors du fetch du défi spécifique:", error);
        return null;
    }

    return {
        id: data.id,
        moduleId: data.module_id,
        defiId: data.defi_id,
        status: data.status as 'completed' | 'submitted',
        xpEarned: data.xp_earned,
        completedAt: data.completed_at,
        responseText: data.response_text,
        mentorComment: data.mentor_comment,
        evaluationStatus: data.evaluation_status,
        attemptCount: data.attempt_count || 1,
    };
};

/**
 * Valide un défi soumis par un explorateur (mentor).
 */
export const validateDefi = async (
    progressId: number,
    mentorComment: string,
    xpValue: number = 100
): Promise<void> => {
    const { error } = await supabase
        .from('explorer_progress')
        .update({
            evaluation_status: 'VALIDE',
            status: 'completed',
            mentor_comment: mentorComment,
            xp_earned: xpValue,
        })
        .eq('id', progressId);

    if (error) {
        console.error("Erreur lors de la validation du défi:", error);
        throw new Error("Impossible de valider le défi.");
    }
};

/**
 * Demande une révision à l'explorateur (mentor).
 */
export const requestRevision = async (
    progressId: number,
    mentorComment: string
): Promise<void> => {
    const { error } = await supabase
        .from('explorer_progress')
        .update({
            evaluation_status: 'REVISION_DEMANDEE',
            status: 'submitted',
            mentor_comment: mentorComment,
        })
        .eq('id', progressId);

    if (error) {
        console.error("Erreur lors de la demande de révision:", error);
        throw new Error("Impossible de demander une révision.");
    }
};

// --- Logique de Badges Sophistiqués (Gamification) ---

import { BADGE_CATALOG, BadgeConfig } from '../config/badgeSystem';

export interface EarnedBadge extends BadgeConfig {
    earned: boolean;
    earnedAt?: string;
    progress?: number; // Pour les badges à progression (0-100)
    currentLevel?: number; // Pour les badges à niveaux
}

/**
 * Calcule tous les badges avec leur statut (gagné/non gagné)
 * et détecte les nouveaux badges débloqués
 */
export const calculateAdvancedBadges = async (
    userId: string,
    progressItems: ExplorerProgressItem[],
    speedDrillSessions?: SpeedDrillSession[]
): Promise<{
    badges: EarnedBadge[];
    newlyUnlocked: EarnedBadge[];
}> => {
    const earnedBadgeIds: string[] = [];
    const newlyUnlocked: EarnedBadge[] = [];
    
    // Récupérer les badges déjà débloqués depuis la base
    const previouslyEarned = await getEarnedBadgeIds(userId);
    
    // Calculer les modules complétés
    const completedModules = new Set(
        progressItems
            .filter(item => item.status === 'completed')
            .map(item => item.moduleId)
    ).size;
    
    // Calculer les défis complétés avec timestamps
    const completedDefis = progressItems.filter(item => item.status === 'completed');
    
    // Vérifier chaque badge du catalogue
    const badges: EarnedBadge[] = BADGE_CATALOG.map(badge => {
        let earned = false;
        let badgeProgress = 0;

        switch (badge.id) {
            // BADGES DE COMPLÉTION
            case 'first_module':
                earned = completedModules >= 1;
                badgeProgress = completedModules >= 1 ? 100 : (completedModules * 100);
                break;
                
            case 'five_modules':
                earned = completedModules >= 5;
                badgeProgress = Math.min(100, (completedModules / 5) * 100);
                break;
                
            case 'all_modules':
                earned = completedModules >= 11;
                badgeProgress = Math.min(100, (completedModules / 11) * 100);
                break;
            
            // BADGES DE VITESSE (calculés avec speedDrillSessions)
            case 'speed_drill_10':
                if (speedDrillSessions) {
                    earned = speedDrillSessions.some(s => s.score === 10 && s.time_seconds <= 30);
                }
                break;
                
            case 'speed_drill_20':
                if (speedDrillSessions) {
                    earned = speedDrillSessions.some(s => s.score === 10 && s.time_seconds <= 20);
                }
                break;
                
            case 'speed_drill_15':
                if (speedDrillSessions) {
                    earned = speedDrillSessions.some(s => s.score === 10 && s.time_seconds <= 15);
                }
                break;
                
            case 'speed_drill_master':
                if (speedDrillSessions) {
                    const operations = ['Multiplication', 'Division', 'Addition', 'Subtraction'];
                    const perfectInAll = operations.every(op => 
                        speedDrillSessions.some(s => 
                            s.operation_type === op && s.score === 10 && s.time_seconds <= 20
                        )
                    );
                    earned = perfectInAll;
                    const count = operations.filter(op => 
                        speedDrillSessions.some(s => 
                            s.operation_type === op && s.score === 10 && s.time_seconds <= 20
                        )
                    ).length;
                    badgeProgress = (count / 4) * 100;
                }
                break;
            
            // BADGES DE PRÉCISION
            case 'accuracy_95':
                if (speedDrillSessions && speedDrillSessions.length >= 10) {
                    const last10 = speedDrillSessions.slice(-10);
                    const avgAccuracy = last10.reduce((sum, s) => sum + s.accuracy, 0) / 10;
                    earned = avgAccuracy >= 95;
                    badgeProgress = Math.min(100, avgAccuracy);
                }
                break;
                
            case 'accuracy_100':
                if (speedDrillSessions) {
                    let consecutivePerfect = 0;
                    for (let i = speedDrillSessions.length - 1; i >= 0; i--) {
                        if (speedDrillSessions[i].accuracy === 100) {
                            consecutivePerfect++;
                            if (consecutivePerfect >= 5) break;
                        } else {
                            break;
                        }
                    }
                    earned = consecutivePerfect >= 5;
                    badgeProgress = Math.min(100, (consecutivePerfect / 5) * 100);
                }
                break;
            
            // BADGES SPÉCIAUX
            case 'early_bird':
                const earlyDefis = completedDefis.filter(d => {
                    const hour = new Date(d.completedAt).getHours();
                    return hour < 8;
                });
                earned = earlyDefis.length >= 10;
                badgeProgress = Math.min(100, (earlyDefis.length / 10) * 100);
                break;
                
            case 'night_owl':
                const lateDefis = completedDefis.filter(d => {
                    const hour = new Date(d.completedAt).getHours();
                    return hour >= 22;
                });
                earned = lateDefis.length >= 10;
                badgeProgress = Math.min(100, (lateDefis.length / 10) * 100);
                break;
                
            case 'perfectionist':
                // Tous les modules avec 100% (tous les défis complétés)
                const allModuleIds = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11'];
                const perfectModules = allModuleIds.filter(mid => {
                    const defisInModule = progressItems.filter((p: ExplorerProgressItem) => p.moduleId === mid);
                    return defisInModule.length >= 4 && defisInModule.every((d: ExplorerProgressItem) => d.status === 'completed');
                });
                earned = perfectModules.length === 11;
                badgeProgress = Math.min(100, (perfectModules.length / 11) * 100);
                break;
        }
        
        // Détecter les nouveaux badges
        if (earned && !previouslyEarned.includes(badge.id)) {
            const newBadge: EarnedBadge = { ...badge, earned, earnedAt: new Date().toISOString(), progress: badgeProgress };
            newlyUnlocked.push(newBadge);
            earnedBadgeIds.push(badge.id);
            
            // Sauvegarder dans la base
            saveEarnedBadge(userId, badge.id);
        } else if (earned) {
            earnedBadgeIds.push(badge.id);
        }
        
        return { ...badge, earned, progress: badgeProgress };
    });
    
    return { badges, newlyUnlocked };
};

// Sauvegarder un badge débloqué dans la base
async function saveEarnedBadge(userId: string, badgeId: string) {
    try {
        const { error } = await supabase
            .from('earned_badges')
            .insert({
                user_id: userId,
                badge_id: badgeId,
                earned_at: new Date().toISOString(),
            });
        
        if (error) console.error('Erreur sauvegarde badge:', error);
    } catch (err) {
        console.error('Erreur sauvegarde badge:', err);
    }
}

// Récupérer les IDs des badges déjà gagnés
async function getEarnedBadgeIds(userId: string): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('earned_badges')
            .select('badge_id')
            .eq('user_id', userId);
        
        if (error) {
            console.error('Erreur récupération badges:', error);
            return [];
        }
        
        return data?.map(row => row.badge_id) || [];
    } catch (err) {
        console.error('Erreur récupération badges:', err);
        return [];
    }
}

// ANCIEN SYSTÈME (Rétro-compatibilité)
export const calculateBadges = (progress: ExplorerProgressItem[]): Badge[] => {
    const completedModules = new Set(
        progress
            .filter(item => item.status === 'completed')
            .map(item => item.moduleId)
    ).size;
    
    // Mapper vers l'ancien format
    const legacyBadges: Badge[] = [
        { id: 'first_step', title: 'Premier Pas', icon: '🌟', earned: completedModules >= 1 },
        { id: 'five_modules', title: 'Explorateur', icon: '🏆', earned: completedModules >= 5 },
        { id: 'all_modules', title: 'Maître', icon: '👑', earned: completedModules >= 11 },
    ];
    
    return legacyBadges;
};

// --- Système de Streaks (Jours Consécutifs) ---

export interface UserStreak {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
}

/**
 * Met à jour le streak de l'utilisateur (à appeler à chaque activité)
 */
export const updateUserStreak = async (userId: string): Promise<UserStreak | null> => {
    try {
        const { data, error } = await supabase.rpc('update_user_streak', {
            p_user_id: userId
        });
        
        if (error) {
            // Erreur silencieuse, retour par défaut
            return {
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: new Date().toISOString().split('T')[0],
            };
        }
        
        const { data: streakData, error: streakError } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (streakError || !streakData) {
            return {
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: new Date().toISOString().split('T')[0],
            };
        }
        
        return {
            userId: streakData.user_id,
            currentStreak: streakData.current_streak,
            longestStreak: streakData.longest_streak,
            lastActivityDate: streakData.last_activity_date,
        };
    } catch (err) {
        // Erreur silencieuse
        return {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: new Date().toISOString().split('T')[0],
        };
    }
};

/**
 * Récupère le streak actuel de l'utilisateur
 */
export const getUserStreak = async (userId: string): Promise<UserStreak | null> => {
    try {
        const { data, error } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error) {
            return {
                userId,
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: new Date().toISOString().split('T')[0],
            };
        }
        
        return {
            userId: data.user_id,
            currentStreak: data.current_streak,
            longestStreak: data.longest_streak,
            lastActivityDate: data.last_activity_date,
        };
    } catch (err) {
        console.error('Erreur récupération streak:', err);
        return null;
    }
};

/**
 * Calcule les badges de streak basés sur le streak actuel
 */
export const calculateStreakBadges = (currentStreak: number): EarnedBadge[] => {
    const streakBadges = BADGE_CATALOG.filter(b => b.category === 'streak');
    
    return streakBadges.map(badge => {
        let earned = false;
        let progress = 0;
        
        switch (badge.id) {
            case 'streak_3':
                earned = currentStreak >= 3;
                progress = Math.min(100, (currentStreak / 3) * 100);
                break;
            case 'streak_7':
                earned = currentStreak >= 7;
                progress = Math.min(100, (currentStreak / 7) * 100);
                break;
            case 'streak_30':
                earned = currentStreak >= 30;
                progress = Math.min(100, (currentStreak / 30) * 100);
                break;
        }
        
        return { ...badge, earned, progress };
    });
};

// --- Fonctions Speed Drill Stats ---

export interface SpeedDrillSession {
    id?: number;
    user_id: string;
    operation_type: string;
    difficulty: string;
    score: number;
    total_questions: number;
    accuracy: number;
    time_seconds: number;
    created_at?: string;
}

export interface SpeedDrillStats {
    totalSessions: number;
    bestScore: number;
    bestTime: number;
    bestOperation: string; // Ex: "Addition"
    bestDifficulty: string; // Ex: "Facile"
    avgAccuracy: number;
    lastPlayed: string | null;
    byCategory: { // Détails par opération/difficulté
        operation: string;
        difficulty: string;
        bestScore: number;
        bestTime: number;
        sessions: number;
    }[];
}

/**
 * Sauvegarder une session Speed Drill
 */
export const saveSpeedDrillSession = async (sessionData: Omit<SpeedDrillSession, 'id' | 'created_at'>): Promise<void> => {
    const { error } = await supabase
        .from('speed_drill_sessions')
        .insert({
            user_id: sessionData.user_id,
            operation_type: sessionData.operation_type,
            difficulty: sessionData.difficulty,
            score: sessionData.score,
            total_questions: sessionData.total_questions,
            accuracy: sessionData.accuracy,
            time_seconds: sessionData.time_seconds
        });
    
    if (error) {
        console.error("Erreur lors de la sauvegarde de la session Speed Drill:", error);
        throw new Error("Impossible de sauvegarder la session.");
    }
};

/**
 * Récupérer les statistiques Speed Drill d'un explorateur
 */
export const fetchSpeedDrillStats = async (userId: string): Promise<SpeedDrillStats> => {
    const { data, error } = await supabase
        .from('speed_drill_sessions')
        .select('*')
        .eq('user_id', userId);
    
    if (error) {
        console.error("Erreur lors de la récupération des stats Speed Drill:", error);
        return { 
            totalSessions: 0, 
            bestScore: 0, 
            bestTime: 0, 
            bestOperation: '', 
            bestDifficulty: '', 
            avgAccuracy: 0, 
            lastPlayed: null,
            byCategory: []
        };
    }
    
    if (!data || data.length === 0) {
        return { 
            totalSessions: 0, 
            bestScore: 0, 
            bestTime: 0, 
            bestOperation: '', 
            bestDifficulty: '', 
            avgAccuracy: 0, 
            lastPlayed: null,
            byCategory: []
        };
    }
    
    const totalSessions = data.length;
    
    // Trouver la meilleure session globale : score max, puis temps min en cas d'égalité
    const bestSession = data.reduce((best, current) => {
        if (current.score > best.score) {
            return current;
        } else if (current.score === best.score && current.time_seconds < best.time_seconds) {
            return current;
        }
        return best;
    });
    
    const bestScore = bestSession.score;
    const bestTime = bestSession.time_seconds;
    const bestOperation = bestSession.operation_type;
    const bestDifficulty = bestSession.difficulty;
    const avgAccuracy = data.reduce((acc, s) => acc + s.accuracy, 0) / totalSessions;
    const lastPlayed = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at;
    
    // Grouper par opération + difficulté
    const categoryMap: Record<string, SpeedDrillSession[]> = {};
    data.forEach(session => {
        const key = `${session.operation_type}|${session.difficulty}`;
        if (!categoryMap[key]) {
            categoryMap[key] = [];
        }
        categoryMap[key].push(session);
    });
    
    // Calculer les stats par catégorie
    const byCategory = Object.entries(categoryMap).map(([key, sessions]) => {
        const [operation, difficulty] = key.split('|');
        const best = sessions.reduce((best, current) => {
            if (current.score > best.score) {
                return current;
            } else if (current.score === best.score && current.time_seconds < best.time_seconds) {
                return current;
            }
            return best;
        });
        return {
            operation,
            difficulty,
            bestScore: best.score,
            bestTime: best.time_seconds,
            sessions: sessions.length
        };
    });
    
    return {
        totalSessions,
        bestScore,
        bestTime,
        bestOperation,
        bestDifficulty,
        avgAccuracy: Math.round(avgAccuracy),
        lastPlayed,
        byCategory
    };
};

/**
 * Récupérer toutes les sessions d'un explorateur (pour détails)
 */
export const fetchSpeedDrillSessions = async (userId: string): Promise<SpeedDrillSession[]> => {
    const { data, error } = await supabase
        .from('speed_drill_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Erreur lors de la récupération des sessions Speed Drill:", error);
        return [];
    }
    
    return data || [];
};

/**
 * Récupérer le meilleur score pour une combinaison opération/difficulté
 */
export const fetchBestScore = async (userId: string, operationType: string, difficulty: string): Promise<SpeedDrillSession | null> => {
    const { data, error } = await supabase
        .from('speed_drill_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('operation_type', operationType)
        .eq('difficulty', difficulty)
        .order('score', { ascending: false })
        .order('time_seconds', { ascending: true })
        .limit(1);
    
    if (error || !data || data.length === 0) {
        return null;
    }
    
    return data[0];
};

/**
 * Récupérer les stats de tous les explorateurs d'un mentor
 */
export const fetchAllExplorerSpeedDrillStats = async (mentorId: string): Promise<Record<string, SpeedDrillStats>> => {
    // 1. Récupérer tous les explorateurs du mentor
    const { data: explorers, error: explorerError } = await supabase
        .from('explorers')
        .select('explorer_uuid, name')
        .eq('mentor_id', mentorId)
        .eq('is_active', true);
    
    if (explorerError || !explorers) {
        console.error("Erreur lors de la récupération des explorateurs:", explorerError);
        return {};
    }
    
    // 2. Pour chaque explorateur, récupérer ses stats
    const statsPromises = explorers.map(async (explorer) => {
        const stats = await fetchSpeedDrillStats(explorer.explorer_uuid);
        return { [explorer.explorer_uuid]: stats };
    });
    
    const statsArray = await Promise.all(statsPromises);
    return Object.assign({}, ...statsArray);
};
