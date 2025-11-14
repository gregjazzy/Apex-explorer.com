// /services/dataService.ts

import i18n from '../config/i18n';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGE_CATALOG, BadgeConfig, getTranslatedBadge } from '../config/badgeSystem';

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

// Interface pour Hall of Fame
export interface LeaderboardEntry {
    user_id: string;
    user_name: string;
    xp: number;
    completed_modules: number;
    rank: number;
}

export interface SpeedDrillRecord {
    user_id: string;
    user_name: string;
    operation_type: string;
    best_time: number;
    best_score: number;
}

export interface StreakLeader {
    user_id: string;
    user_name: string;
    longest_streak: number;
    current_streak: number;
}

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
    mentor_id: string | null; // NULL si explorateur solo
    xp_total: number;
    created_at: string;
    is_active: boolean;
    is_solo?: boolean; // true si explorateur autonome
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

// --- Données de Simulation de Base (M1-M19) ---

// ⚠️ ARCHITECTURE CRITIQUE - LIRE AVANT MODIFICATION
// 
// Les IDs techniques (m1, m2, m3, etc.) NE DOIVENT JAMAIS ÊTRE MODIFIÉS !
// Ils sont utilisés comme clés dans la base de données, les traductions, et les badges.
// 
// Pour changer l'ordre d'affichage des modules, modifiez uniquement MODULE_DISPLAY_ORDER ci-dessous.
// L'utilisateur verra "MODULE 1", "MODULE 2", etc. dans cet ordre, mais les IDs restent fixes.
// 
// Documentation complète : /⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md
//
// Exemple : MODULE_DISPLAY_ORDER = ['m12', 'm14', ...]
//   → L'utilisateur voit : MODULE 1 (m12), MODULE 2 (m14), etc.
//

// Structure des blocs thématiques (pour affichage visuel)
export interface ModuleBlock {
  id: string;
  titleKey: string;          // Clé de traduction pour le titre
  descriptionKey: string;    // Clé de traduction pour la description
  icon: string;              // Emoji du bloc
  color: string;             // Couleur principale du bloc
  isFree: boolean;           // Si le bloc est gratuit
  moduleIds: string[];       // IDs des modules dans ce bloc
}

export const MODULE_BLOCKS: ModuleBlock[] = [
  {
    id: 'discovery',
    titleKey: 'blocks.discovery.title',
    descriptionKey: 'blocks.discovery.description',
    icon: '🎁',
    color: '#10B981', // Vert
    isFree: true,
    moduleIds: ['m12']
  },
  {
    id: 'ai_future',
    titleKey: 'blocks.ai_future.title',
    descriptionKey: 'blocks.ai_future.description',
    icon: '🤖',
    color: '#6366F1', // Indigo
    isFree: false,
    moduleIds: ['m14', 'm15', 'm16', 'm17', 'm18', 'm19']
  },
  {
    id: 'leadership',
    titleKey: 'blocks.leadership.title',
    descriptionKey: 'blocks.leadership.description',
    icon: '💼',
    color: '#F59E0B', // Amber
    isFree: false,
    moduleIds: ['m13', 'm5', 'm10', 'm7']
  },
  {
    id: 'strategy',
    titleKey: 'blocks.strategy.title',
    descriptionKey: 'blocks.strategy.description',
    icon: '🧠',
    color: '#8B5CF6', // Violet
    isFree: false,
    moduleIds: ['m1', 'm4', 'm2']
  },
  {
    id: 'execution',
    titleKey: 'blocks.execution.title',
    descriptionKey: 'blocks.execution.description',
    icon: '⚙️',
    color: '#06B6D4', // Cyan
    isFree: false,
    moduleIds: ['m3', 'm8', 'm6']
  },
  {
    id: 'excellence',
    titleKey: 'blocks.excellence.title',
    descriptionKey: 'blocks.excellence.description',
    icon: '🏆',
    color: '#EF4444', // Red
    isFree: false,
    moduleIds: ['m9', 'm11']
  }
];

// Ordre d'affichage des modules (dérivé de MODULE_BLOCKS)
const MODULE_DISPLAY_ORDER = MODULE_BLOCKS.flatMap(block => block.moduleIds);

