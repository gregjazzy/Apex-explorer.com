// /screens/DefiListScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from 'react-i18next';
import { Defi } from '../services/dataService';
import PremiumTheme from '../config/premiumTheme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 900;

// Typage mis à jour pour les props de navigation
type DefiListRouteParams = {
    moduleId: string;
    moduleTitle: string;
    defis: Defi[]; // Le tableau des défis est passé ici
};
type DefiListScreenProps = NativeStackScreenProps<any, 'DefiList'> & {
    route: { params: DefiListRouteParams };
};

const DefiListScreen: React.FC<DefiListScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { moduleId, moduleTitle, defis } = route.params;

    // Met à jour le titre de la navigation (laissé pour la compatibilité mobile)
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: moduleTitle,
            headerShown: !isWeb, // Montre l'en-tête natif sur mobile
        });
    }, [navigation, moduleTitle]);

    const handleDefiPress = (defiId: string, defiTitle: string) => {
        // Navigue vers l'écran du défi (Prompt 5)
        navigation.navigate('Defi', { moduleId: moduleId, defiId: defiId, defiTitle: defiTitle });
    };

    const renderDefiItem = ({ item, index }: { item: Defi; index: number }) => {
        const isCompleted = item.status === 'completed';
        const isLocked = item.status === 'locked';
        
        const statusText = t(`defi.${item.status}`); 
        
        // Gradients selon le statut
        const badgeGradient = isCompleted 
            ? ['#10B981', '#059669'] as const
            : isLocked
            ? ['#9CA3AF', '#6B7280'] as const
            : ['#4F46E5', '#7C3AED'] as const;
        
        const statusColor = isCompleted ? '#10B981' : isLocked ? '#6B7280' : '#4F46E5';
        
        return (
            <Animatable.View
                animation="fadeInUp"
                delay={index * 50}
                duration={400}
            >
                <TouchableOpacity 
                    style={[styles.defiItem, isLocked && styles.lockedItem]}
                    onPress={() => handleDefiPress(item.id, item.title)}
                    disabled={isLocked}
                    activeOpacity={0.8}
                >
                    {/* Badge avec gradient */}
                    <LinearGradient
                        colors={badgeGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.defiBadge}
                    >
                        <Text style={styles.defiID}>{item.id.toUpperCase().replace('DEFI', 'D')}</Text>
                    </LinearGradient>
                    
                    <View style={styles.defiContent}>
                        <Text style={styles.defiTitle}>{item.title}</Text>
                        <View style={styles.metaRow}>
                            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {isCompleted ? '✅ ' : isLocked ? '🔒 ' : '🚀 '}{statusText}
                                </Text>
                            </View>
                            {!isLocked && (
                                <Text style={styles.xpText}>{item.xpValue} XP</Text>
                            )}
                        </View>
                    </View>
                    
                    {!isLocked && (
                        <Text style={styles.arrowIcon}>→</Text>
                    )}
                </TouchableOpacity>
            </Animatable.View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header premium */}
                {isWeb && (
                    <Animatable.View animation="fadeInDown" duration={600}>
                        <Text style={styles.webHeader}>{moduleTitle}</Text>
                    </Animatable.View>
                )}
                
                <View style={styles.statsRow}>
                    <Text style={styles.webSubtitle}>
                        {defis.filter(d => d.status === 'completed').length} / {defis.length} complétés
                    </Text>
                    <View style={styles.xpTotal}>
                        <Text style={styles.xpTotalValue}>
                            {defis.filter(d => d.status === 'completed').length * 100} XP
                        </Text>
                        <Text style={styles.xpTotalLabel}>gagnés</Text>
                    </View>
                </View>

                <FlatList
                    data={defis}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDefiItem}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </SafeAreaView>
    );
};

// Styles premium
const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#F9FAFB',
    },
    container: {
        flex: 1,
        width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
        alignSelf: 'center',
        backgroundColor: 'transparent',
        padding: isWeb ? 40 : 20,
    },
    webHeader: {
        fontSize: PremiumTheme.typography.fontSize.display,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        marginBottom: PremiumTheme.spacing.sm,
        color: PremiumTheme.colors.darkGray,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: PremiumTheme.spacing.xl,
    },
    webSubtitle: {
        fontSize: PremiumTheme.typography.fontSize.base,
        color: PremiumTheme.colors.gray,
    },
    xpTotal: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: PremiumTheme.colors.lightGray,
        paddingHorizontal: PremiumTheme.spacing.md,
        paddingVertical: PremiumTheme.spacing.xs,
        borderRadius: PremiumTheme.borderRadius.large,
    },
    xpTotalValue: {
        fontSize: PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.orange,
        marginRight: 4,
    },
    xpTotalLabel: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.gray,
    },
    listContent: {
        paddingBottom: PremiumTheme.spacing.xxxl,
    },
    defiItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: PremiumTheme.spacing.lg,
        backgroundColor: PremiumTheme.colors.white,
        borderRadius: PremiumTheme.borderRadius.xlarge,
        marginBottom: PremiumTheme.spacing.md,
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
    lockedItem: {
        opacity: 0.5,
    },
    defiBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: PremiumTheme.spacing.md,
    },
    defiID: {
        fontSize: PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    defiContent: {
        flex: 1,
    },
    defiTitle: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.lg : PremiumTheme.typography.fontSize.base,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.darkGray,
        marginBottom: PremiumTheme.spacing.xs,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: PremiumTheme.spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: PremiumTheme.spacing.sm,
        paddingVertical: 4,
        borderRadius: PremiumTheme.borderRadius.small,
    },
    statusText: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
    },
    xpText: {
        fontSize: PremiumTheme.typography.fontSize.xs,
        color: PremiumTheme.colors.orange,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
    },
    arrowIcon: {
        fontSize: PremiumTheme.typography.fontSize.xxl,
        color: PremiumTheme.colors.gray,
        marginLeft: PremiumTheme.spacing.sm,
    },
});

export default DefiListScreen;
