// /components/MentorEvaluationModal.tsx

import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Button, Dimensions, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ExplorerProgressItem, validateDefi, requestRevision } from '../services/dataService';
import { DiscussionModal } from './DiscussionModal';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 650;

interface EvaluationModalProps {
  isVisible: boolean;
  onClose: (refresh?: boolean) => void;
  progressItem: ExplorerProgressItem;
  defiTitle: string;
}

export const MentorEvaluationModal: React.FC<EvaluationModalProps> = ({ isVisible, onClose, progressItem, defiTitle }) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState(progressItem.mentorComment || '');
  const [loading, setLoading] = useState(false);
  
  // NOUVEL ÉTAT pour le Guide de Discussion
  const [isDiscussionModalVisible, setIsDiscussionModalVisible] = useState(false);
  
  const isPendingReview = progressItem.evaluationStatus === 'SOUMIS';
  const isRevisionRequested = progressItem.evaluationStatus === 'REVISION_DEMANDEE';
  const isValidated = progressItem.evaluationStatus === 'VALIDE';
  
  const isActionable = isPendingReview || isRevisionRequested;

  // Vérifier si un guide de discussion existe pour ce défi
  const discussionKey = `${progressItem.moduleId.toLowerCase()}_${progressItem.defiId}`;
  const discussionQuestions = t(`mentor.discussion.${discussionKey}`, { returnObjects: true });
  const hasDiscussionGuide = Array.isArray(discussionQuestions) && discussionQuestions.length > 0;

  const handleAction = async (action: 'validate' | 'request_revision') => {
    setLoading(true);
    try {
      if (action === 'validate') {
        await validateDefi(progressItem.id, comment, progressItem.xpEarned || 100);
        Alert.alert(
          t('mentor.validation_success') || "Validé", 
          t('mentor.validation_message') || "Le défi a été validé et l'XP a été accordé !"
        );
      } else {
        if (!comment) {
          Alert.alert(
            t('global.error'), 
            t('mentor.error_comment_required') || "Le commentaire est obligatoire pour demander une révision."
          );
          setLoading(false);
          return;
        }
        await requestRevision(progressItem.id, comment);
        Alert.alert(
          t('mentor.revision_requested') || "Révision Demandée", 
          t('mentor.revision_message') || "L'explorateur devra réviser sa réponse."
        );
      }
      onClose(true);
    } catch (error) {
      console.error("Action Mentor Error:", error);
      Alert.alert(
        t('global.error') || "Erreur", 
        t('mentor.error_action') || "Action impossible. Vérifiez les droits RLS."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={() => onClose()}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.title}>{defiTitle}</Text>
          <Text style={styles.subtitle}>
            Tentative #{progressItem.attemptCount || 1} - Statut: {progressItem.evaluationStatus || 'SOUMIS'}
          </Text>

          <ScrollView style={styles.scrollView}>
            <Text style={styles.sectionTitle}>
              {t('mentor.explorer_response') || "Réponse de l'Explorateur"}
            </Text>
            <View style={styles.responseBox}>
              <Text style={styles.responseText}>
                {progressItem.responseText || t('mentor.no_response_recorded') || "Aucune réponse enregistrée"}
              </Text>
            </View>

            {/* BOUTON GUIDE DE DISCUSSION */}
            <View style={{ marginBottom: 20 }}>
              <Button
                title={t('mentor.button_discussion') || "📖 Guide de Discussion"}
                onPress={() => {
                  if (hasDiscussionGuide) {
                    setIsDiscussionModalVisible(true);
                  } else {
                    Alert.alert(
                      t('mentor.info_titre') || "Information",
                      t('mentor.no_guide_available') || "Aucun guide de discussion n'est disponible pour ce défi. Évaluez librement selon vos critères pédagogiques."
                    );
                  }
                }}
                color="#10B981"
              />
            </View>

            {isActionable && !isValidated && (
              <View>
                {progressItem.mentorComment && isRevisionRequested && (
                  <View style={{ marginBottom: 15 }}>
                    <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                      {t('mentor.last_comment') || "Dernier commentaire"}:
                    </Text>
                    <Text style={styles.commentText}>{progressItem.mentorComment}</Text>
                  </View>
                )}

                <Text style={styles.sectionTitle}>
                  {t('mentor.add_feedback') || "Votre Feedback"}:
                </Text>
                <TextInput
                  style={styles.commentInput}
                  onChangeText={setComment}
                  value={comment}
                  placeholder={t('mentor.comment_placeholder') || "Votre retour pédagogique..."}
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                />
                
                <View style={styles.buttonRow}>
                  <Button
                    title={t('mentor.validate_button') || "✓ VALIDER"}
                    onPress={() => handleAction('validate')}
                    color="#10B981"
                    disabled={loading}
                  />
                  <Button
                    title={t('mentor.revision_button') || "↻ RÉVISION"}
                    onPress={() => handleAction('request_revision')}
                    color="#F59E0B"
                    disabled={loading || !comment}
                  />
                </View>
              </View>
            )}
            
            {isValidated && (
              <Text style={styles.finalizedMessage}>
                {t('mentor.finalized_message') || "Défi validé. L'Explorateur a reçu son XP."}
              </Text>
            )}
          </ScrollView>

          {loading && <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 20 }} />}

          <Button title={t('global.cancel') || "Fermer"} onPress={() => onClose()} color="#6B7280" />
        </View>
      </View>

      {/* MODAL GUIDE DE DISCUSSION */}
      {hasDiscussionGuide && (
        <DiscussionModal
          isVisible={isDiscussionModalVisible}
          onClose={() => setIsDiscussionModalVisible(false)}
          defiId={`${progressItem.moduleId.toUpperCase()}/${progressItem.defiId.toUpperCase().replace('DEFI', 'D')}`}
          questions={discussionQuestions as string[]}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.8)' 
  },
  modalView: {
    margin: isWeb ? 40 : 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: isWeb ? 30 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : width * 0.9,
    maxHeight: '90%',
  },
  title: { 
    fontSize: isWeb ? 26 : 22, 
    fontWeight: '700', 
    marginBottom: 5, 
    color: '#1F2937' 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginBottom: 15 
  },
  scrollView: { width: '100%' },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#3B82F6', 
    marginTop: 15, 
    marginBottom: 5 
  },
  responseBox: {
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    marginBottom: 20,
    minHeight: 100,
  },
  responseText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  commentInput: {
    minHeight: 100,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: 'white',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  commentText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#4B5563',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  finalizedMessage: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
  }
});