// IDs techniques des modules (IMMUABLES - NE JAMAIS RENOMMER)
// Ces IDs sont des clés primaires utilisées dans la DB, traductions, et badges
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
  { id: 'm12', isUnlocked: true },
  { id: 'm13', isUnlocked: true },
  { id: 'm14', isUnlocked: true },
  { id: 'm15', isUnlocked: true },
  { id: 'm16', isUnlocked: true },
  { id: 'm17', isUnlocked: true },
  { id: 'm18', isUnlocked: true },
  { id: 'm19', isUnlocked: true },
];

interface BaseDefi {
    id: string;
    xpValue: number;
    requires: string[];
}

// Configuration des défis par module (utilise les IDs techniques)
// Format : moduleId => [défis avec xpValue et dépendances]
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
    ],
    m12: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m13: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m14: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m15: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m16: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m17: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m18: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
    ],
    m19: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: [] },
        { id: 'defi3', xpValue: 100, requires: [] },
        { id: 'defi4', xpValue: 100, requires: [] },
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

    // 2. Construire la liste finale des modules selon MODULE_DISPLAY_ORDER
    const modules = MODULE_DISPLAY_ORDER.map(moduleId => {
        const module = BASE_MODULE_DATA_SIM.find(m => m.id === moduleId);
        if (!module) return null;
        
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
    }).filter((m): m is Module => m !== null);
    
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
        .maybeSingle();
    
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
    console.log('🔍 Tentative de connexion avec:', { name, pin });
    
    const { data, error } = await supabase
        .from('explorers')
        .select('*')
        .eq('name', name)
        .eq('pin_code', pin)
        .eq('is_active', true)
        .maybeSingle();
        
    console.log('📊 Résultat de la recherche:', { data, error });
        
    if (error) {
        console.error("Échec de la connexion Explorateur:", error);
        return null;
    }

    if (data) {
        console.log('✅ Compte trouvé!', data);
    } else {
        console.log('❌ Aucun compte trouvé');
    }

    return data as ExplorerProfile | null;
};

/**
 * NOUVEAU: Crée un explorateur solo (sans mentor).
 */
export const createSoloExplorer = async (name: string, pin: string): Promise<ExplorerProfile | null> => {
    // IMPORTANT: Vérifier d'abord si le NOM existe déjà (indépendamment du PIN)
    const { data: nameExists } = await supabase
        .from('explorers')
        .select('name')
        .eq('name', name)
        .maybeSingle();
    
    if (nameExists) {
        console.error("Ce nom d'explorateur existe déjà");
        return null; // Le nom est déjà pris
    }
    
    // Créer le nouvel explorateur solo
    const { data, error } = await supabase
        .from('explorers')
        .insert({
            name,
            pin_code: pin,
            mentor_id: null, // Pas de mentor
            is_solo: true,
            is_active: true,
            xp_total: 0,
        })
        .select()
        .single();
    
    if (error) {
        console.error("Échec de la création d'explorateur solo:", error);
        return null;
    }

    return data as ExplorerProfile;
};

/**
 * NOUVEAU: Récupère le profil complet d'un explorateur par son UUID.
 */
export const getExplorerProfile = async (explorerUuid: string): Promise<ExplorerProfile | null> => {
    const { data, error } = await supabase
        .from('explorers')
        .select('*')
        .eq('explorer_uuid', explorerUuid)
        .maybeSingle();
    
    if (error) {
        console.error("Échec de la récupération du profil explorateur:", error);
        return null;
    }

    return data as ExplorerProfile | null;
};

/**
 * NOUVEAU: Lie un explorateur solo existant à un mentor.
 * Permet de passer de mode autonome à mode supervisé sans perdre la progression.
 */
