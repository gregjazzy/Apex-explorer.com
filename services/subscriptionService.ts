// /services/subscriptionService.ts
import { supabase } from '../config/supabase';

/**
 * Types d'abonnement
 */
export type SubscriptionStatus = 'free' | 'trial' | 'premium';

export interface SubscriptionInfo {
    status: SubscriptionStatus;
    expiresAt: string | null;
    canAccessModule: (moduleId: string) => boolean;
    canAccessSpeedDrills: boolean;
}

/**
 * Modules gratuits (accessible sans abonnement)
 */
const FREE_MODULES = ['m1', 'm2'];

/**
 * Vérifie le statut d'abonnement d'un utilisateur
 */
export const checkSubscription = async (userId: string): Promise<SubscriptionInfo> => {
    const { data, error } = await supabase
        .from('explorers')
        .select('subscription_status, subscription_expires_at')
        .eq('explorer_uuid', userId)
        .single();
    
    if (error || !data) {
        // Par défaut : accès gratuit limité
        return {
            status: 'free',
            expiresAt: null,
            canAccessModule: (moduleId: string) => FREE_MODULES.includes(moduleId),
            canAccessSpeedDrills: false
        };
    }
    
    const status = data.subscription_status || 'free';
    const expiresAt = data.subscription_expires_at;
    
    // Vérifier si le trial a expiré
    if (status === 'trial' && expiresAt) {
        const isExpired = new Date() > new Date(expiresAt);
        if (isExpired) {
            // Downgrade automatique vers free
            await supabase
                .from('explorers')
                .update({ subscription_status: 'free' })
                .eq('explorer_uuid', userId);
            
            return {
                status: 'free',
                expiresAt: null,
                canAccessModule: (moduleId: string) => FREE_MODULES.includes(moduleId),
                canAccessSpeedDrills: false
            };
        }
    }
    
    // Retourner les permissions selon le statut
    if (status === 'premium' || status === 'trial') {
        return {
            status,
            expiresAt,
            canAccessModule: () => true, // Accès à tout
            canAccessSpeedDrills: true
        };
    }
    
    // Version gratuite
    return {
        status: 'free',
        expiresAt: null,
        canAccessModule: (moduleId: string) => FREE_MODULES.includes(moduleId),
        canAccessSpeedDrills: false
    };
};

/**
 * Active un abonnement trial (7 jours gratuits)
 */
export const activateTrial = async (userId: string): Promise<boolean> => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours
    
    const { error } = await supabase
        .from('explorers')
        .update({
            subscription_status: 'trial',
            subscription_expires_at: expiresAt.toISOString()
        })
        .eq('explorer_uuid', userId);
    
    return !error;
};

/**
 * Active un abonnement premium (après paiement)
 */
export const activatePremium = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('explorers')
        .update({
            subscription_status: 'premium',
            subscription_expires_at: null // Pas d'expiration
        })
        .eq('explorer_uuid', userId);
    
    return !error;
};

