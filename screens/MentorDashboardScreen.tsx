// /screens/MentorDashboardScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Platform, Dimensions, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { DiscussionModal } from '../components/DiscussionModal';
import { ExplorerCreationModal } from '../components/ExplorerCreationModal';
import { MentorEvaluationModal } from '../components/MentorEvaluationModal';
import { fetchMentorExplorers, ExplorerProfile, fetchExplorerProgress, ExplorerProgressItem, fetchAllExplorerSpeedDrillStats, SpeedDrillStats } from '../services/dataService';
import PremiumTheme from '../config/premiumTheme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 900;

// Interface pour les Explorateurs enrichis
interface ExplorerProfileWithProgress extends ExplorerProfile {
    progress: ExplorerProgressItem[];
    loadingProgress: boolean;
}

const MentorDashboardScreen: React.FC<NativeStackScreenProps<any, 'Mentor'>> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [explorersWithProgress, setExplorersWithProgress] = useState<ExplorerProfileWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
  
  // États pour le filtrage
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'TRAINING'>('ALL');
  const [speedDrillStats, setSpeedDrillStats] = useState<Record<string, SpeedDrillStats>>({});
  
  // États pour le Modal de Discussion
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentDiscussionQuestions, setCurrentDiscussionQuestions] = useState<string[]>([]);
  const [currentDefiId, setCurrentDefiId] = useState('');

  // États pour le Modal d'Évaluation
  const [isEvaluationModalVisible, setIsEvaluationModalVisible] = useState(false);
  const [currentProgressItem, setCurrentProgressItem] = useState<ExplorerProgressItem | null>(null);
  const [currentDefiTitle, setCurrentDefiTitle] = useState('');
  const [currentDefiContent, setCurrentDefiContent] = useState<any>(null);

  // Fonction pour charger la progression pour TOUS les explorateurs
  const loadAllExplorerProgress = useCallback(async (initialExplorers: ExplorerProfile[]) => {
    const explorersWithLoading: ExplorerProfileWithProgress[] = initialExplorers.map(exp => ({
      ...exp,
      progress: [],
      loadingProgress: true,
    }));
    setExplorersWithProgress(explorersWithLoading);

    const newExplorersData: ExplorerProfileWithProgress[] = await Promise.all(
      initialExplorers.map(async (explorer) => {
        const progress = await fetchExplorerProgress(explorer.explorer_uuid);
        
        // Calcul du XP total
        const xpTotal = progress.reduce((sum, item) => sum + item.xpEarned, 0);

        return {
          ...explorer,
          progress: progress,
          xp_total: xpTotal,
          loadingProgress: false,
        };
      })
    );
    
    setExplorersWithProgress(newExplorersData);
  }, []);

  // Chargement des explorateurs liés
  const loadExplorers = useCallback(async () => {
    if (!user || user.role !== 'mentor') return;
    setLoading(true);
    try {
      const fetchedExplorers = await fetchMentorExplorers(user.id);
      if (fetchedExplorers.length > 0) {
        await loadAllExplorerProgress(fetchedExplorers);
        
        // NOUVEAU : Charger les stats Speed Drill
        const stats = await fetchAllExplorerSpeedDrillStats(user.id);
        setSpeedDrillStats(stats);
      } else {
        setExplorersWithProgress([]);
      }
    } catch (error) {
      console.error("Erreur de chargement des Explorateurs:", error);
      Alert.alert(t('dashboard.load_error') || "Erreur", "Problème de chargement des données.");
    } finally {
      setLoading(false);
    }
  }, [user, t, loadAllExplorerProgress]);

  useEffect(() => {
    if (user) {
      loadExplorers();
    }
  }, [user, loadExplorers]);

  // Recharger les données à chaque fois que l'écran devient focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadExplorers();
      }
    }, [user, loadExplorers])
  );

  // Forcer le re-render quand la langue change
  useEffect(() => {
  }, [i18n.language]);

  // Filtrer les explorateurs selon le statut sélectionné
  const filteredExplorers = useMemo(() => {
    if (filterStatus === 'ALL') {
      return explorersWithProgress;
    }
    
    // Mode "À Évaluer" : Filtrer les explorateurs qui ont au moins un défi en statut SOUMIS
    return explorersWithProgress
      .map(explorer => {
        const pendingProgress = explorer.progress.filter(p => p.evaluationStatus === 'SOUMIS');
        return {
          ...explorer,
          progress: pendingProgress,
        };
      })
      .filter(explorer => explorer.progress.length > 0);
  }, [explorersWithProgress, filterStatus]);

  // Calculer le nombre total de soumissions en attente
  const totalPendingCount = useMemo(() => {
    return explorersWithProgress.reduce((total, explorer) => {
      const pending = explorer.progress.filter(p => p.evaluationStatus === 'SOUMIS').length;
      return total + pending;
    }, 0);
  }, [explorersWithProgress]);
  
  // NOUVEAU : Calcul des KPIs globaux (AVANT le if loading pour respecter les règles des hooks)
  const totalXP = useMemo(() => {
    return explorersWithProgress.reduce((sum, exp) => sum + (exp.xp_total || 0), 0);
  }, [explorersWithProgress]);
  
  const totalExplorers = explorersWithProgress.length;
  
  const avgAccuracy = useMemo(() => {
    const allStats = Object.values(speedDrillStats);
    if (allStats.length === 0) return 0;
    const totalAcc = allStats.reduce((sum, stat) => sum + (stat.avgAccuracy || 0), 0);
    return Math.round(totalAcc / allStats.length);
  }, [speedDrillStats]);
  
  const completedChallenges = useMemo(() => {
    return explorersWithProgress.reduce((sum, exp) => {
      return sum + exp.progress.filter(p => p.evaluationStatus === 'VALIDE').length;
    }, 0);
  }, [explorersWithProgress]);

  // Ouvre le Modal de Discussion
  const handleOpenDiscussion = (item: ExplorerProgressItem) => {
    const key = `${item.moduleId.toLowerCase()}_${item.defiId}`;
    const questions = t(`mentor.discussion.${key}`, { returnObjects: true }) as string[];
    
    if (questions && questions.length > 0) {
      setCurrentDiscussionQuestions(questions);
      const formattedDefiId = `${item.moduleId.toUpperCase()}/${item.defiId.toUpperCase().replace('DEFI', 'D')}`;
      setCurrentDefiId(formattedDefiId);
      setIsModalVisible(true);
    } else {
      Alert.alert(t('mentor.info_titre'), t('mentor.info_no_guide'));
    }
  };

  // Ouvre le Modal d'Évaluation
  const handleOpenEvaluation = (item: ExplorerProgressItem) => {
    // Charger le contenu pédagogique du défi depuis i18n
    const defiKey = `${item.moduleId.toLowerCase()}.${item.defiId}`;
    const content = t(defiKey, { returnObjects: true }) as any;
    
    setCurrentDefiContent(content);
    setCurrentProgressItem(item);
    const defiTitle = `${item.moduleId.toUpperCase()}/${item.defiId.toUpperCase().replace('DEFI', 'D')}`;
    setCurrentDefiTitle(defiTitle);
    setIsEvaluationModalVisible(true);
  };

  // Ferme le Modal d'Évaluation et rafraîchit si nécessaire
  const handleCloseEvaluation = (shouldRefresh?: boolean) => {
    setIsEvaluationModalVisible(false);
    setCurrentProgressItem(null);
    if (shouldRefresh) {
      loadExplorers();
    }
  };
    
  // Rendu d'un profil Explorateur
  const renderExplorerItem = ({ item }: { item: ExplorerProfileWithProgress }) => {
    // Calculer le nombre de soumissions en attente pour cet explorateur
    const pendingCount = item.progress.filter(p => p.evaluationStatus === 'SOUMIS').length;
    const statusText = pendingCount > 0 
      ? `${pendingCount} soumission${pendingCount > 1 ? 's' : ''} en attente`
      : "Progression à jour";
    const statusColor = pendingCount > 0 ? '#F59E0B' : '#6B7280';

    return (
      <View style={styles.explorerCard}>
        <View style={styles.explorerHeader}>
          <Text style={styles.explorerName}>{item.name}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.xpTotal}>XP Total: {item.xp_total}</Text>
            <View style={[styles.statusBadge, { backgroundColor: pendingCount > 0 ? '#FEF3C7' : '#F3F4F6' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.explorerID}>{t('mentor.explorer_login_id') || "PIN"}: {item.pin_code}</Text>
        
        <Text style={styles.progressSectionTitle}>{t('mentor.recent_progress') || "Progrès récents"}</Text>
        
        {item.loadingProgress ? (
          <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 10 }} />
        ) : (
          <FlatList
            data={item.progress}
            keyExtractor={(p) => p.id.toString()}
            renderItem={({ item: progress }) => {
              const discussionKey = `${progress.moduleId.toLowerCase()}_${progress.defiId}`;
              const hasDiscussionGuide = t(`mentor.discussion.${discussionKey}`, { returnObjects: true }) instanceof Array;
              
              // Déterminer la couleur selon le statut
              const statusColor = progress.evaluationStatus === 'SOUMIS' 
                ? '#F59E0B' 
                : progress.evaluationStatus === 'VALIDE' 
                ? '#10B981' 
                : '#3B82F6';

              return (
                <View style={styles.progressItem}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={styles.progressTitle}>
                        {progress.moduleId.toUpperCase()}/{progress.defiId.toUpperCase().replace('DEFI', 'D')}
                      </Text>
                      {progress.evaluationStatus && (
                        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                          <Text style={styles.statusPillText}>
                            {progress.evaluationStatus === 'SOUMIS' ? 'SOUMIS' : 
                             progress.evaluationStatus === 'VALIDE' ? 'VALIDÉ' : 
                             progress.evaluationStatus === 'REVISION_DEMANDEE' ? 'RÉVISION' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.progressDate}>
                      {t('mentor.completed_on')} : {new Date(progress.completedAt).toLocaleDateString()}
                    </Text>
                    {progress.attemptCount && progress.attemptCount > 1 && (
                      <Text style={styles.attemptCount}>Tentative #{progress.attemptCount}</Text>
                    )}
                  </View>
                  
                  <View style={styles.buttonGroup}>
                    {progress.responseText && (
                      <Button
                        title="📝 Réponse"
                        onPress={() => handleOpenEvaluation(progress)}
                        color={progress.evaluationStatus === 'SOUMIS' ? "#F59E0B" : "#3B82F6"}
                      />
                    )}
                    {hasDiscussionGuide && (
                      <Button
                        title={t('mentor.button_discussion')}
                        onPress={() => handleOpenDiscussion(progress)}
                        color="#10B981"
                      />
                    )}
                    {!progress.responseText && !hasDiscussionGuide && (
                      <Text style={styles.noGuideText}>{t('mentor.no_guide_text')}</Text>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyProgressText}>{t('mentor.no_progress')}</Text>}
          />
        )}
      </View>
    );
  };

  if (loading) { 
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PremiumTheme.colors.primary} />
        <Text style={styles.loadingText}>{t('global.loading')}</Text>
      </View>
    );
  }

  const mentorName = user?.user_metadata?.name || 'Mentor Apex';
  
  // Composant Header pour le FlatList (KPIs + Tabs)
  const renderListHeader = () => (
    <>
      {/* NOUVEAU : Section KPIs Premium pour parents */}
      <Animatable.View animation="fadeInDown" duration={600} style={styles.kpiSection}>
        <Text style={styles.welcomeText}>👋 Bonjour, {mentorName}</Text>
        
        <View style={styles.kpiGrid}>
          {/* KPI 1 : Explorateurs */}
          <View style={styles.kpiCard}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.kpiGradient}
            >
              <Text style={styles.kpiValue}>{totalExplorers}</Text>
              <Text style={styles.kpiLabel}>Explorateurs</Text>
            </LinearGradient>
          </View>
          
          {/* KPI 2 : XP Total */}
          <View style={styles.kpiCard}>
            <LinearGradient
              colors={['#F59E0B', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.kpiGradient}
            >
              <Text style={styles.kpiValue}>{totalXP}</Text>
              <Text style={styles.kpiLabel}>XP Total</Text>
            </LinearGradient>
          </View>
          
          {/* KPI 3 : Défis validés */}
          <View style={styles.kpiCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.kpiGradient}
            >
              <Text style={styles.kpiValue}>{completedChallenges}</Text>
              <Text style={styles.kpiLabel}>Défis validés</Text>
            </LinearGradient>
          </View>
          
          {/* KPI 4 : Performance Speed Drills */}
          <View style={styles.kpiCard}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.kpiGradient}
            >
              <Text style={styles.kpiValue}>{avgAccuracy}%</Text>
              <Text style={styles.kpiLabel}>Moy. Speed Drills</Text>
            </LinearGradient>
          </View>
        </View>
        
        {/* Badge "À évaluer" si nécessaire */}
        {totalPendingCount > 0 && (
          <Animatable.View animation="pulse" iterationCount="infinite" duration={2000}>
            <TouchableOpacity 
              style={styles.pendingBadge}
              onPress={() => setFilterStatus('PENDING')}
            >
              <Text style={styles.pendingBadgeText}>
                ⚠️ {totalPendingCount} réponse{totalPendingCount > 1 ? 's' : ''} à évaluer
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </Animatable.View>

      {/* Section Gestion des Explorateurs */}
      <View style={styles.explorerManagement}>
        <View style={styles.managementHeader}>
          <Text style={styles.subtitle}>
            Explorateurs
          </Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setIsCreationModalVisible(true)}
          >
            <LinearGradient
              colors={PremiumTheme.gradients.primary.colors}
              start={PremiumTheme.gradients.primary.start}
              end={PremiumTheme.gradients.primary.end}
              style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonText}>+ Ajouter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Onglets de filtrage premium */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, filterStatus === 'ALL' && styles.activeTab]}
          onPress={() => setFilterStatus('ALL')}
        >
          <Text style={[styles.tabText, filterStatus === 'ALL' && styles.activeTabText]}>
            Tous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filterStatus === 'PENDING' && styles.activeTab]}
          onPress={() => setFilterStatus('PENDING')}
        >
          <Text style={[styles.tabText, filterStatus === 'PENDING' && styles.activeTabText]}>
            À Évaluer
            {totalPendingCount > 0 && (
              <Text style={styles.badge}> ({totalPendingCount})</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filterStatus === 'TRAINING' && styles.activeTab]}
          onPress={() => setFilterStatus('TRAINING')}
        >
          <Text style={[styles.tabText, filterStatus === 'TRAINING' && styles.activeTabText]}>
            📊 Stats
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {filterStatus === 'TRAINING' ? (
          <FlatList
            ListHeaderComponent={renderListHeader}
            data={explorersWithProgress}
            keyExtractor={(item) => item.explorer_uuid}
            renderItem={({ item }) => {
              const stats = speedDrillStats[item.explorer_uuid];
              return (
                <View style={styles.explorerCard}>
                  <Text style={styles.explorerName}>{item.name}</Text>
                  {stats && stats.totalSessions > 0 ? (
                    <>
                      <View style={styles.trainingStatsContainer}>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>🏆 Meilleur Global:</Text>
                          <Text style={styles.statValue}>
                            {stats.bestScore}/10 en {stats.bestTime}s
                          </Text>
                        </View>
                        <Text style={styles.categorySubtitle}>
                          ({t(`speed_drills.${stats.bestOperation.toLowerCase()}`)} / {t(`speed_drills.${stats.bestDifficulty.toLowerCase()}`)})
                        </Text>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>📊 Sessions Totales:</Text>
                          <Text style={styles.statValue}>{stats.totalSessions}</Text>
                        </View>
                      </View>
                      
                      {stats.byCategory && stats.byCategory.length > 0 && (
                        <View style={styles.categoryDetailsContainer}>
                          <Text style={styles.categoryHeader}>{t('speed_drills.stats_by_category')}</Text>
                          {stats.byCategory.map((cat, idx) => (
                            <View key={idx} style={styles.categoryRow}>
                              <Text style={styles.categoryLabel}>
                                {t(`speed_drills.${cat.operation.toLowerCase()}`)} ({t(`speed_drills.${cat.difficulty.toLowerCase()}`)})
                              </Text>
                              <Text style={styles.categoryValue}>
                                {cat.bestScore}/10 en {cat.bestTime}s • {cat.sessions} session{cat.sessions > 1 ? 's' : ''}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.noTrainingText}>{t('speed_drills.no_training_yet')}</Text>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('mentor.no_explorers_yet') || "Aucun explorateur lié."}</Text>
            }
          />
        ) : (
          <FlatList
            ListHeaderComponent={renderListHeader}
            data={filteredExplorers}
            keyExtractor={(item) => item.explorer_uuid}
            renderItem={renderExplorerItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('mentor.no_explorers_yet') || "Vous n'avez pas encore d'explorateurs liés."}</Text>}
          />
        )}
      </View>
      
      <ExplorerCreationModal
        isVisible={isCreationModalVisible}
        onClose={() => setIsCreationModalVisible(false)}
        onProfileCreated={loadExplorers}
      />
      
      <DiscussionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        questions={currentDiscussionQuestions}
        defiId={currentDefiId}
      />

      {currentProgressItem && (
        <MentorEvaluationModal
          isVisible={isEvaluationModalVisible}
          onClose={handleCloseEvaluation}
          progressItem={currentProgressItem}
          defiTitle={currentDefiTitle}
          defiContent={currentDefiContent}
        />
      )}
    </SafeAreaView>
  );
};

// Styles Premium Data-Driven
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: PremiumTheme.colors.lightGray,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: PremiumTheme.colors.lightGray,
  },
  loadingText: { 
    marginTop: PremiumTheme.spacing.sm, 
    fontSize: PremiumTheme.typography.fontSize.lg, 
    color: PremiumTheme.colors.gray,
  },
  container: {
    flex: 1,
    width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
    alignSelf: 'center',
    padding: isWeb ? 40 : 20,
  },
  // NOUVEAU : Section KPIs
  kpiSection: {
    marginBottom: PremiumTheme.spacing.xxxl,
  },
  welcomeText: {
    fontSize: PremiumTheme.typography.fontSize.xxl,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.darkGray,
    marginBottom: PremiumTheme.spacing.lg,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PremiumTheme.spacing.md,
    marginBottom: PremiumTheme.spacing.lg,
  },
  kpiCard: {
    flex: isWeb ? 0 : 1,
    minWidth: isWeb ? 200 : '48%',
    borderRadius: PremiumTheme.borderRadius.large,
    overflow: 'hidden',
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
  kpiGradient: {
    padding: PremiumTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  kpiValue: {
    fontSize: PremiumTheme.typography.fontSize.display,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.white,
    marginBottom: PremiumTheme.spacing.xs,
  },
  kpiLabel: {
    fontSize: PremiumTheme.typography.fontSize.sm,
    color: PremiumTheme.colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: PremiumTheme.colors.orange,
    borderRadius: PremiumTheme.borderRadius.large,
    padding: PremiumTheme.spacing.md,
    alignItems: 'center',
  },
  pendingBadgeText: {
    fontSize: PremiumTheme.typography.fontSize.lg,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.orange,
  },
  // Section Explorateurs
  explorerManagement: {
    marginBottom: PremiumTheme.spacing.xl,
  },
  managementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PremiumTheme.spacing.lg,
  },
  subtitle: { 
    fontSize: PremiumTheme.typography.fontSize.xl, 
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.darkGray,
  },
  addButton: {
    borderRadius: PremiumTheme.borderRadius.large,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: PremiumTheme.spacing.sm,
    paddingHorizontal: PremiumTheme.spacing.lg,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: PremiumTheme.typography.fontSize.base,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.white,
  },

  listContent: { paddingBottom: PremiumTheme.spacing.xxxl },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 50, 
    fontSize: PremiumTheme.typography.fontSize.lg, 
    color: PremiumTheme.colors.gray,
  },
  
  explorerCard: {
    padding: isWeb ? 25 : 20,
    backgroundColor: PremiumTheme.colors.white,
    borderRadius: PremiumTheme.borderRadius.xlarge,
    marginBottom: PremiumTheme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
  explorerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: PremiumTheme.spacing.sm,
  },
  explorerName: {
    fontSize: isWeb ? PremiumTheme.typography.fontSize.xxl : PremiumTheme.typography.fontSize.xl,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.darkGray,
  },
  xpTotal: {
    fontSize: isWeb ? PremiumTheme.typography.fontSize.lg : PremiumTheme.typography.fontSize.base,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.orange,
  },
  explorerID: {
    fontSize: PremiumTheme.typography.fontSize.xs,
    color: PremiumTheme.colors.gray,
    marginBottom: PremiumTheme.spacing.md,
    fontFamily: Platform.select({ web: 'monospace', default: 'System' }),
  },
  
  progressSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 10,
    marginBottom: 5,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  progressTitle: {
    fontSize: 14,
    color: '#1F2937',
  },
  progressDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyProgressText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 5,
  },
  noGuideText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    minWidth: 100,
  },

  // Onglets de filtrage premium
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: PremiumTheme.colors.lightGray,
    borderRadius: PremiumTheme.borderRadius.large,
    padding: 4,
    marginBottom: PremiumTheme.spacing.lg,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: PremiumTheme.spacing.md,
    paddingHorizontal: PremiumTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PremiumTheme.borderRadius.medium,
    minHeight: 44,
  },
  activeTab: {
    backgroundColor: PremiumTheme.colors.primary,
  },
  tabText: {
    fontSize: PremiumTheme.typography.fontSize.sm,
    fontWeight: PremiumTheme.typography.fontWeight.semibold,
    color: PremiumTheme.colors.gray,
    textAlign: 'center',
  },
  activeTabText: {
    color: PremiumTheme.colors.white,
  },
  badge: {
    fontSize: PremiumTheme.typography.fontSize.sm,
    fontWeight: PremiumTheme.typography.fontWeight.bold,
    color: PremiumTheme.colors.red,
  },

  // Nouveaux styles pour les badges et statuts
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  attemptCount: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  trainingStatsContainer: {
    marginTop: 15,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  trainingStats: {
    marginTop: 10,
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#1F2937',
  },
  noTrainingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 10,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: -5,
    marginBottom: 10,
  },
  categoryDetailsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  categoryHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'column',
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#D1D5DB',
  },
  categoryLabel: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryValue: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default MentorDashboardScreen;
