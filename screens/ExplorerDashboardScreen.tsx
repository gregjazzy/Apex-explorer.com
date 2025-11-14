// /screens/ExplorerDashboardScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { fetchModulesWithProgress, Module, calculateBadges, Badge, ExplorerProgressItem, fetchSpeedDrillStats, SpeedDrillStats, calculateAdvancedBadges, EarnedBadge, getUserStreak, UserStreak, updateUserStreak, getExplorerProfile, markBadgeAsDisplayed, MODULE_BLOCKS, ModuleBlock, getUnseenBadgesCount, getUnseenSpeedDrillCount, updateLastSeenTimestamp } from '../services/dataService'; 
import ProgressBar from '../components/ProgressBar';
import BadgeList from '../components/BadgeList';
import XPCounter from '../components/XPCounter';
import Mascot from '../components/Mascot';
import StreakDisplay from '../components/StreakDisplay';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import { useBadgeUnlock } from '../hooks/useBadgeUnlock';
import { getMascotMessageForContext, getMascotMessageForXP } from '../utils/mascotMessages';
import PremiumTheme from '../config/premiumTheme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 900;

// Composant pour le séparateur de bloc thématique (GRIS NEUTRE pour app premium)
const BlockSeparator: React.FC<{
    block: ModuleBlock;
    moduleCount: number;
    completedCount: number;
    t: any;
}> = ({ block, moduleCount, completedCount, t }) => {
    const blockTitle = t(block.titleKey);
    
    return (
        <View style={styles.blockSeparator}>
            <View style={styles.separatorContent}>
                <View style={styles.separatorLeft}>
                    <Text style={styles.separatorIcon}>{block.icon}</Text>
                    <Text style={styles.separatorTitle}>{blockTitle}</Text>
                    {block.isFree && (
                        <Text style={styles.freeText}>• Gratuit</Text>
                    )}
                </View>
                
                {/* Compteur de progression */}
                <View style={styles.separatorRight}>
                    {completedCount === moduleCount ? (
                        <Text style={styles.separatorCompleted}>✓ {completedCount}/{moduleCount}</Text>
                    ) : (
                        <Text style={styles.separatorCount}>{completedCount}/{moduleCount}</Text>
                    )}
                </View>
            </View>
        </View>
    );
};

