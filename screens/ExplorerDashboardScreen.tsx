// /screens/ExplorerDashboardScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { fetchModulesWithProgress, Module, calculateBadges, Badge, ExplorerProgressItem, fetchSpeedDrillStats, SpeedDrillStats, calculateAdvancedBadges, EarnedBadge, getUserStreak, UserStreak, updateUserStreak, getExplorerProfile, markBadgeAsDisplayed } from '../services/dataService'; 
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

// Composant de l'item de module PREMIUM avec gradient
const ModuleItem: React.FC<{ module: Module; navigation: any; t: any; index: number }> = ({ module, navigation, t, index }) => {
    const [hovered, setHovered] = useState(false);
    
    // Détermination simple du statut (pour l'affichage)
    const isCompleted = module.defis.every(d => d.status === 'completed') && module.isUnlocked;
    const defisCompletedCount = module.defis.filter(d => d.status === 'completed').length;
    const totalDefisCount = module.defis.length;

    const handlePress = () => {
        if (module.isUnlocked) {
            navigation.navigate('DefiList', {
                moduleId: module.id,
                moduleTitle: module.title,
                defis: module.defis,
            });
        } else {
            Alert.alert(t('dashboard.status_locked') || "Verrouillé", `Ce module n'est pas encore débloqué.`);
        }
    };

    // Gradients selon le statut (plus subtils et sophistiqués)
    const gradientColors = isCompleted 
        ? ['#10B981', '#059669'] as const // Vert succès
        : module.isUnlocked 
        ? ['#4F46E5', '#7C3AED'] as const // Indigo/Violet élégant
        : ['#F3F4F6', '#E5E7EB'] as const; // Gris neutre

    return (
        <Animatable.View 
            animation="fadeInUp" 
            delay={index * 100}
            duration={600}
        >
            <TouchableOpacity 
                style={[
                    styles.moduleCard, 
                    !module.isUnlocked && styles.lockedCard,
                    isWeb && hovered && module.isUnlocked && styles.moduleCardHovered,
                ]} 
                onPress={handlePress} 
                disabled={!module.isUnlocked}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={PremiumTheme.gradients.primary.start}
                    end={PremiumTheme.gradients.primary.end}
                    style={styles.gradientHeader}
                >
                    <View style={styles.cardHeader}>
                        <Text style={styles.moduleId}>{module.id.toUpperCase()}</Text>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: isCompleted ? '#D1FAE5' : module.isUnlocked ? '#EBF5FF' : '#F3F4F6' }
                        ]}>
                            <Text style={[
                                styles.cardStatus, 
                                { color: isCompleted ? '#065F46' : module.isUnlocked ? '#1E40AF' : '#6B7280' }
                            ]}>
                                {isCompleted ? '✅ ' + t('defi.completed') : module.isUnlocked ? '🚀 ' + t('defi.unlocked') : '🔒 ' + t('defi.locked')}
                            </Text>
                        </View>
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
                            <Text style={styles.ctaText}>Continuer →</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animatable.View>
    );
};

