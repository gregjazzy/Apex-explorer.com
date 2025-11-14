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
import { getSpeedDrillStats, SpeedDrillStats } from '../services/dataService';

const SpeedDrillStatsScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<SpeedDrillStats | null>(null);

    useEffect(() => {
        loadStats();
    }, [user]);

    const loadStats = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await getSpeedDrillStats(user.id);
            setStats(data);
        } catch (error) {
            console.error('Erreur chargement stats Speed Drill:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOperationEmoji = (type: string) => {
        switch (type) {
            case 'Multiplication': return '✖️';
            case 'Division': return '➗';
            case 'Addition': return '➕';
            case 'Soustraction': return '➖';
            default: return '🔢';
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.container}>
                <ActivityIndicator size="large" color="#fff" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>⚡ Mes Records Speed Drill</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Stats Summary Card */}
            {stats && (
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>📊 Résumé</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{stats.totalSessions || 0}</Text>
                            <Text style={styles.summaryLabel}>Sessions</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>⚡ {stats.bestTime || '--'}s</Text>
                            <Text style={styles.summaryLabel}>Meilleur Temps</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>
                                {stats.averageScore ? `${stats.averageScore.toFixed(1)}/10` : '--'}
                            </Text>
                            <Text style={styles.summaryLabel}>Score Moyen</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Records by Operation */}
            <ScrollView style={styles.recordsScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>🏆 Records par Opération</Text>
                
                {stats?.sessions && stats.sessions.length > 0 ? (
                    <View style={styles.recordsContainer}>
                        {['Multiplication', 'Division', 'Addition', 'Soustraction'].map(opType => {
                            const opSessions = stats.sessions.filter(s => s.operation_type === opType);
                            const bestSession = opSessions.reduce((best, current) => {
                                if (current.score === 10) {
                                    if (!best || current.time_seconds < best.time_seconds) {
                                        return current;
                                    }
                                }
                                return best;
                            }, null as any);

                            return (
                                <View key={opType} style={styles.recordCard}>
                                    <View style={styles.recordHeader}>
                                        <Text style={styles.recordEmoji}>{getOperationEmoji(opType)}</Text>
                                        <Text style={styles.recordOperation}>{opType}</Text>
                                    </View>
                                    <View style={styles.recordStats}>
                                        {bestSession ? (
                                            <>
                                                <View style={styles.recordStat}>
                                                    <Text style={styles.recordStatLabel}>⚡ Meilleur temps</Text>
                                                    <Text style={styles.recordStatValue}>{bestSession.time_seconds}s</Text>
                                                </View>
                                                <View style={styles.recordStat}>
                                                    <Text style={styles.recordStatLabel}>🎯 Score parfait</Text>
                                                    <Text style={styles.recordStatValue}>10/10</Text>
                                                </View>
                                                <View style={styles.recordStat}>
                                                    <Text style={styles.recordStatLabel}>📅 Date</Text>
                                                    <Text style={styles.recordStatValue}>
                                                        {new Date(bestSession.created_at).toLocaleDateString('fr-FR')}
                                                    </Text>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={styles.noRecord}>
                                                <Text style={styles.noRecordText}>Aucun score parfait</Text>
                                                <Text style={styles.noRecordHint}>
                                                    {opSessions.length > 0 
                                                        ? `Meilleur score : ${Math.max(...opSessions.map(s => s.score))}/10`
                                                        : 'Pas encore de session'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>⚡</Text>
                        <Text style={styles.emptyText}>Aucune session Speed Drill</Text>
                        <Text style={styles.emptyHint}>Lance une session pour voir tes stats !</Text>
                    </View>
                )}

                {/* CTA Button */}
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => navigation.navigate('SpeedDrill' as never)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.ctaButtonText}>🚀 Lancer une Session</Text>
                </TouchableOpacity>
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 40,
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    summaryTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    recordsScroll: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    recordsContainer: {
        marginBottom: 20,
    },
    recordCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
    },
    recordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    recordEmoji: {
        fontSize: 24,
        marginRight: 10,
    },
    recordOperation: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    recordStats: {
        gap: 10,
    },
    recordStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    recordStatLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    recordStatValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    noRecord: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    noRecordText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontStyle: 'italic',
    },
    noRecordHint: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 5,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: 15,
    },
    emptyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    emptyHint: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    ctaButton: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 18,
        marginVertical: 20,
        alignItems: 'center',
    },
    ctaButtonText: {
        color: '#F59E0B',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default SpeedDrillStatsScreen;

