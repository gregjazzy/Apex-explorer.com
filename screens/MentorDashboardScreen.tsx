// /screens/MentorDashboardScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Platform, Dimensions, FlatList, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { DiscussionModal } from '../components/DiscussionModal';
import { ExplorerCreationModal } from '../components/ExplorerCreationModal';
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
  
  // États pour le Modal de Discussion
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentDiscussionQuestions, setCurrentDiscussionQuestions] = useState<string[]>([]);
  const [currentDefiId, setCurrentDefiId] = useState('');

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

  // Forcer le re-render quand la langue change
  useEffect(() => {
  }, [i18n.language]);

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
    
  // Rendu d'un profil Explorateur
  const renderExplorerItem = ({ item }: { item: ExplorerProfileWithProgress }) => {
    return (
      <View style={styles.explorerCard}>
        <View style={styles.explorerHeader}>
          <Text style={styles.explorerName}>{item.name}</Text>
          <Text style={styles.xpTotal}>XP Total: {item.xp_total}</Text>
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

              return (
                <View style={styles.progressItem}>
                  <View>
                    <Text style={styles.progressTitle}>
                      {progress.moduleId.toUpperCase()}/{progress.defiId.toUpperCase().replace('DEFI', 'D')}
                    </Text>
                    <Text style={styles.progressDate}>
                      {t('mentor.completed_on')} : {new Date(progress.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  {hasDiscussionGuide ? (
                    <Button
                      title={t('mentor.button_discussion')}
                      onPress={() => handleOpenDiscussion(progress)}
                      color="#10B981"
                    />
                  ) : (
                    <Text style={styles.noGuideText}>{t('mentor.no_guide_text')}</Text>
                  )}
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

        <FlatList
          data={explorersWithProgress}
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
  }
});

export default MentorDashboardScreen;
