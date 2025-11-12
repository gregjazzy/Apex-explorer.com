// /screens/ExplorerDashboardScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { fetchModulesWithProgress, Module, calculateBadges, Badge, ExplorerProgressItem, fetchSpeedDrillStats, SpeedDrillStats } from '../services/dataService'; 
import ProgressBar from '../components/ProgressBar';
import BadgeList from '../components/BadgeList';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 900;

// Composant de l'item de module
const ModuleItem: React.FC<{ module: Module; navigation: any; t: any }> = ({ module, navigation, t }) => {
    
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

    return (
        <TouchableOpacity 
            style={[styles.moduleCard, !module.isUnlocked && styles.lockedCard, isCompleted && styles.completedCard]} 
            onPress={handlePress} 
            disabled={!module.isUnlocked}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.moduleId}>{module.id.toUpperCase()}</Text>
                <Text style={[styles.cardStatus, { color: isCompleted ? '#10B981' : module.isUnlocked ? '#3B82F6' : '#9CA3AF' }]}>
                    {isCompleted ? t('defi.completed') : module.isUnlocked ? t('defi.unlocked') : t('defi.locked')}
                </Text>
            </View>
            <Text style={styles.cardTitle}>{module.title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>{module.description}</Text>
            
            <ProgressBar progress={module.completionRate} />
            
            <View style={styles.moduleFooter}>
                 <Text style={styles.footerText}>
                    {t('defi.completed_count', { completed: defisCompletedCount, total: totalDefisCount })}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const ExplorerDashboardScreen: React.FC<NativeStackScreenProps<any, 'Explorer'>> = ({ navigation }) => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [modules, setModules] = useState<Module[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [speedDrillStats, setSpeedDrillStats] = useState<SpeedDrillStats | null>(null);
    const [showSpeedDrillDetails, setShowSpeedDrillDetails] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadModules = useCallback(async () => {
        setLoading(true);
        try {
            const userId = user?.id || 'sim_explorer'; 
            const fetchedModules = await fetchModulesWithProgress(userId);
            setModules(fetchedModules);
            
            // Calculer les badges à partir de la progression des modules
            const allProgress: ExplorerProgressItem[] = fetchedModules.flatMap(module => 
                module.defis
                    .filter(defi => defi.status === 'completed')
                    .map(defi => ({
                        id: Math.random(), // ID temporaire
                        moduleId: module.id,
                        defiId: defi.id,
                        status: 'completed' as 'completed' | 'submitted',
                        xpEarned: defi.xpValue,
                        completedAt: new Date().toISOString(),
                    } as ExplorerProgressItem))
            );
            
            const calculatedBadges = calculateBadges(allProgress);
            setBadges(calculatedBadges);
            
            // NOUVEAU : Charger les stats Speed Drill
            if (user?.id) {
                const stats = await fetchSpeedDrillStats(user.id);
                setSpeedDrillStats(stats);
            }
            
        } catch (error) {
            console.error("Erreur de chargement des modules:", error);
            Alert.alert(t('dashboard.load_error') || "Erreur", "Problème de chargement des données.");
        } finally {
            setLoading(false);
        }
    }, [user?.id, t]); 

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

    // Navigation vers Speed Drills
    const handleGoToSpeedDrills = () => {
        navigation.navigate('SpeedDrill');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <View style={styles.headerRow}>
                        <Text style={styles.header}>
                            {t('dashboard.title')} : {userName}
                        </Text>
                    </View>

                    <Text style={styles.xpText}>
                        {t('modules.xp_label')} Total : {totalXP} XP
                    </Text>

                    {/* SECTION SPEED DRILLS AVEC ACCORDÉON */}
                    <View style={styles.speedDrillContainer}>
                        <TouchableOpacity style={styles.speedDrillButton} onPress={handleGoToSpeedDrills}>
                            <Text style={styles.speedDrillButtonText}>{t('speed_drills.button')}</Text>
                            {speedDrillStats && speedDrillStats.totalSessions > 0 && (
                                <Text style={styles.speedDrillStats}>
                                    🏆 Meilleur: {speedDrillStats.bestScore}/10 en {speedDrillStats.bestTime}s
                                </Text>
                            )}
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
                    </View>

                    <Text style={styles.sectionTitle}>{t('global.continue')}</Text>
                    
                    <View style={styles.moduleGrid}>
                        {modules.map(module => (
                            <ModuleItem 
                                key={module.id} 
                                module={module} 
                                navigation={navigation} 
                                t={t}
                            />
                        ))}
                    </View>

                    {/* INTÉGRATION DES BADGES (EN BAS) */}
                    <BadgeList badges={badges} />
                </View>
            </ScrollView>
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

// Styles principaux (Desktop-First)
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F3F4F6' 
    },
    loadingText: { 
        marginTop: 10, 
        fontSize: 16, 
        color: '#6B7280' 
    },
    scrollContent: {
        padding: isWeb ? 40 : 20,
        alignItems: 'center',
    },
    container: {
        width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
        padding: isWeb ? 0 : 0, 
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 20,
    },
    header: {
        fontSize: isWeb ? 34 : 26,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    xpText: {
        fontSize: isWeb ? 20 : 18,
        color: '#F59E0B',
        fontWeight: '600',
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: isWeb ? 24 : 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 5,
    },
    moduleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: isWeb ? 'flex-start' : 'space-between',
        marginBottom: 30,
    },
    moduleCard: {
        width: isWeb ? (MAX_WIDTH - 80) / 3.2 : '48%', // 3 colonnes sur Web, 2 sur Mobile
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: isWeb ? 20 : 15,
        marginRight: isWeb ? 20 : 0,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderLeftWidth: 5,
        borderLeftColor: '#3B82F6',
    },
    completedCard: {
        borderLeftColor: '#10B981', 
    },
    lockedCard: {
        backgroundColor: '#F9FAFB',
        borderLeftColor: '#9CA3AF',
        opacity: 0.7,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    moduleId: {
        fontSize: 18,
        fontWeight: '800',
        color: '#3B82F6',
    },
    cardStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 5,
    },
    cardDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 15,
        height: 40,
    },
    moduleFooter: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
    },
    speedDrillContainer: {
        marginBottom: 20,
    },
    speedDrillButton: {
        backgroundColor: '#F59E0B',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    speedDrillButtonText: {
        fontSize: isWeb ? 18 : 16,
        fontWeight: '700',
        color: 'white',
    },
    speedDrillStats: {
        fontSize: isWeb ? 14 : 12,
        fontWeight: '500',
        color: 'white',
        marginTop: 5,
        opacity: 0.9,
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
