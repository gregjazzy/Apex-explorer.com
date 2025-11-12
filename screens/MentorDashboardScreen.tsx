// /screens/MentorDashboardScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Platform, Dimensions, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { DiscussionModal } from '../components/DiscussionModal';
import { ExplorerCreationModal } from '../components/ExplorerCreationModal';
import { MentorEvaluationModal } from '../components/MentorEvaluationModal';
import { fetchMentorExplorers, ExplorerProfile, fetchExplorerProgress, ExplorerProgressItem } from '../services/dataService';

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
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING'>('ALL');
  
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
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>{t('global.loading')}</Text>
      </View>
    );
  }

  const mentorName = user?.user_metadata?.name || 'Mentor Apex'; 

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>{t('mentor.title')}</Text>
          <Button title={t('global.logout')} onPress={logout} color="#EF4444" />
        </View>

        <View style={styles.explorerManagement}>
          <Text style={styles.subtitle}>
            {t('mentor.explorers_management') || "Gestion des Explorateurs"}
          </Text>
          <View style={styles.createButtonWrapper}>
            <Button 
              title={t('mentor.add_explorer_button') || "Ajouter un Explorateur"} 
              onPress={() => setIsCreationModalVisible(true)} 
              color="#3B82F6" 
            />
          </View>
        </View>

        {/* Onglets de filtrage */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, filterStatus === 'ALL' && styles.activeTab]}
            onPress={() => setFilterStatus('ALL')}
          >
            <Text style={[styles.tabText, filterStatus === 'ALL' && styles.activeTabText]}>
              {t('mentor.filter_all') || "Tous les Explorateurs"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filterStatus === 'PENDING' && styles.activeTab]}
            onPress={() => setFilterStatus('PENDING')}
          >
            <Text style={[styles.tabText, filterStatus === 'PENDING' && styles.activeTabText]}>
              {t('mentor.filter_pending') || "À Évaluer"}
              {totalPendingCount > 0 && (
                <Text style={styles.badge}> ({totalPendingCount})</Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredExplorers}
          keyExtractor={(item) => item.explorer_uuid}
          renderItem={renderExplorerItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('mentor.no_explorers_yet') || "Vous n'avez pas encore d'explorateurs liés."}</Text>}
        />
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

// Styles (Desktop-First)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E5E7EB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E5E7EB' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#6B7280' },
  container: {
    flex: 1,
    width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: isWeb ? 10 : 0,
    padding: isWeb ? 40 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: { fontSize: isWeb ? 34 : 26, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: isWeb ? 18 : 16, color: '#4B5563' },
  
  explorerManagement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 15,
  },
  createButtonWrapper: {
    minWidth: 150,
  },

  listContent: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#9CA3AF' },
  
  explorerCard: {
    padding: isWeb ? 25 : 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  explorerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  explorerName: {
    fontSize: isWeb ? 22 : 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  xpTotal: {
    fontSize: isWeb ? 16 : 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  explorerID: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
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

  // Nouveaux styles pour les onglets
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#fff',
  },
  badge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
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
});

export default MentorDashboardScreen;