// Composant de l'item de module PREMIUM avec gradient
const ModuleItem: React.FC<{ 
    module: Module; 
    navigation: any; 
    t: any; 
    index: number;
}> = ({ module, navigation, t, index }) => {
    const [hovered, setHovered] = useState(false);
    
    // Détermination simple du statut (pour l'affichage)
    const isCompleted = module.defis.every(d => d.status === 'completed') && module.isUnlocked;
    const defisCompletedCount = module.defis.filter(d => d.status === 'completed').length;
    const totalDefisCount = module.defis.length;

    const handlePress = () => {
        if (module.isUnlocked) {
            // Ne plus marquer needsRefresh ici - attendre qu'un défi soit complété
            navigation.navigate('DefiList', {
                moduleId: module.id,
                moduleTitle: module.title,
                defis: module.defis,
            });
        } else {
            Alert.alert(t('dashboard.status_locked') || "Verrouillé", `Ce module n'est pas encore débloqué.`);
        }
    };

    // Gradients selon le statut - BLEU INDIGO SOBRE pour app premium
    const gradientColors = isCompleted 
        ? ['#10B981', '#059669'] as const // Vert succès
        : module.isUnlocked 
        ? ['#4F46E5', '#7C3AED'] as const // Bleu indigo élégant (comme avant)
        : ['#F3F4F6', '#E5E7EB'] as const; // Gris neutre

    return (
        <Animatable.View 
            animation="fadeInUp" 
            delay={index * 100}
            duration={600}
            useNativeDriver
        >
            <TouchableOpacity 
                style={[
                    styles.moduleCard, 
                    !module.isUnlocked && styles.lockedCard,
                    isWeb && hovered && module.isUnlocked && styles.moduleCardHovered,
                ]} 
                onPress={handlePress} 
                disabled={!module.isUnlocked}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={PremiumTheme.gradients.primary.start}
                    end={PremiumTheme.gradients.primary.end}
                    style={styles.gradientHeader}
                >
                    <View style={styles.cardHeader}>
                        {/* Numéro dynamique basé sur MODULE_DISPLAY_ORDER (voir ⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md) */}
                        <Text style={styles.moduleId}>MODULE {index + 1}</Text>
                        {/* Badge de statut simplifié - juste un emoji discret */}
                        <Text style={styles.statusEmoji}>
                            {isCompleted ? '✅' : module.isUnlocked ? '' : '🔒'}
                            </Text>
                    </View>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{module.title}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>{module.description}</Text>
                    
                    <ProgressBar progress={module.completionRate} />
                    
                    <View style={styles.moduleFooter}>
                        <Text style={styles.footerText}>
                            {t('defi.completed_count', { completed: defisCompletedCount, total: totalDefisCount })}
                        </Text>
                        {module.isUnlocked && !isCompleted && (
                            <Text style={styles.ctaText}>{t('dashboard.continue_button')} →</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animatable.View>
    );
};

const ExplorerDashboardScreen: React.FC<NativeStackScreenProps<any, 'Explorer'>> = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const [modules, setModules] = useState<Module[]>([]);
    const [badges, setBadges] = useState<EarnedBadge[]>([]);
    const [speedDrillStats, setSpeedDrillStats] = useState<SpeedDrillStats | null>(null);
    const [streak, setStreak] = useState<UserStreak | null>(null);
    const [isSoloExplorer, setIsSoloExplorer] = useState(false);
    const [showSpeedDrillDetails, setShowSpeedDrillDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showMascot, setShowMascot] = useState(false);
    const [mascotAnimation, setMascotAnimation] = useState<'fadeInDown' | 'fadeOutUp'>('fadeInDown');
    
    // NOUVEAU : Compteurs d'éléments non vus
    const [unseenBadgesCount, setUnseenBadgesCount] = useState(0);
    const [unseenSpeedDrillCount, setUnseenSpeedDrillCount] = useState(0);
    
    // Calculer le meilleur temps Speed Drill
    const bestSpeedTime = speedDrillStats?.bestTime || null;
    
    // Hook pour la détection automatique des badges
    const { unlockedBadge, triggerBadgeUnlock, closeBadgeModal } = useBadgeUnlock();

    // Fonction pour fermer la modal ET marquer le badge comme affiché
    const handleBadgeModalClose = useCallback(async () => {
        if (unlockedBadge && user?.id) {
            await markBadgeAsDisplayed(user.id, unlockedBadge.id);
        }
        closeBadgeModal();
    }, [unlockedBadge, user?.id, closeBadgeModal]);

    const loadModules = useCallback(async () => {
        setLoading(true);
        try {
            const userId = user?.id || 'sim_explorer'; 
            
            // NOUVEAU : Charger le profil pour vérifier si solo
            if (user?.id) {
                const profile = await getExplorerProfile(user.id);
                if (profile) {
                    setIsSoloExplorer(profile.is_solo === true);
                }
            }
            
            const fetchedModules = await fetchModulesWithProgress(userId);
            setModules(fetchedModules);
            
            // Calculer la progression
            const allProgress: ExplorerProgressItem[] = fetchedModules.flatMap(module => 
                module.defis
                    .filter(defi => defi.status === 'completed')
                    .map(defi => ({
                        id: Math.random(),
                        moduleId: module.id,
                        defiId: defi.id,
                        status: 'completed' as 'completed' | 'submitted',
                        xpEarned: defi.xpValue,
                        completedAt: new Date().toISOString(),
                    } as ExplorerProgressItem))
            );
            
            // DEBUG: Afficher la progression pour M12
            const m12Progress = allProgress.filter(p => p.moduleId === 'm12');
            console.log('🔍 Progression M12:', m12Progress);
            console.log('🔍 DefiIds trouvés:', m12Progress.map(p => p.defiId));
            
            // NOUVEAU : Charger les stats Speed Drill
            let speedSessions = undefined;
            if (user?.id) {
                const stats = await fetchSpeedDrillStats(user.id);
                setSpeedDrillStats(stats);
                // Passer undefined car calculateAdvancedBadges gèrera sans sessions
            }
            
            // NOUVEAU : Calculer les badges sophistiqués avec détection auto
            console.log('🎯 Calcul des badges avec', allProgress.length, 'défis complétés');
            const { badges: allBadges, newlyUnlocked } = await calculateAdvancedBadges(
                userId,
                allProgress,
                speedSessions
            );
            setBadges(allBadges);
            
            console.log('🏆 Badges calculés:', allBadges.filter(b => b.earned).length, '/', allBadges.length);
            console.log('🎉 Nouveaux badges à afficher:', newlyUnlocked.length);
            if (newlyUnlocked.length > 0) {
                console.log('🎁 Détail nouveaux badges:', newlyUnlocked.map(b => b.id));
            }
            
            // Si nouveaux badges, les afficher
            if (newlyUnlocked.length > 0) {
                console.log('✨ Déclenchement de triggerBadgeUnlock...');
                triggerBadgeUnlock(newlyUnlocked);
            } else {
                console.log('⚠️ Aucun nouveau badge à afficher');
            }
            
            // NOUVEAU : Mettre à jour et récupérer le streak
            const updatedStreak = await updateUserStreak(userId);
            setStreak(updatedStreak);
            
            // NOUVEAU : Charger les compteurs d'éléments non vus
            if (user?.id) {
                const unseenBadges = await getUnseenBadgesCount(user.id);
                const unseenSpeedDrill = await getUnseenSpeedDrillCount(user.id);
                setUnseenBadgesCount(unseenBadges);
                setUnseenSpeedDrillCount(unseenSpeedDrill);
            }
            
        } catch (error) {
            console.error("Erreur de chargement des modules:", error);
            Alert.alert(t('dashboard.load_error') || "Erreur", "Problème de chargement des données.");
        } finally {
            setLoading(false);
        }
    }, [user?.id, t, triggerBadgeUnlock]); 

    useEffect(() => {
        if (user) {
            loadModules();
        }
    }, [user, loadModules]);

    // Recharger les modules quand la langue change
    useEffect(() => {
        if (user) {
            loadModules();
        }
    }, [i18n.language]);

    // OPTIMISÉ: Recharger seulement si explicitement demandé via paramètre de navigation
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // Ne recharger que si explicitement demandé via params (nouveau badge débloqué)
            const route = navigation.getState().routes.find((r: any) => r.name === 'Explorer');
            const shouldReloadFromParams = route?.params?.shouldReload;
            
            if (shouldReloadFromParams && user && !loading) {
                loadModules();
                // Nettoyer les paramètres
                navigation.setParams({ shouldReload: undefined });
            }
        });

        return unsubscribe;
    }, [navigation, user, loading, loadModules]); 
    
    // NOUVEAU: Afficher la mascotte temporairement au chargement
    useEffect(() => {
        if (!loading && modules.length > 0) {
            setShowMascot(true);
            setMascotAnimation('fadeInDown');
            
            // Commencer le fade out après 2,5 secondes
            const fadeOutTimer = setTimeout(() => {
                setMascotAnimation('fadeOutUp');
            }, 2500);
            
            // Masquer complètement après 3 secondes (500ms pour l'animation)
            const hideTimer = setTimeout(() => {
                setShowMascot(false);
            }, 3000);
            
            return () => {
                clearTimeout(fadeOutTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [loading, modules.length]); 

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>{t('global.loading')}</Text>
            </View>
        );
    }
    
    const userName = user?.user_metadata?.name || 'Explorateur'; 
    const totalXP = modules.reduce((acc, module) => acc + module.totalXP, 0);
    
    // Message de la mascotte basé sur le contexte
    const mascotMessage = getMascotMessageForXP(totalXP);

    // Navigation vers Speed Drills
    const handleGoToSpeedDrills = () => {
        navigation.navigate('SpeedDrill');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    {/* Header CUSTOM complet avec tous les éléments */}
                    <View style={styles.customHeader}>
                        {/* Ligne du haut : 3 mini-boutons à gauche + Langue/Déco à droite */}
                        <View style={styles.headerTop}>
                            <View style={styles.miniCircularButtons}>
                                <TouchableOpacity 
                                    style={styles.miniCircularButton}
                                    onPress={async () => {
                                        // Marquer comme vu et naviguer
                                        if (user?.id) {
                                            await updateLastSeenTimestamp(user.id, 'badges');
                                            setUnseenBadgesCount(0);
                                        }
                                        navigation.navigate('Badges' as never);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.miniCircularIcon}>🏆</Text>
                                    {unseenBadgesCount > 0 && (
                                        <View style={styles.miniCircularBadge}>
                                            <Text style={styles.miniCircularBadgeText}>{unseenBadgesCount}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={styles.miniCircularButton}
                                    onPress={() => navigation.navigate('HallOfFame' as never)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.miniCircularIcon}>👑</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={styles.miniCircularButton}
                                    onPress={async () => {
                                        // Marquer comme vu et naviguer
                                        if (user?.id) {
                                            await updateLastSeenTimestamp(user.id, 'speed_drill_stats');
                                            setUnseenSpeedDrillCount(0);
                                        }
                                        navigation.navigate('SpeedDrillStats' as never);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.miniCircularIcon}>⚡</Text>
                                    {unseenSpeedDrillCount > 0 && (
                                        <View style={styles.miniCircularBadge}>
                                            <Text style={styles.miniCircularBadgeText}>{unseenSpeedDrillCount}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.headerTopRight}>
                                <TouchableOpacity 
                                    onPress={() => {
                                        const currentLang = i18n.language.substring(0, 2);
                                        const nextLang = currentLang === 'fr' ? 'en' : 'fr';
                                        i18n.changeLanguage(nextLang);
                                    }}
                                    style={styles.headerIconButton}
                                >
                                    <Text style={styles.headerIcon}>🌐</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    onPress={logout} 
                                    style={styles.headerIconButton}
                                >
                                    <Text style={styles.headerIcon}>🚪</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Ligne du bas : Bonjour + XP + Streak */}
                        <View style={styles.headerBottom}>
                            <Text style={styles.greetingText}>👋 {t('dashboard.greeting')} {userName}</Text>
                            
                            <View style={styles.headerBottomRight}>
                            <View style={styles.xpBadge}>
                                <Text style={styles.xpValue}>{totalXP}</Text>
                                <Text style={styles.xpLabel}>XP</Text>
                            </View>
                                
                                {streak && streak.currentStreak > 0 && (
                                    <View style={styles.inlineStreak}>
                                        <Text style={styles.streakEmoji}>🔥</Text>
                                        <Text style={styles.streakText}>
                                            {streak.currentStreak} {streak.currentStreak > 1 ? t('dashboard.days') : t('dashboard.day')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    
                    {/* Mascotte temporaire qui apparaît/disparaît */}
                    {showMascot && (
                        <Animatable.View 
                            animation={mascotAnimation}
                            duration={500}
                            style={styles.mascotTemporary}
                        >
                            <Mascot 
                                mood={mascotMessage.mood}
                                message={mascotMessage.message}
                                size="small"
                                showBubble={true}
                                animated={false}
                            />
                        </Animatable.View>
                    )}
                    
                    {/* Banner "Inviter un mentor" pour explorateurs solo */}
                    {isSoloExplorer && (
                        <Animatable.View 
                            animation="fadeInDown" 
                            delay={300}
                            style={styles.inviteMentorBanner}
                        >
                            <View style={styles.inviteBannerContent}>
                                <View style={styles.inviteBannerLeft}>
                                    <Text style={styles.inviteBannerEmoji}>🤝</Text>
                                    <View>
                                        <Text style={styles.inviteBannerTitle}>{t('dashboard.solo_mode_title')}</Text>
                                        <Text style={styles.inviteBannerSubtitle}>{t('dashboard.solo_mode_subtitle')}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.inviteButton}
                                    onPress={() => Alert.alert(
                                        t('dashboard.invite_mentor_title'),
                                        t('dashboard.invite_mentor_message', { username: userName }),
                                        [{ text: "OK" }]
                                    )}
                                >
                                    <Text style={styles.inviteButtonText}>{t('dashboard.learn_more')}</Text>
                                </TouchableOpacity>
                            </View>
                        </Animatable.View>
                    )}

                    {/* SECTION SPEED DRILLS PREMIUM AVEC ACCORDÉON */}
                    <Animatable.View animation="fadeIn" delay={300} style={styles.speedDrillContainer}>
                        <TouchableOpacity 
                            style={styles.speedDrillButton} 
                            onPress={handleGoToSpeedDrills}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={PremiumTheme.gradients.speedDrill.colors}
                                start={PremiumTheme.gradients.speedDrill.start}
                                end={PremiumTheme.gradients.speedDrill.end}
                                style={styles.speedDrillGradient}
                            >
                                <Text style={styles.speedDrillButtonText}>⚡ {t('speed_drills.button')}</Text>
                                {speedDrillStats && speedDrillStats.totalSessions > 0 && (
                                    <Text style={styles.speedDrillStats}>
                                        🏆 {t('dashboard.best_score')}: {speedDrillStats.bestScore}/10 {t('global.in')} {speedDrillStats.bestTime}s
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* BOUTON POUR DÉPLIER/REPLIER LES DÉTAILS - SUPPRIMÉ POUR SIMPLIFIER */}
                    </Animatable.View>

                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>🎯 {t('global.continue')}</Text>
                            <Text style={styles.sectionSubtitle}>
                                {modules.filter(m => m.completionRate === 1).length} {modules.filter(m => m.completionRate === 1).length > 1 ? t('dashboard.completed_plural') : t('dashboard.completed')} • {modules.filter(m => m.isUnlocked && m.completionRate < 1).length} {t('dashboard.in_progress')}
                            </Text>
                        </View>
                        {/* Badge de compteur réduit et discret */}
                        <Text style={styles.modulesCountSmall}>{modules.length}</Text>
                    </View>
                    
                    {/* Affichage des modules par blocs thématiques avec SÉPARATEURS VISUELS */}
                    {MODULE_BLOCKS.map((block, blockIndex) => {
                        // Filtrer les modules de ce bloc
                        const blockModules = modules.filter(m => block.moduleIds.includes(m.id));
                        if (blockModules.length === 0) return null;
                        
                        // Compter les modules complétés
                        const completedInBlock = blockModules.filter(m => 
                            m.defis.every(d => d.status === 'completed')
                        ).length;
                        
                        // Index global pour l'animation
                        let globalIndex = 0;
                        for (let i = 0; i < blockIndex; i++) {
                            globalIndex += modules.filter(m => MODULE_BLOCKS[i].moduleIds.includes(m.id)).length;
                        }
                        
                        return (
                            <View key={block.id} style={styles.blockSection}>
                                {/* Séparateur visuel du bloc */}
                                <BlockSeparator 
                                    block={block} 
                                    moduleCount={blockModules.length}
                                    completedCount={completedInBlock}
                                    t={t}
                                />
                                
                                {/* Tous les modules du bloc (toujours visibles) */}
                                <View style={styles.moduleGrid}>
                                    {blockModules.map((module, localIndex) => {
                                        const moduleGlobalIndex = globalIndex + localIndex;
                                        return (
                                            <ModuleItem 
                                                key={module.id} 
                                                module={module} 
                                                navigation={navigation} 
                                                t={t}
                                                index={moduleGlobalIndex}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}

                    {/* INTÉGRATION DES BADGES (EN BAS) */}
                    <BadgeList badges={badges} />
                </View>
            </ScrollView>
            
            {/* NOUVEAU: Modal de Badge Débloqué */}
            {unlockedBadge && (
                <BadgeUnlockModal
                    visible={!!unlockedBadge}
                    badge={unlockedBadge}
                    onClose={handleBadgeModalClose}
                />
            )}
        </SafeAreaView>
    );
};

// Fonction helper pour les emojis d'opération
const getOperationEmoji = (operation: string): string => {
    const emojiMap: Record<string, string> = {
        'Multiplication': '✖️',
        'Division': '➗',
        'Addition': '➕',
        'Subtraction': '➖',
    };
    return emojiMap[operation] || '🔢';
};

// Styles principaux PREMIUM (Desktop-First)
const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F9FAFB',
    },
    loadingText: { 
        marginTop: 10, 
        fontSize: PremiumTheme.typography.fontSize.base, 
        color: PremiumTheme.colors.gray,
    },
    scrollContent: {
        paddingHorizontal: isWeb ? 40 : 20,
        paddingTop: isWeb ? 40 : 8,
        paddingBottom: isWeb ? 40 : 20,
        alignItems: 'center',
    },
    container: {
        width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
        padding: 0,
        marginTop: -8,
    },
    // Header CUSTOM complet
    customHeader: {
        backgroundColor: '#fff',
        paddingTop: PremiumTheme.spacing.md,
        paddingBottom: PremiumTheme.spacing.md,
        paddingHorizontal: PremiumTheme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        gap: PremiumTheme.spacing.sm,
        marginBottom: PremiumTheme.spacing.lg,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 36,
    },
    headerBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerBottomRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        flexShrink: 1,
        overflow: 'hidden',
    },
    headerTopRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerSeparator: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        color: PremiumTheme.colors.gray,
        opacity: 0.5,
    },
    headerIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIcon: {
        fontSize: 18,
    },
    inlineStreak: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFA500',
        paddingHorizontal: PremiumTheme.spacing.sm,
        paddingVertical: 4,
        borderRadius: PremiumTheme.borderRadius.medium,
        gap: 4,
    },
    streakEmoji: {
        fontSize: 14,
    },
    streakText: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    mascotTemporary: {
        marginTop: PremiumTheme.spacing.xs,
        marginBottom: PremiumTheme.spacing.sm,
    },
    // Banner Inviter un Mentor (Mode Solo)
    inviteMentorBanner: {
        marginTop: PremiumTheme.spacing.sm,
        marginBottom: PremiumTheme.spacing.lg,
    },
    // OPTION HYBRIDE : Mini boutons circulaires dans le header
    miniCircularButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniCircularButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    miniCircularIcon: {
        fontSize: 18,
    },
    miniCircularBadge: {
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 3,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    miniCircularBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
    },
    inviteBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EBF5FF',
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
        borderRadius: PremiumTheme.borderRadius.medium,
        padding: PremiumTheme.spacing.md,
        ...(isWeb 
            ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }
        ),
    },
    inviteBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: PremiumTheme.spacing.sm,
        flex: 1,
    },
    inviteBannerEmoji: {
        fontSize: 28,
    },
    inviteBannerTitle: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: '#1E40AF',
        marginBottom: 2,
    },
    inviteBannerSubtitle: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        color: '#3B82F6',
    },
    inviteButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: PremiumTheme.spacing.md,
        paddingVertical: PremiumTheme.spacing.sm,
        borderRadius: PremiumTheme.borderRadius.medium,
    },
    inviteButtonText: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    greetingText: {
        fontSize: PremiumTheme.typography.fontSize.base,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.gray,
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: PremiumTheme.colors.lightGray,
        paddingHorizontal: PremiumTheme.spacing.sm,
        paddingVertical: 4,
        borderRadius: PremiumTheme.borderRadius.medium,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
    },
    xpValue: {
        fontSize: PremiumTheme.typography.fontSize.base,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.orange,
        marginRight: 4,
    },
    xpLabel: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.gray,
        fontWeight: PremiumTheme.typography.fontWeight.medium,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: PremiumTheme.spacing.lg,
    },
    sectionTitle: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.xxl : PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
    },
    sectionSubtitle: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.gray,
        marginTop: 2,
    },
    modulesCountSmall: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.gray,
    },
    
    // Styles pour les blocs thématiques
    blockSection: {
        marginBottom: 0, // Aucun espace - séparateur collé au dernier module
    },
    
    // Séparateur de bloc (fond coloré + bordure top)
    blockSeparator: {
        marginTop: 0,
        marginBottom: PremiumTheme.spacing.md,
        marginHorizontal: isWeb ? -PremiumTheme.spacing.lg : -PremiumTheme.spacing.md,
        paddingHorizontal: isWeb ? PremiumTheme.spacing.lg : PremiumTheme.spacing.md,
        paddingVertical: 6, // Ultra-fin
        borderRadius: 0, // Supprimé pour coller parfaitement
        borderTopWidth: 2,
        backgroundColor: '#D1D5DB', // Gris bien marqué
        borderTopColor: '#9CA3AF', // Gris plus foncé pour contraste
    },
    separatorContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    separatorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: PremiumTheme.spacing.sm,
        flex: 1,
    },
    separatorIcon: {
        fontSize: isWeb ? 26 : 24,
    },
    separatorTitle: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.lg : PremiumTheme.typography.fontSize.md,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
    },
    freeText: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        fontWeight: PremiumTheme.typography.fontWeight.medium,
        color: '#10B981',
        marginLeft: PremiumTheme.spacing.xs,
    },
    separatorRight: {
        marginLeft: PremiumTheme.spacing.sm,
    },
    separatorCount: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.gray,
    },
    separatorCompleted: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: '#10B981',
    },
    
    // Anciens styles (nettoyage)
    blockHeader: {
        backgroundColor: '#FFFFFF',
        borderRadius: PremiumTheme.borderRadius.large,
        padding: isWeb ? PremiumTheme.spacing.lg : PremiumTheme.spacing.md,
        ...(isWeb 
            ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
            }
        ),
    },
    blockTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    blockTitleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    blockTitleContent: {
        flex: 1,
    },
    blockIcon: {
        fontSize: isWeb ? 40 : 36,
        marginRight: PremiumTheme.spacing.md,
    },
    blockTitleWithBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: PremiumTheme.spacing.sm,
        marginBottom: 4,
    },
    blockTitle: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.xxl : PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
    },
    freeBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: PremiumTheme.spacing.sm,
        paddingVertical: 4,
        borderRadius: PremiumTheme.borderRadius.small,
    },
    freeBadgeText: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
        letterSpacing: 0.5,
    },
    blockModuleCount: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.gray,
    },
    blockRightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: PremiumTheme.spacing.sm,
    },
    blockCompletedBadge: {
        fontSize: 32,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: '#10B981',
    },
    progressBadge: {
        backgroundColor: PremiumTheme.colors.lightGray,
        paddingHorizontal: PremiumTheme.spacing.md,
        paddingVertical: PremiumTheme.spacing.xs,
        borderRadius: PremiumTheme.borderRadius.medium,
    },
    progressBadgeText: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.primary,
    },
    expandIcon: {
        fontSize: PremiumTheme.typography.fontSize.lg,
        color: PremiumTheme.colors.gray,
        marginLeft: PremiumTheme.spacing.xs,
    },
    blockDescription: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.sm : PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.gray,
        lineHeight: isWeb ? 22 : 20,
        marginTop: PremiumTheme.spacing.xs,
    },
    blockDescriptionExpanded: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.sm : PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.gray,
        lineHeight: isWeb ? 20 : 18,
        marginBottom: PremiumTheme.spacing.md,
        paddingHorizontal: PremiumTheme.spacing.md,
        fontStyle: 'italic',
    },
    expandedContent: {
        marginTop: PremiumTheme.spacing.md,
        paddingTop: PremiumTheme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    
    moduleGrid: {
        flexDirection: isWeb ? 'row' : 'column',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: PremiumTheme.spacing.xl,
        gap: isWeb ? PremiumTheme.spacing.xl : PremiumTheme.spacing.sm,
    },
    moduleCard: {
        width: isWeb ? (MAX_WIDTH - 80) / 3.2 : '100%',
        backgroundColor: PremiumTheme.colors.white,
        borderRadius: PremiumTheme.borderRadius.xlarge,
        marginBottom: PremiumTheme.spacing.xs, // Réduit pour compacité
        // ENLEVÉ overflow: 'hidden' pour permettre les ombres !
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.12)', // Bordure visible
        // Ombres ENCORE PLUS VISIBLES
        ...(isWeb 
            ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8,
            }
        ),
    },
    moduleCardHovered: {
        transform: [{ scale: 1.02 }],
        ...(isWeb 
            ? { boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 12,
            }
        ),
    },
    lockedCard: {
        opacity: 0.6,
    },
    gradientHeader: {
        padding: PremiumTheme.spacing.md,
        paddingVertical: PremiumTheme.spacing.lg,
        borderTopLeftRadius: PremiumTheme.borderRadius.xlarge,
        borderTopRightRadius: PremiumTheme.borderRadius.xlarge,
        overflow: 'hidden', // Clip les coins du gradient
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    moduleId: {
        fontSize: PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.extrabold,
        color: PremiumTheme.colors.white,
    },
    statusEmoji: {
        fontSize: PremiumTheme.typography.fontSize.xl,
    },
    cardContent: {
        padding: PremiumTheme.spacing.md,
    },
    cardTitle: {
        fontSize: PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
        marginBottom: PremiumTheme.spacing.xs,
    },
    cardDescription: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        color: PremiumTheme.colors.gray,
        marginBottom: PremiumTheme.spacing.sm,
        lineHeight: 18,
    },
    moduleFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: PremiumTheme.colors.lightGray,
        paddingTop: PremiumTheme.spacing.sm,
        marginTop: PremiumTheme.spacing.sm,
    },
    footerText: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.gray,
    },
    ctaText: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.primary,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
    },
    speedDrillContainer: {
        marginBottom: PremiumTheme.spacing.lg,
    },
    speedDrillButton: {
        borderRadius: PremiumTheme.borderRadius.large,
        overflow: 'hidden',
        marginBottom: PremiumTheme.spacing.md,
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
    speedDrillGradient: {
        paddingVertical: PremiumTheme.spacing.lg,
        paddingHorizontal: PremiumTheme.spacing.xl,
        alignItems: 'center',
    },
    speedDrillButtonText: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.xl : PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    speedDrillStats: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.sm : PremiumTheme.typography.fontSize.xs,
        fontWeight: PremiumTheme.typography.fontWeight.medium,
        color: PremiumTheme.colors.white,
        marginTop: PremiumTheme.spacing.xs,
        opacity: 0.95,
    },
    toggleDetailsButton: {
        backgroundColor: '#FEF3C7',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    toggleDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B',
    },
    speedDrillDetailsContainer: {
        backgroundColor: '#FFFBEB',
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    detailsHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 10,
    },
    detailRow: {
        marginBottom: 8,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#FCD34D',
    },
    detailLabel: {
        fontSize: 13,
        color: '#78350F',
        fontWeight: '600',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 12,
        color: '#92400E',
    }
});

export default ExplorerDashboardScreen;
