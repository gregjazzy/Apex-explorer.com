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

// --- Données de Simulation de Base (M1-M4) ---

const BASE_MODULE_DATA_SIM = [
  { id: 'm1', isUnlocked: true },
  { id: 'm2', isUnlocked: false },
  { id: 'm3', isUnlocked: false },
  { id: 'm4', isUnlocked: false },
  // Simplifié à M1-M4 pour le test initial
];

interface BaseDefi {
    id: string;
    xpValue: number;
    requires: string[];
}

const BASE_DEFIS_SIM: Record<string, BaseDefi[]> = {
    m1: [
        { id: 'defi1', xpValue: 100, requires: [] },
        { id: 'defi2', xpValue: 100, requires: ['defi1'] }, // Débloqué après defi1
        { id: 'defi3', xpValue: 100, requires: ['defi2'] },
    ],
    m2: [
        { id: 'defi1', xpValue: 100, requires: [] },
    ],
    m3: [
        { id: 'defi1', xpValue: 100, requires: [] },
    ],
    m4: [
        { id: 'defi1', xpValue: 100, requires: [] },
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
            
            // Obtenir le titre traduit
            let title = i18n.t('defi.title');
            if (module.id === 'm1' && baseDefi.id === 'defi1') {
                title = i18n.t('m1.defi1.titre');
            } else {
                title = `${i18n.t('defi.title')} ${baseDefi.id.replace('defi', '')}`;
            }
            
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
