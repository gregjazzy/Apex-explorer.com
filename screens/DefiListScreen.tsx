// /screens/DefiListScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Defi } from '../services/dataService'; // Import de l'interface Defi

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

    const renderDefiItem = ({ item }: { item: Defi }) => {
        const isCompleted = item.status === 'completed';
        const isLocked = item.status === 'locked';
        
        const statusText = t(`defi.${item.status}`); 
        const statusColor = isCompleted ? '#10B981' : isLocked ? '#F59E0B' : '#3B82F6';
        
        return (
            <TouchableOpacity 
                style={[styles.defiItem, isCompleted && styles.completedItem, isLocked && styles.lockedItem]}
                onPress={() => handleDefiPress(item.id, item.title)}
                disabled={isLocked}
            >
                <View style={styles.titleGroup}>
                    {/* Affiche D1, D2, etc. en format court */}
                    <Text style={styles.defiID}>{item.id.toUpperCase().replace('DEFI', 'D')}</Text> 
                    <Text style={styles.defiTitle}>{item.title}</Text>
                </View>
                <View style={styles.statusGroup}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    {!isLocked && (
                         <Text style={styles.xpText}>{item.xpValue} XP</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header adapté pour le Web */}
                {isWeb && <Text style={styles.webHeader}>{moduleTitle}</Text>} 
                
                <Text style={styles.webSubtitle}>
                    {t('defi.list_count', { count: defis.length })}
                </Text>

                <FlatList
                    data={defis} // UTILISE LES DONNÉES PASSÉES
                    keyExtractor={(item) => item.id}
                    renderItem={renderDefiItem}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </SafeAreaView>
    );
};

// Styles (Réutilisation du style Desktop-First)
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#E5E7EB' },
    container: {
        flex: 1,
        width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
        alignSelf: 'center',
        backgroundColor: 'white',
        borderRadius: isWeb ? 10 : 0,
        padding: isWeb ? 40 : 20,
    },
    webHeader: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1F2937',
    },
    webSubtitle: {
        fontSize: 18,
        color: '#6B7280',
        marginBottom: 20,
    },
    listContent: {
        paddingVertical: 10,
    },
    defiItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isWeb ? 20 : 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
    },
    completedItem: {
        backgroundColor: '#E6FFEE', // Léger vert
        borderColor: '#10B981',
    },
    lockedItem: {
        opacity: 0.6,
        backgroundColor: '#FEF3C7', // Léger jaune
        borderColor: '#F59E0B',
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    defiID: {
        fontSize: isWeb ? 20 : 16,
        fontWeight: '900',
        color: '#3B82F6',
        marginRight: 15,
    },
    defiTitle: {
        fontSize: isWeb ? 18 : 16,
        fontWeight: '600',
        color: '#1F2937',
        flexShrink: 1,
    },
    statusGroup: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    statusText: {
        fontSize: isWeb ? 14 : 12,
        fontWeight: 'bold',
    },
    xpText: {
        fontSize: isWeb ? 12 : 10,
        color: '#F59E0B',
        fontWeight: 'bold',
        marginTop: 3,
    }
});

export default DefiListScreen;