export const linkExistingExplorer = async (
    explorerName: string, 
    explorerPin: string, 
    mentorId: string
): Promise<ExplorerProfile | null> => {
    // 1. Vérifier que l'explorateur existe et que le PIN est correct
    const { data: explorer, error: findError } = await supabase
        .from('explorers')
        .select('*')
        .eq('name', explorerName)
        .eq('pin_code', explorerPin)
        .eq('is_active', true)
        .maybeSingle();
    
    if (findError || !explorer) {
        console.error("Explorateur non trouvé ou PIN incorrect:", findError);
        return null;
    }
    
    // 2. Vérifier que l'explorateur n'a pas déjà un mentor
    if (explorer.mentor_id && !explorer.is_solo) {
        console.error("Cet explorateur a déjà un mentor");
        return null;
    }
    
    // 3. Lier l'explorateur au mentor
    const { data: updated, error: updateError } = await supabase
        .from('explorers')
        .update({
            mentor_id: mentorId,
            is_solo: false,
        })
        .eq('explorer_uuid', explorer.explorer_uuid)
        .select()
        .single();
    
    if (updateError) {
        console.error("Échec de la liaison explorateur-mentor:", updateError);
        return null;
    }

    return updated as ExplorerProfile;
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
        .maybeSingle();

    if (error) {
        if (error.code === 'PGRST116') { // No rows returned
            return null;
        }
        console.error("Erreur Supabase lors du fetch du défi spécifique:", error);
        return null;
    }

    // IMPORTANT: data peut être null si aucun résultat
    if (!data) {
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
    
    // NOUVEAU: Récupérer les badges déjà AFFICHÉS à l'écran (côté client)
    const displayedBadgesKey = `displayed_badges_${userId}`;
    const displayedBadgesJson = await AsyncStorage.getItem(displayedBadgesKey);
    const displayedBadges: string[] = displayedBadgesJson ? JSON.parse(displayedBadgesJson) : [];
    
    // Calculer les modules complétés (TOUS les défis du module doivent être complétés)
    const allModuleIds = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18', 'm19'];
    const completedModules = allModuleIds.filter(moduleId => {
        const defisInModule = BASE_DEFIS_SIM[moduleId] || [];
        const completedDefisInModule = progressItems.filter(p => 
            p.moduleId === moduleId && p.status === 'completed'
        );
        // Un module est complété si TOUS ses défis sont complétés
        return completedDefisInModule.length >= defisInModule.length && defisInModule.length > 0;
    }).length;
    
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
                earned = completedModules >= 19;
                badgeProgress = Math.min(100, (completedModules / 19) * 100);
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
                const allModuleIds = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18', 'm19'];
                const perfectModules = allModuleIds.filter(mid => {
                    const defisInModuleConfig = BASE_DEFIS_SIM[mid] || [];
                    const totalDefisInModule = defisInModuleConfig.length;
                    const completedDefisInModule = progressItems.filter((p: ExplorerProgressItem) => 
                        p.moduleId === mid && p.status === 'completed'
                    );
                    // Un module est parfait si TOUS ses défis sont complétés
                    return totalDefisInModule > 0 && completedDefisInModule.length >= totalDefisInModule;
                });
                earned = perfectModules.length === 19;
                badgeProgress = Math.min(100, (perfectModules.length / 19) * 100);
                break;
            
            // ===== BADGES M12 (MODULE GRATUIT) - MICRO-BADGES PAR DÉFI =====
            // 🎁 Stratégie d'engagement : badge immédiat à chaque défi
            case 'm12_defi1':
                const m12d1 = progressItems.find(p => p.moduleId === 'm12' && p.defiId === 'defi1' && p.status === 'completed');
                earned = !!m12d1;
                badgeProgress = earned ? 100 : 0;
                break;
                
            case 'm12_defi2':
                const m12d2 = progressItems.find(p => p.moduleId === 'm12' && p.defiId === 'defi2' && p.status === 'completed');
                earned = !!m12d2;
                badgeProgress = earned ? 100 : 0;
                break;
                
            case 'm12_defi3':
                const m12d3 = progressItems.find(p => p.moduleId === 'm12' && p.defiId === 'defi3' && p.status === 'completed');
                earned = !!m12d3;
                badgeProgress = earned ? 100 : 0;
                break;
                
            case 'm12_defi4':
                const m12d4 = progressItems.find(p => p.moduleId === 'm12' && p.defiId === 'defi4' && p.status === 'completed');
                earned = !!m12d4;
                badgeProgress = earned ? 100 : 0;
                break;
            
            // Badge MASTER M12 (après les 4 défis)
            case 'module_m12':
                const m12Defis = progressItems.filter(p => p.moduleId === 'm12' && p.status === 'completed');
                earned = m12Defis.length >= 4;
                badgeProgress = Math.min(100, (m12Defis.length / 4) * 100);
                break;
            
            // ===== BADGES MODULES PREMIUM (M13-M19) =====
            // Pas de micro-badges, uniquement badge de module
                
            case 'module_m13':
                const m13Defis = progressItems.filter(p => p.moduleId === 'm13' && p.status === 'completed');
                earned = m13Defis.length >= 4;
                badgeProgress = Math.min(100, (m13Defis.length / 4) * 100);
                break;
                
            case 'module_m14':
                const m14Defis = progressItems.filter(p => p.moduleId === 'm14' && p.status === 'completed');
                earned = m14Defis.length >= 4;
                badgeProgress = Math.min(100, (m14Defis.length / 4) * 100);
                break;
                
            case 'module_m15':
                const m15Defis = progressItems.filter(p => p.moduleId === 'm15' && p.status === 'completed');
                earned = m15Defis.length >= 4;
                badgeProgress = Math.min(100, (m15Defis.length / 4) * 100);
                break;
                
            case 'module_m16':
                const m16Defis = progressItems.filter(p => p.moduleId === 'm16' && p.status === 'completed');
                earned = m16Defis.length >= 4;
                badgeProgress = Math.min(100, (m16Defis.length / 4) * 100);
                break;
                
            case 'module_m17':
                const m17Defis = progressItems.filter(p => p.moduleId === 'm17' && p.status === 'completed');
                earned = m17Defis.length >= 4;
                badgeProgress = Math.min(100, (m17Defis.length / 4) * 100);
                break;
                
            case 'module_m18':
                const m18Defis = progressItems.filter(p => p.moduleId === 'm18' && p.status === 'completed');
                earned = m18Defis.length >= 4;
                badgeProgress = Math.min(100, (m18Defis.length / 4) * 100);
                break;
                
            case 'module_m19':
                const m19Defis = progressItems.filter(p => p.moduleId === 'm19' && p.status === 'completed');
                earned = m19Defis.length >= 4;
                badgeProgress = Math.min(100, (m19Defis.length / 4) * 100);
                break;
            
            // BADGE ULTIME : BLOC IA COMPLET
            case 'ai_master':
                const aiModuleIds = ['m14', 'm15', 'm16', 'm17', 'm18', 'm19'];
                const completedAIModules = aiModuleIds.filter(mid => {
                    const defisInModuleConfig = BASE_DEFIS_SIM[mid] || [];
                    const totalDefisInModule = defisInModuleConfig.length;
                    const completedDefisInModule = progressItems.filter((p: ExplorerProgressItem) => 
                        p.moduleId === mid && p.status === 'completed'
                    );
                    // Un module est complété si TOUS ses défis sont complétés
                    return totalDefisInModule > 0 && completedDefisInModule.length >= totalDefisInModule;
                });
                earned = completedAIModules.length === 6;
                badgeProgress = Math.min(100, (completedAIModules.length / 6) * 100);
                break;
        }
        
        // Détecter les nouveaux badges (jamais gagnés OU gagnés mais jamais affichés)
        if (earned) {
            earnedBadgeIds.push(badge.id);
            
            // Sauvegarder dans Supabase si nouveau badge
            // Nécessite: RLS policies configurées (voir earned_badges_rls.sql)
            if (!previouslyEarned.includes(badge.id)) {
                saveEarnedBadge(userId, badge.id);
            }
            
            // Si le badge n'a PAS encore été affiché à l'écran, l'ajouter aux nouveaux
            if (!displayedBadges.includes(badge.id)) {
                const translatedBadge = getTranslatedBadge(badge);
                const newBadge: EarnedBadge = { ...translatedBadge, earned, earnedAt: new Date().toISOString(), progress: badgeProgress };
                newlyUnlocked.push(newBadge);
            }
        }
        
        // Traduire le badge avant de le retourner
        const translatedBadge = getTranslatedBadge(badge);
        return { ...translatedBadge, earned, progress: badgeProgress };
    });
    
    // NOTE: On ne marque PAS comme "displayed" ici !
    // C'est fait dans ExplorerDashboardScreen après que l'utilisateur ferme la modal
    
    return { badges, newlyUnlocked };
};

