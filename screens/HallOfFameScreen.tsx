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
    getXPLeaderboard,
    getStreakLeaderboard,
    getSpeedDrillRecords,
    getCurrentUserHallOfFameStats,
    LeaderboardEntry,
    StreakLeader,
    SpeedDrillRecord,
} from '../services/dataService';

type TabType = 'xp' | 'streaks';

interface HallOfFameScreenProps {
    route?: {
        params?: {
            initialTab?: TabType;
        };
    };
}

const HallOfFameScreen: React.FC<HallOfFameScreenProps> = ({ route }) => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<TabType>(route?.params?.initialTab || 'xp');
    const [xpLeaderboard, setXpLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [streakLeaderboard, setStreakLeaderboard] = useState<StreakLeader[]>([]);
    const [speedRecords, setSpeedRecords] = useState<SpeedDrillRecord[]>([]);
    const [userStats, setUserStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [xpData, streakData, speedData, userStatsData] = await Promise.all([
                getXPLeaderboard(user.id),
                getStreakLeaderboard(),
                getSpeedDrillRecords(),
                getCurrentUserHallOfFameStats(user.id),
            ]);
            setXpLeaderboard(xpData);
            setStreakLeaderboard(streakData);
            setSpeedRecords(speedData);
            setUserStats(userStatsData);
        } catch (error) {
            console.error('Erreur chargement Hall of Fame:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderXPLeaderboard = () => (
        <View style={styles.leaderboardContainer}>
            {xpLeaderboard.map((entry, index) => {
                const isCurrentUser = entry.user_id === user?.id;
                const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                
                return (
                    <View
                        key={entry.user_id}
                        style={[
                            styles.leaderboardRow,
                            isCurrentUser && styles.currentUserRow,
                        ]}
                    >
                        <Text style={styles.rank}>
                            {medalEmoji || `#${entry.rank}`}
                        </Text>
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
                                {entry.user_name} {isCurrentUser && '(Toi)'}
                            </Text>
                            <Text style={styles.userSubtext}>
                                {entry.completed_modules} {t('hall_of_fame.modules_completed')}
                            </Text>
                        </View>
                        <Text style={[styles.userXP, isCurrentUser && styles.currentUserText]}>
                            {entry.xp} XP
                        </Text>
                    </View>
                );
            })}
        </View>
    );

    const renderStreakLeaderboard = () => (
        <View style={styles.leaderboardContainer}>
            {streakLeaderboard.map((entry, index) => {
                const isCurrentUser = entry.user_id === user?.id;
                const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                
                return (
                    <View
                        key={entry.user_id}
                        style={[
                            styles.leaderboardRow,
                            isCurrentUser && styles.currentUserRow,
                        ]}
                    >
                        <Text style={styles.rank}>
                            {medalEmoji || `#${index + 1}`}
                        </Text>
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
                                {entry.user_name} {isCurrentUser && '(Toi)'}
                            </Text>
                            <Text style={styles.userSubtext}>
                                🔥 {t('hall_of_fame.current')}: {entry.current_streak} {t('hall_of_fame.days')}
                            </Text>
                        </View>
                        <Text style={[styles.userXP, isCurrentUser && styles.currentUserText]}>
                            🔥 {entry.longest_streak}
                        </Text>
                    </View>
                );
            })}
        </View>
    );

    const renderSpeedRecords = () => (
        <View style={styles.leaderboardContainer}>
            {speedRecords.map((record, index) => {
                const isCurrentUser = record.user_id === user?.id;
                const operationEmoji = 
                    record.operation_type === 'Multiplication' ? '✖️' :
                    record.operation_type === 'Division' ? '➗' :
                    record.operation_type === 'Addition' ? '➕' : '➖';
                
                return (
                    <View
                        key={`${record.user_id}-${record.operation_type}`}
                        style={[
                            styles.leaderboardRow,
                            isCurrentUser && styles.currentUserRow,
                        ]}
                    >
                        <Text style={styles.rank}>{operationEmoji}</Text>
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
                                {record.user_name} {isCurrentUser && '(Toi)'}
                            </Text>
                            <Text style={styles.userSubtext}>
                                {t(`hall_of_fame.${record.operation_type.toLowerCase()}`)}
                            </Text>
                        </View>
                        <Text style={[styles.userXP, isCurrentUser && styles.currentUserText]}>
                            ⚡ {record.best_time}s
                        </Text>
                    </View>
                );
            })}
        </View>
    );

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
                <Text style={styles.headerTitle}>👑 {t('hall_of_fame.title')}</Text>
                <View style={styles.placeholder} />
            </View>

            {/* User Stats Card */}
            {userStats && (
                <View style={styles.userStatsCard}>
                    <Text style={styles.userStatsTitle}>{t('hall_of_fame.your_stats')}</Text>
                    <View style={styles.userStatsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>#{userStats.xpRank}</Text>
                            <Text style={styles.statLabel}>{t('hall_of_fame.xp_rank')}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{userStats.xp}</Text>
                            <Text style={styles.statLabel}>XP</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>🔥 {userStats.longestStreak}</Text>
                            <Text style={styles.statLabel}>{t('hall_of_fame.best_streak')}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'xp' && styles.tabActive]}
                    onPress={() => setSelectedTab('xp')}
                >
                    <Text style={[styles.tabText, selectedTab === 'xp' && styles.tabTextActive]}>
                        🏆 {t('hall_of_fame.xp_tab')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'streaks' && styles.tabActive]}
                    onPress={() => setSelectedTab('streaks')}
                >
                    <Text style={[styles.tabText, selectedTab === 'streaks' && styles.tabTextActive]}>
                        🔥 {t('hall_of_fame.streaks_tab')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {selectedTab === 'xp' && renderXPLeaderboard()}
                {selectedTab === 'streaks' && renderStreakLeaderboard()}
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
    userStatsCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    userStatsTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    userStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        minWidth: '40%',
        marginBottom: 10,
    },
    statValue: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    statLabel: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.8,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
        padding: 5,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    tabText: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.7,
    },
    tabTextActive: {
        opacity: 1,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    leaderboardContainer: {
        paddingBottom: 30,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
    },
    currentUserRow: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    rank: {
        fontSize: 24,
        marginRight: 15,
        minWidth: 40,
        textAlign: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    currentUserText: {
        color: '#FFD700',
    },
    userSubtext: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.7,
    },
    userXP: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HallOfFameScreen;

