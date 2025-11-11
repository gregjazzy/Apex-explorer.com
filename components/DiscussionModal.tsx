// /components/DiscussionModal.tsx

import React from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Button, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 800; 

interface DiscussionProps {
  isVisible: boolean;
  onClose: () => void;
  questions: string[]; // Tableau de questions tiré de i18n
  defiId: string; // Ex: M1/D1 (pour l'affichage)
}

export const DiscussionModal: React.FC<DiscussionProps> = ({ isVisible, onClose, questions, defiId }) => {
  const { t } = useTranslation();
  
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.title}>{t('mentor.discussion_titre')} ({defiId})</Text>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.introText}>
                {t('mentor.discussion_intro')}
            </Text>
            {questions.map((q, index) => (
              <View key={index} style={styles.questionContainer}>
                <Text style={styles.questionNumber}># {index + 1}</Text>
                <Text style={styles.questionText}>{q}</Text>
              </View>
            ))}
          </ScrollView>
          <Button title={t('global.close_guide')} onPress={onClose} color="#10B981" />
        </View>
      </View>
    </Modal>
  );
};

// Styles pour le Modal de Discussion (Desktop-First)
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalView: {
    margin: isWeb ? 40 : 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: isWeb ? 40 : 25,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    // Desktop-First: Largeur limitée
    width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : width * 0.9, 
    maxHeight: '90%',
  },
  title: { fontSize: isWeb ? 28 : 24, fontWeight: '700', marginBottom: 15, color: '#10B981', textAlign: 'center' },
  introText: { fontSize: isWeb ? 16 : 14, color: '#4B5563', marginBottom: 20, textAlign: 'center' },
  scrollView: { width: '100%', marginBottom: 20 },
  questionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#E6FFEE', // Léger vert (thème Mentor)
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#10B981', 
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 5,
  },
  questionText: {
    fontSize: isWeb ? 18 : 16,
    lineHeight: isWeb ? 28 : 24,
    color: '#1F2937',
  },
});