// Marquer un badge comme "affiché" dans AsyncStorage (après fermeture de la modal)
export const markBadgeAsDisplayed = async (userId: string, badgeId: string): Promise<void> => {
    try {
        const displayedBadgesKey = `displayed_badges_${userId}`;
        const displayedBadgesJson = await AsyncStorage.getItem(displayedBadgesKey);
        const displayedBadges: string[] = displayedBadgesJson ? JSON.parse(displayedBadgesJson) : [];
        
        if (!displayedBadges.includes(badgeId)) {
            displayedBadges.push(badgeId);
            await AsyncStorage.setItem(displayedBadgesKey, JSON.stringify(displayedBadges));
        }
    } catch (error) {
        console.error('Erreur markBadgeAsDisplayed:', error);
    }
};

// Sauvegarder un badge débloqué dans la base
async function saveEarnedBadge(userId: string, badgeId: string) {
    try {
        // Utiliser upsert pour éviter les erreurs de duplication
        // onConflict spécifie la contrainte unique (user_id, badge_id)
        const { error } = await supabase
            .from('earned_badges')
            .upsert({
                user_id: userId,
                badge_id: badgeId,
                earned_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,badge_id',
                ignoreDuplicates: false // Met à jour earned_at si le badge existe déjà
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

/**
 * Vérifie rapidement si la complétion d'un défi débloquera un nouveau badge
 * SANS recalculer tous les badges (optimisation de performance)
 * 
 * @param userId - explorer_uuid de l'explorateur
 * @param moduleId - ID du module (ex: 'm12')
 * @param defiId - ID du défi (ex: 'defi1')
 * @returns true si un nouveau badge sera débloqué, false sinon
 */
export const willUnlockNewBadge = async (
    userId: string,
    moduleId: string,
    defiId: string
): Promise<boolean> => {
    try {
        // 1. Récupérer les badges déjà gagnés
        const earnedBadgeIds = await getEarnedBadgeIds(userId);
        
        // 2. Vérifier le badge micro du défi (uniquement pour M12)
        if (moduleId === 'm12') {
            const microBadgeId = `m12_${defiId}`; // Ex: 'm12_defi1'
            
            // Si le badge micro n'existe pas encore, on aura un nouveau badge
            if (!earnedBadgeIds.includes(microBadgeId)) {
                console.log(`✨ Nouveau badge détecté: ${microBadgeId}`);
                return true;
            }
        }
        
        // 3. Vérifier le badge module (si tous les défis du module sont complétés)
        const moduleBadgeId = `module_${moduleId}`; // Ex: 'module_m12'
        
        // Si le badge module n'existe pas encore, vérifier si on va le débloquer
        if (!earnedBadgeIds.includes(moduleBadgeId)) {
            // Récupérer tous les défis complétés pour ce module
            const { data: progressData, error } = await supabase
                .from('explorer_progress')
                .select('defi_id')
                .eq('user_id', userId)
                .eq('module_id', moduleId)
                .eq('status', 'completed');
            
            if (error) {
                console.error('Erreur vérification progression:', error);
                return false;
            }
            
            const completedDefiIds = progressData?.map(p => p.defi_id) || [];
            const defisConfig = BASE_DEFIS_SIM[moduleId] || [];
            const totalDefis = defisConfig.length;
            
            // Compter les défis déjà complétés + le défi en cours
            const completedCount = completedDefiIds.length;
            const willCompleteModule = completedCount + 1 >= totalDefis; // +1 pour le défi qu'on vient de compléter
            
            if (willCompleteModule) {
                console.log(`✨ Badge module détecté: ${moduleBadgeId}`);
                return true;
            }
        }
        
        // 4. Aucun nouveau badge
        console.log(`⚪ Aucun nouveau badge pour ${moduleId}/${defiId}`);
        return false;
        
    } catch (error) {
        console.error('Erreur willUnlockNewBadge:', error);
        // En cas d'erreur, on recharge par sécurité
        return true;
    }
};

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
            .maybeSingle();
        
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
            .maybeSingle();
        
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

// ===== HALL OF FAME FUNCTIONS =====

/**
 * Récupérer le classement XP (Top 10)
 */
export const getXPLeaderboard = async (currentUserId?: string): Promise<LeaderboardEntry[]> => {
    try {
        const { data: explorers, error } = await supabase
            .from('explorers')
            .select('explorer_uuid, name')
            .limit(50); // On prend plus large pour ensuite trier par XP calculé

        if (error) {
            console.error('Erreur récupération leaderboard XP:', error);
            return [];
        }

        // Calculer les XP réels pour chaque utilisateur depuis explorer_progress
        const leaderboard: LeaderboardEntry[] = await Promise.all(
            (explorers || []).map(async (explorer) => {
                const { data: progressData } = await supabase
                    .from('explorer_progress')
                    .select('xp_earned, status, module_id')
                    .eq('user_id', explorer.explorer_uuid);

                // Calculer XP total
                const totalXP = (progressData || [])
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + (p.xp_earned || 0), 0);

                // Calculer modules complétés
                const completedModules = new Set(
                    (progressData || [])
                        .filter(p => p.status === 'completed')
                        .map(p => p.module_id)
                ).size;

                return {
                    user_id: explorer.explorer_uuid,
                    user_name: explorer.name || 'Explorateur',
                    xp: totalXP,
                    completed_modules: completedModules,
                    rank: 0, // On assignera après le tri
                };
            })
        );

        // Trier par XP décroissant et assigner les rangs
        const sorted = leaderboard
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10) // Top 10
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
            }));

        return sorted;
    } catch (error) {
        console.error('Erreur getXPLeaderboard:', error);
        return [];
    }
};