const ExplorerDashboardScreen: React.FC<NativeStackScreenProps<any, 'Explorer'>> = ({ navigation }) => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [modules, setModules] = useState<Module[]>([]);
    const [badges, setBadges] = useState<EarnedBadge[]>([]); // NOUVEAU: EarnedBadge au lieu de Badge
    const [speedDrillStats, setSpeedDrillStats] = useState<SpeedDrillStats | null>(null);
    const [streak, setStreak] = useState<UserStreak | null>(null); // NOUVEAU: Streak
    const [isSoloExplorer, setIsSoloExplorer] = useState(false); // NOUVEAU: Mode solo
    const [showSpeedDrillDetails, setShowSpeedDrillDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showMascot, setShowMascot] = useState(false); // NOUVEAU: Affichage temporaire mascotte
    
    // Hook pour la détection automatique des badges
    const { unlockedBadge, triggerBadgeUnlock, closeBadgeModal } = useBadgeUnlock();

    // NOUVEAU: Fonction pour fermer la modal ET marquer le badge comme affiché
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
            
            // NOUVEAU : Charger les stats Speed Drill
            let speedSessions = undefined;
            if (user?.id) {
                const stats = await fetchSpeedDrillStats(user.id);
                setSpeedDrillStats(stats);
                // Passer undefined car calculateAdvancedBadges gèrera sans sessions
            }
            
            // NOUVEAU : Calculer les badges sophistiqués avec détection auto
            const { badges: allBadges, newlyUnlocked } = await calculateAdvancedBadges(
                userId,
                allProgress,
                speedSessions
            );
            setBadges(allBadges);
            
            // Si nouveaux badges, les afficher
            if (newlyUnlocked.length > 0) {
                triggerBadgeUnlock(newlyUnlocked);
            }
            
            // NOUVEAU : Mettre à jour et récupérer le streak
            const updatedStreak = await updateUserStreak(userId);
            setStreak(updatedStreak);
            
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

    // NOUVEAU: Recharger les badges quand on revient d'un défi
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // Recharger uniquement si on était sur un autre écran
            if (user && !loading) {
                loadModules();
            }
        });

        return unsubscribe;
    }, [navigation, user, loading, loadModules]); 
    
    // NOUVEAU: Afficher la mascotte temporairement au chargement
    useEffect(() => {
        if (!loading && modules.length > 0) {
            setShowMascot(true);
            // Masquer après 6 secondes
            const timer = setTimeout(() => {
                setShowMascot(false);
            }, 6000);
            return () => clearTimeout(timer);
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
                    {/* Header avec mascotte et streak intégrés - ULTRA COMPACT */}
                    <View style={styles.headerCompact}>
                        <View style={styles.greetingRow}>
                            <View style={styles.leftSection}>
                                <Text style={styles.greetingText}>👋 Bonjour, {userName}</Text>
                                {streak && streak.currentStreak > 0 && (
                                    <View style={styles.inlineStreak}>
                                        <Text style={styles.streakEmoji}>🔥</Text>
                                        <Text style={styles.streakText}>{streak.currentStreak} jour{streak.currentStreak > 1 ? 's' : ''}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.xpBadge}>
                                <Text style={styles.xpValue}>{totalXP}</Text>
                                <Text style={styles.xpLabel}>XP</Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Mascotte temporaire qui apparaît/disparaît */}
                    {showMascot && (
                        <Animatable.View 
                            animation="fadeInDown" 
                            duration={600}
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
                                        <Text style={styles.inviteBannerTitle}>Mode Autonome actif</Text>
                                        <Text style={styles.inviteBannerSubtitle}>Invite un mentor pour des feedbacks personnalisés</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.inviteButton}
                                    onPress={() => Alert.alert(
                                        "Inviter un Mentor",
                                        "Partage ton nom d'utilisateur avec un parent ou mentor pour qu'il te rejoigne :\n\n👤 " + userName + "\n\nIl pourra créer un compte mentor et te lier à son profil.",
                                        [{ text: "OK" }]
                                    )}
                                >
                                    <Text style={styles.inviteButtonText}>En savoir +</Text>
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
                                        🏆 Meilleur: {speedDrillStats.bestScore}/10 en {speedDrillStats.bestTime}s
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* BOUTON POUR DÉPLIER/REPLIER LES DÉTAILS */}
                        {speedDrillStats && speedDrillStats.totalSessions > 0 && speedDrillStats.byCategory && speedDrillStats.byCategory.length > 0 && (
                            <>
                                <TouchableOpacity 
                                    style={styles.toggleDetailsButton} 
                                    onPress={() => setShowSpeedDrillDetails(!showSpeedDrillDetails)}
                                >
                                    <Text style={styles.toggleDetailsText}>
                                        {showSpeedDrillDetails ? '▲ Masquer mes records' : '▼ Voir tous mes records'}
                                    </Text>
                                </TouchableOpacity>

                                {/* DÉTAILS PAR CATÉGORIE (ACCORDÉON) */}
                                {showSpeedDrillDetails && (
                                    <View style={styles.speedDrillDetailsContainer}>
                                        <Text style={styles.detailsHeader}>Mes records par type :</Text>
                                        {speedDrillStats.byCategory.map((cat, idx) => (
                                            <View key={idx} style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>
                                                    {getOperationEmoji(cat.operation)} {t(`speed_drills.${cat.operation.toLowerCase()}`)} ({t(`speed_drills.${cat.difficulty.toLowerCase()}`)})
                                                </Text>
                                                <Text style={styles.detailValue}>
                                                    {cat.bestScore}/10 en {cat.bestTime}s • {cat.sessions} session{cat.sessions > 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </Animatable.View>

                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>🎯 {t('global.continue')}</Text>
                            <Text style={styles.sectionSubtitle}>
                                {modules.filter(m => m.completionRate === 1).length} complétés • {modules.filter(m => m.isUnlocked && m.completionRate < 1).length} en cours
                            </Text>
                        </View>
                        <View style={styles.modulesCountBadge}>
                            <Text style={styles.modulesCountText}>{modules.length}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.moduleGrid}>
                        {modules.map((module, index) => (
                            <ModuleItem 
                                key={module.id} 
                                module={module} 
                                navigation={navigation} 
                                t={t}
                                index={index}
                            />
                        ))}
                    </View>

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
        padding: isWeb ? 40 : 20,
        alignItems: 'center',
    },
    container: {
        width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
        padding: 0,
    },
    // Header compact et discret
    headerCompact: {
        paddingVertical: PremiumTheme.spacing.sm,
        marginBottom: PremiumTheme.spacing.xs,
        paddingHorizontal: PremiumTheme.spacing.sm,
    },
    greetingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: PremiumTheme.spacing.sm,
    },
    inlineStreak: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFA500',
        paddingHorizontal: PremiumTheme.spacing.sm,
        paddingVertical: 2,
        borderRadius: PremiumTheme.borderRadius.full,
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
        fontSize: PremiumTheme.typography.fontSize.sm,
        fontWeight: PremiumTheme.typography.fontWeight.medium,
        color: PremiumTheme.colors.gray,
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: PremiumTheme.colors.lightGray,
        paddingHorizontal: PremiumTheme.spacing.md,
        paddingVertical: PremiumTheme.spacing.xs,
        borderRadius: PremiumTheme.borderRadius.large,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
    },
    xpValue: {
        fontSize: PremiumTheme.typography.fontSize.lg,
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
    modulesCountBadge: {
        backgroundColor: PremiumTheme.colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        // Ombres cross-platform
        ...(isWeb 
            ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
            }
        ),
    },
    modulesCountText: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        color: PremiumTheme.colors.white,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
    },
    moduleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: PremiumTheme.spacing.xxxl,
        gap: isWeb ? PremiumTheme.spacing.xl : PremiumTheme.spacing.md,
    },
    moduleCard: {
        width: isWeb ? (MAX_WIDTH - 80) / 3.2 : '100%',
        backgroundColor: PremiumTheme.colors.white,
        borderRadius: PremiumTheme.borderRadius.xlarge,
        marginBottom: PremiumTheme.spacing.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        // Ombres cross-platform
        ...(isWeb 
            ? { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
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
        padding: PremiumTheme.spacing.xl,
        paddingVertical: PremiumTheme.spacing.xxl,
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
    statusBadge: {
        paddingHorizontal: PremiumTheme.spacing.sm,
        paddingVertical: 4,
        borderRadius: PremiumTheme.borderRadius.medium,
    },
    cardStatus: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
    },
    cardContent: {
        padding: PremiumTheme.spacing.xl,
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
        marginBottom: PremiumTheme.spacing.md,
        minHeight: 40,
        lineHeight: 20,
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
