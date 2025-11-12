// /screens/PaywallScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type PaywallScreenProps = NativeStackScreenProps<any, 'Paywall'>;

const PaywallScreen: React.FC<PaywallScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { reason } = route.params || { reason: 'module_locked' };

    const handleSubscribe = () => {
        // TODO: Intégrer react-native-iap pour Google Play
        // Pour l'instant, simuler l'abonnement
        alert('Fonction de paiement à implémenter (Google Play Billing)');
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <Text style={styles.emoji}>🔒</Text>
                    
                    <Text style={styles.title}>
                        {t('paywall.title') || 'Débloquez tout le programme'}
                    </Text>
                    
                    <Text style={styles.subtitle}>
                        {reason === 'module_locked' 
                            ? t('paywall.module_locked') || 'Ce module est réservé aux abonnés Premium'
                            : t('paywall.speed_drill_locked') || 'Les Speed Drills sont réservés aux abonnés Premium'
                        }
                    </Text>

                    <View style={styles.featuresBox}>
                        <Text style={styles.featuresTitle}>
                            {t('paywall.features_title') || 'Avec Premium, accédez à :'}
                        </Text>
                        <Text style={styles.feature}>✅ 11 modules complets (42 défis)</Text>
                        <Text style={styles.feature}>✅ Speed Drills illimités</Text>
                        <Text style={styles.feature}>✅ Jusqu'à 5 explorateurs</Text>
                        <Text style={styles.feature}>✅ Badges et récompenses</Text>
                        <Text style={styles.feature}>✅ Suivi mentor détaillé</Text>
                    </View>

                    <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
                        <Text style={styles.subscribeButtonText}>
                            {t('paywall.subscribe_button') || '🚀 Passer Premium - 4,99€/mois'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Text style={styles.backButtonText}>
                            {t('paywall.back_button') || 'Retour aux modules gratuits'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        {t('paywall.disclaimer') || 'Annulez à tout moment. Premiers 7 jours gratuits.'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        alignItems: 'center',
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    featuresBox: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3B82F6',
        marginBottom: 15,
    },
    feature: {
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 10,
        lineHeight: 24,
    },
    subscribeButton: {
        backgroundColor: '#10B981',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
        marginBottom: 15,
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    subscribeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    disclaimer: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default PaywallScreen;