/**
 * Récupérer le classement des streaks (Top 10)
 */
export const getStreakLeaderboard = async (): Promise<StreakLeader[]> => {
    try {
        // Solution temporaire : retourner un tableau vide si RLS bloque
        // TODO: Ajouter une policy RLS publique pour le leaderboard
        const { data: streaksData, error } = await supabase
            .from('user_streaks')
            .select('user_id, longest_streak, current_streak')
            .order('longest_streak', { ascending: false })
            .limit(10);

        // Si erreur RLS, retourner vide plutôt que crasher
        if (error) {
            console.warn('⚠️ Leaderboard streaks désactivé (RLS):', error.message);
            return [];
        }

        if (!streaksData || streaksData.length === 0) {
            return [];
        }

        // 2. Récupérer les noms des explorateurs
        const userIds = streaksData.map(s => s.user_id);
        const { data: explorersData } = await supabase
            .from('explorers')
            .select('explorer_uuid, name')
            .in('explorer_uuid', userIds);

        // 3. Créer un map des noms
        const namesMap = new Map(
            (explorersData || []).map(e => [e.explorer_uuid, e.name])
        );

        // 4. Combiner les données
        return streaksData.map(streak => ({
            user_id: streak.user_id,
            user_name: namesMap.get(streak.user_id) || 'Explorateur',
            longest_streak: streak.longest_streak || 0,
            current_streak: streak.current_streak || 0,
        }));
    } catch (error) {
        console.error('Erreur getStreakLeaderboard:', error);
        return [];
    }
};

