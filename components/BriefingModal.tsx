// /components/BriefingModal.tsx

import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Button, Dimensions, Platform, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 800; // Largeur maximale idéale pour la lecture d'un document guidé

// Définition de la structure de l'étape de la FTG (basée sur i18n)
interface BriefingEtape {
  titre: string;
  type_etape: 'validation_case' | 'champ_texte' | 'texte_guide';
  instruction: string;
  placeholder?: string;
}

interface BriefingContent {
    etape1: BriefingEtape;
    etape2?: BriefingEtape; // Optionnel
    etape3?: BriefingEtape; // Optionnel
}

interface BriefingProps {
  isVisible: boolean;
  onClose: () => void;
  defiTitle: string;
  briefingContent: BriefingContent; 
}

export const BriefingModal: React.FC<BriefingProps> = ({ isVisible, onClose, defiTitle, briefingContent }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({}); // État pour les checkboxes
  const [textInputs, setTextInputs] = useState<Record<number, string>>({}); // État pour les champs texte
  
  // Compter le nombre réel d'étapes disponibles
  const etapes = [briefingContent.etape1, briefingContent.etape2, briefingContent.etape3].filter(e => e !== undefined) as BriefingEtape[];
  const totalSteps = etapes.length;
  
  if (!briefingContent || totalSteps === 0) return null;

  const getEtapeContent = (step: number): BriefingEtape => {
    return etapes[step - 1];
  };

  const etape = getEtapeContent(currentStep);

  const renderStepContent = (stepData: BriefingEtape) => {
    switch(stepData.type_etape) {
      case 'validation_case':
        const isChecked = checkedSteps[currentStep] || false;
        return (
          <TouchableOpacity 
            style={styles.validationCase} 
            onPress={() => setCheckedSteps(prev => ({ ...prev, [currentStep]: !prev[currentStep] }))}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.validationText}>{stepData.instruction}</Text>
          </TouchableOpacity>
        );
      case 'champ_texte':
        return (
          <View>
            <TextInput
              style={styles.textInput}
              placeholder={stepData.placeholder || t('defi.write_here')}
              multiline
              numberOfLines={4}
              value={textInputs[currentStep] || ''}
              onChangeText={(text) => setTextInputs(prev => ({ ...prev, [currentStep]: text }))}
            />
            <Text style={styles.helperText}>💡 Brouillon : écris ici pour t'exercer</Text>
          </View>
        );
      case 'texte_guide':
      default:
        return (
          <Text style={styles.guideText}>
            {t('defi.advice')} : {stepData.instruction}
          </Text>
        );
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.title}>{t('defi.briefing_button')}</Text>
          <Text style={styles.subtitle}>{defiTitle}</Text>
          
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Étape {currentStep} sur {totalSteps}</Text>
          </View>

          <ScrollView style={styles.scrollView}>
            <Text style={styles.stepTitle}>{etape.titre}</Text>
            
            <View style={styles.contentArea}>
                <Text style={styles.instructionText}>{etape.instruction}</Text>
              {renderStepContent(etape)}
            </View>
          </ScrollView>
          
          <View style={styles.buttonRow}>
            <Button 
                title={t('global.back') || "Précédent"} 
                onPress={() => setCurrentStep(Math.max(1, currentStep - 1))} 
                disabled={currentStep === 1}
                color="#6B7280"
            />
            <Button 
                title={currentStep < totalSteps ? t('defi.next') || "Suivant" : t('global.close_guide')}
                onPress={() => currentStep < totalSteps ? setCurrentStep(currentStep + 1) : onClose()} 
                color="#3B82F6"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Styles pour le Modal Briefing (Desktop-First) ---
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
    width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : width * 0.9, 
    maxHeight: '90%',
  },
  title: { fontSize: isWeb ? 30 : 24, fontWeight: '700', marginBottom: 5, color: '#1F2937', textAlign: 'center' },
  subtitle: { fontSize: isWeb ? 18 : 16, color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  stepIndicator: { marginBottom: 15, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  stepText: { fontSize: 16, fontWeight: '500', color: '#3B82F6', textAlign: 'center' },
  scrollView: { width: '100%', marginBottom: 20 },
  stepTitle: { fontSize: isWeb ? 24 : 20, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#1F2937' },
  instructionText: { fontSize: isWeb ? 16 : 14, color: '#4B5563', marginBottom: 20, lineHeight: isWeb ? 24 : 20, textAlign: 'center' },
  contentArea: { padding: 15, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  guideText: { fontSize: isWeb ? 18 : 16, color: '#10B981', fontWeight: '500' },
  validationCase: { flexDirection: 'row', alignItems: 'center', padding: 10, justifyContent: 'center' },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#3B82F6', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#3B82F6' },
  checkmark: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  validationText: { fontSize: 16, color: '#1F2937', flex: 1 },
  textInput: {
    minHeight: 100,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'white',
    fontSize: isWeb ? 16 : 14,
    textAlignVertical: 'top'
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center'
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: isWeb ? 30 : 0 },
});

