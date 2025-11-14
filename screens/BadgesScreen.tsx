import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { 
    calculateAdvancedBadges, 
    EarnedBadge, 
    fetchModulesWithProgress,
    ExplorerProgressItem,
    fetchSpeedDrillStats 
} from '../services/dataService';
import Badge3D from '../components/Badge3D';

type BadgeCategory = 'all' | 'modules';

const BadgesScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [badges, setBadges] = useState<EarnedBadge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');

    useEffect(() => {
        loadBadges();
    }, [user]);

    const loadBadges = async () => {
        if (!user) return;
        try {
            setLoading(true);
            
            // Récupérer les modules avec progression
            const fetchedModules = await fetchModulesWithProgress(user.id);
            
            // Calculer la progression (même logique que ExplorerDashboardScreen)
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
            
            // Récupérer les stats speed drill
            const speedDrillData = await fetchSpeedDrillStats(user.id);
            const speedSessions = speedDrillData?.sessions || [];
            
            // Calculer les badges
            const result = await calculateAdvancedBadges(
                user.id,
                allProgress,
                speedSessions
            );
            
            setBadges(result.badges);
        } catch (error) {
            console.error('Erreur chargement badges:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryBadges = (category: BadgeCategory): EarnedBadge[] => {
        // Filtrer UNIQUEMENT les badges gagnés
        const earnedBadges = badges.filter(b => b.earned);
        
        if (category === 'all') return earnedBadges;

        return earnedBadges.filter(badge => {
            if (category === 'modules') {
                return badge.id.startsWith('module_') || badge.id.startsWith('m12_') || 
                       badge.id === 'first_module' || badge.id === 'five_modules' || 
                       badge.id === 'all_modules' || badge.id === 'perfectionist';
            }
            if (category === 'speed') {
                return badge.id.includes('speed_drill');
            }
            if (category === 'precision') {
                return badge.id.includes('accuracy');
            }
            if (category === 'special') {
                return badge.id === 'early_bird' || badge.id === 'night_owl' || 
                       badge.id === 'streak_7' || badge.id === 'streak_30' || 
                       badge.id === 'ai_master';
            }
            return false;
        });
    };

    const filteredBadges = getCategoryBadges(selectedCategory);
    const earnedCount = filteredBadges.length; // Tous les badges affichés sont gagnés
    const totalBadgesInCatalog = badges.length; // Total de tous les badges possibles
    const progressPercentage = totalBadgesInCatalog > 0 ? (badges.filter(b => b.earned).length / totalBadgesInCatalog) * 100 : 0;

    const categories: { key: BadgeCategory; label: string; icon: string }[] = [
        { key: 'all', label: t('badges_screen.all'), icon: '🏆' },
        { key: 'modules', label: t('badges_screen.modules'), icon: '📚' },
    ];

    if (loading) {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <ActivityIndicator size="large" color="#fff" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🏆 {t('badges_screen.title')}</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Stats Card */}
            <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>{t('badges_screen.progress')}</Text>
                <Text style={styles.statsCount}>
                    {badges.filter(b => b.earned).length} / {totalBadgesInCatalog}
                </Text>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.statsPercentage}>{Math.round(progressPercentage)}%</Text>
            </View>

            {/* Category Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat.key}
                        style={[
                            styles.categoryTab,
                            selectedCategory === cat.key && styles.categoryTabActive,
                        ]}
                        onPress={() => setSelectedCategory(cat.key)}
                    >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text
                            style={[
                                styles.categoryLabel,
                                selectedCategory === cat.key && styles.categoryLabelActive,
                            ]}
                        >
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Badges Grid */}
            <ScrollView style={styles.badgesScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.badgesGrid}>
                    {filteredBadges.map((badge, index) => (
                        <View key={badge.id} style={styles.badgeCard}>
                            <Badge3D
                                tier={badge.tier}
                                icon={badge.icon}
                                earned={badge.earned}
                                size={60}
                            />
                            <Text style={styles.badgeTitle} numberOfLines={2}>
                                {badge.title}
                            </Text>
                            <Text style={styles.badgeDescription} numberOfLines={3}>
                                {badge.description}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 40,
    },
    statsCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    statsTitle: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.9,
        marginBottom: 5,
    },
    statsCount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 4,
    },
    statsPercentage: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
    },
    categoryScroll: {
        maxHeight: 60,
        marginBottom: 20,
    },
    categoryTab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginLeft: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryTabActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    categoryIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    categoryLabel: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.7,
    },
    categoryLabelActive: {
        opacity: 1,
        fontWeight: 'bold',
    },
    badgesScroll: {
        flex: 1,
        paddingHorizontal: 10,
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 30,
    },
    badgeCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    badgeTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    badgeDescription: {
        color: '#fff',
        fontSize: 11,
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: 10,
    },
    earnedBadge: {
        backgroundColor: 'rgba(76, 217, 100, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    earnedText: {
        color: '#4CD964',
        fontSize: 12,
        fontWeight: 'bold',
    },
    progressBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    progressText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default BadgesScreen;