/**
 * Récupérer les records Speed Drill (meilleurs temps par opération)
 */
export const getSpeedDrillRecords = async (): Promise<SpeedDrillRecord[]> => {
    try {
        const operations = ['Multiplication', 'Division', 'Addition', 'Subtraction'];
        const records: SpeedDrillRecord[] = [];

        for (const operation of operations) {
            const { data, error } = await supabase
                .from('speed_drill_sessions')
                .select(`
                    user_id,
                    operation_type,
                    time_seconds,
                    score
                `)
                .eq('operation_type', operation)
                .eq('score', 10)
                .order('time_seconds', { ascending: true })
                .limit(1);

            if (!error && data && data.length > 0) {
                const record = data[0];
                
                // Récupérer le nom de l'utilisateur
                const { data: explorerData } = await supabase
                    .from('explorers')
                    .select('name')
                    .eq('user_id', record.user_id)
                    .single();

                records.push({
                    user_id: record.user_id,
                    user_name: explorerData?.name || 'Explorateur',
                    operation_type: operation,
                    best_time: record.time_seconds,
                    best_score: record.score,
                });
            }
        }

        return records;
    } catch (error) {
        console.error('Erreur getSpeedDrillRecords:', error);
        return [];
    }
};

/**
 * Récupérer les stats de l'utilisateur actuel pour le Hall of Fame
 */
export const getCurrentUserHallOfFameStats = async (userId: string) => {
    try {
        // 1. Récupérer le profil de l'utilisateur
        const { data: explorer, error: explorerError } = await supabase
            .from('explorers')
            .select('name')
            .eq('explorer_uuid', userId)
            .single();

        if (explorerError) {
            console.error('Erreur récupération profil:', explorerError);
            return null;
        }

        // 2. Récupérer la progression et calculer les XP
        const { data: progressData } = await supabase
            .from('explorer_progress')
            .select('xp_earned, status, module_id')
            .eq('user_id', userId);

        const totalXP = (progressData || [])
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.xp_earned || 0), 0);

        const completedModules = new Set(
            (progressData || [])
                .filter(p => p.status === 'completed')
                .map(p => p.module_id)
        ).size;

        // 3. Récupérer le streak depuis user_streaks
        const { data: streakData } = await supabase
            .from('user_streaks')
            .select('longest_streak, current_streak')
            .eq('user_id', userId)
            .maybeSingle();

        // 4. Calculer le classement XP
        const { count: betterCount } = await supabase
            .from('explorers')
            .select('*', { count: 'exact', head: true })
            .gt('xp_total', totalXP);

        const xpRank = (betterCount || 0) + 1;

        // 5. Récupérer le meilleur temps Speed Drill
        const { data: speedData } = await supabase
            .from('speed_drill_sessions')
            .select('time_seconds, operation_type')
            .eq('user_id', userId)
            .eq('score', 10)
            .order('time_seconds', { ascending: true })
            .limit(1);

        return {
            name: explorer.name || 'Explorateur',
            xp: totalXP,
            xpRank,
            completedModules,
            longestStreak: streakData?.longest_streak || 0,
            currentStreak: streakData?.current_streak || 0,
            bestSpeedTime: speedData && speedData.length > 0 ? speedData[0].time_seconds : null,
            bestSpeedOperation: speedData && speedData.length > 0 ? speedData[0].operation_type : null,
        };
    } catch (error) {
        console.error('Erreur getCurrentUserHallOfFameStats:', error);
        return null;
    }
};

// ===== TRACKING DES ÉLÉMENTS VUS (POUR BADGES NOTIFICATION) =====

/**
 * Récupérer le timestamp de la dernière visite d'une section
 */
export const getLastSeenTimestamp = async (userId: string, section: 'badges' | 'hall_of_fame' | 'speed_drill_stats'): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('user_last_seen')
            .select('last_seen_at')
            .eq('user_id', userId)
            .eq('section', section)
            .maybeSingle();
        
        if (error) {
            console.error('Erreur getLastSeenTimestamp:', error);
            return null;
        }
        
        return data?.last_seen_at || null;
    } catch (error) {
        console.error('Erreur getLastSeenTimestamp:', error);
        return null;
    }
};

/**
 * Mettre à jour le timestamp de la dernière visite
 */
export const updateLastSeenTimestamp = async (userId: string, section: 'badges' | 'hall_of_fame' | 'speed_drill_stats'): Promise<void> => {
    try {
        const { error } = await supabase
            .from('user_last_seen')
            .upsert({
                user_id: userId,
                section,
                last_seen_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,section'
            });
        
        if (error) {
            console.error('Erreur updateLastSeenTimestamp:', error);
        }
    } catch (error) {
        console.error('Erreur updateLastSeenTimestamp:', error);
    }
};

/**
 * Compter les nouveaux badges non vus
 */
export const getUnseenBadgesCount = async (userId: string): Promise<number> => {
    try {
        const lastSeen = await getLastSeenTimestamp(userId, 'badges');
        
        if (!lastSeen) {
            // Si jamais visité, compter tous les badges gagnés
            const { count, error } = await supabase
                .from('earned_badges')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            return count || 0;
        }
        
        // Compter les badges gagnés depuis la dernière visite
        const { count, error } = await supabase
            .from('earned_badges')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gt('earned_at', lastSeen);
        
        return count || 0;
    } catch (error) {
        console.error('Erreur getUnseenBadgesCount:', error);
        return 0;
    }
};

/**
 * Compter les nouvelles sessions Speed Drill non vues
 */
export const getUnseenSpeedDrillCount = async (userId: string): Promise<number> => {
    try {
        const lastSeen = await getLastSeenTimestamp(userId, 'speed_drill_stats');
        
        if (!lastSeen) {
            // Si jamais visité, compter toutes les sessions
            const { count, error } = await supabase
                .from('speed_drill_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            return count || 0;
        }
        
        // Compter les sessions depuis la dernière visite
        const { count, error } = await supabase
            .from('speed_drill_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gt('created_at', lastSeen);
        
        return count || 0;
    } catch (error) {
        console.error('Erreur getUnseenSpeedDrillCount:', error);
        return 0;
    }
};

