// /screens/DefiScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Platform, Dimensions, ScrollView, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { BriefingModal } from '../components/BriefingModal'; 
import { saveDefiProgress, fetchExplorerProgressForDefi, ExplorerProgressItem } from '../services/dataService';
import { useAuth } from '../hooks/useAuth'; 

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 900;

// Typage pour les props de navigation
type DefiRouteParams = {
    moduleId: string;
    defiId: string;
    defiTitle: string;
};
type DefiScreenProps = NativeStackScreenProps<any, 'Defi'> & {
    route: { params: DefiRouteParams };
};

// Interface de type pour la structure du défi dans i18n
interface DefiContent {
    titre: string;
    scenario?: string; 
    instruction: string;
    leconStrategique: string;
    briefing: any; 
    
    // CHAMPS SPÉCIFIQUES POUR LE RENDU
    question?: string; 
    options?: string[]; 
    bonneReponseIndex?: number; 
}

// --- NOUVEAU COMPOSANT : Rendu du Contenu du Défi (QCM / Champ de Texte) ---
interface DefiContentRendererProps {
    content: DefiContent;
    responseText: string;
    setResponseText: (text: string) => void;
    selectedOption: number | null;
    setSelectedOption: (index: number | null) => void;
}

const DefiContentRenderer: React.FC<DefiContentRendererProps> = ({ 
    content, 
    responseText, 
    setResponseText,
    selectedOption,
    setSelectedOption
}) => {
    const { t } = useTranslation();
    
    // Détermination du type de défi (basée sur la présence de 'options')
    const isQuiz = !!content.options && content.options.length > 0;
    
    if (isQuiz) {
        return (
            <View style={rendererStyles.quizContainer}>
                <Text style={rendererStyles.questionText}>{content.question}</Text>
                {content.options?.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            rendererStyles.optionButton,
                            selectedOption === index && rendererStyles.selectedOption,
                        ]}
                        onPress={() => setSelectedOption(index)}
                    >
                        <Text style={rendererStyles.optionText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }
    
    // Champ de Texte (par défaut)
    return (
        <View style={rendererStyles.textInputContainer}>
            <TextInput
                style={rendererStyles.simpleInput}
                placeholder={t('defi.write_here') || "Écris ta réponse ici..."}
                multiline
                numberOfLines={6}
                value={responseText}
                onChangeText={setResponseText}
            />
        </View>
    );
};
// --- FIN NOUVEAU COMPOSANT ---

const DefiScreen: React.FC<DefiScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { moduleId, defiId, defiTitle } = route.params;
    const [isBriefingVisible, setIsBriefingVisible] = useState(false);
    
    // États pour le cycle de feedback
    const [responseText, setResponseText] = useState('');
    const [existingProgress, setExistingProgress] = useState<ExplorerProgressItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // États pour les Quiz (QCM)
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [quizValidated, setQuizValidated] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);

    // Chargement du contenu réel depuis i18n
    const defiKey = `${moduleId}.${defiId}`; 
    const contentToLoad = moduleId === 'm1' && defiId === 'defi1' ? 'm1.defi1' : defiKey; 
    const defiContent = t(contentToLoad, { returnObjects: true }) as DefiContent;

    // Charger la progression existante au montage ET à chaque focus
    const loadProgress = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            const progress = await fetchExplorerProgressForDefi(user.id, moduleId, defiId);
            setExistingProgress(progress);
            
            // Pré-remplir la réponse si elle existe
            if (progress?.responseText) {
                setResponseText(progress.responseText);
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la progression:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, moduleId, defiId]);

    // Charger au montage
    useEffect(() => {
        loadProgress();
    }, [loadProgress]);

    // Recharger à chaque fois que l'écran est focus
    useFocusEffect(
        useCallback(() => {
            loadProgress();
        }, [loadProgress])
    );

    // Déterminer le type de défi (texte ou QCM)
    const isTextDefi = !defiContent.options || defiContent.options.length === 0;

    // Déterminer les couleurs et messages selon le statut
    const getStatusInfo = () => {
        if (!existingProgress) return { color: '#3B82F6', message: null };
        
        // DEBUG
        console.log('🔍 Status Info:', {
            evaluationStatus: existingProgress.evaluationStatus,
            mentorComment: existingProgress.mentorComment,
            hasComment: !!existingProgress.mentorComment
        });
        
        switch (existingProgress.evaluationStatus) {
            case 'SOUMIS':
                return {
                    color: '#F59E0B',
                    message: t('defi.status_pending') || "⏳ Ton défi est en cours d'évaluation par ton mentor.",
                };
            case 'REVISION_DEMANDEE':
                return {
                    color: '#EF4444',
                    message: existingProgress.mentorComment 
                        ? `✏️ Ton mentor demande une révision : "${existingProgress.mentorComment}"`
                        : t('defi.status_revision') || "✏️ Ton mentor demande une révision",
                };
            case 'VALIDE':
                return {
                    color: '#10B981',
                    message: existingProgress.mentorComment 
                        ? `✅ Défi validé ! Commentaire : "${existingProgress.mentorComment}"`
                        : t('defi.status_validated') || "✅ Défi validé !",
                };
            case 'COMPLETION_IMMEDIATE':
                return {
                    color: '#10B981',
                    message: t('defi.status_completed') || "✅ Défi complété !",
                };
            default:
                return { color: '#3B82F6', message: null };
        }
    };

    const statusInfo = getStatusInfo();
    const canSubmit = existingProgress?.evaluationStatus !== 'SOUMIS' && existingProgress?.evaluationStatus !== 'VALIDE';
    
    // Fonction de validation pour les Quiz
    const handleValidateQuiz = () => {
        if (selectedOption === null) {
            Alert.alert(
                t('global.error'),
                "Veuillez sélectionner une réponse avant de valider."
            );
            return;
        }
        
        const isCorrect = selectedOption === defiContent.bonneReponseIndex;
        setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
        setQuizValidated(isCorrect);
        
        if (!isCorrect) {
            // Afficher le feedback incorrect du quiz
            Alert.alert(
                t('defi.feedback_incorrect') || "Incorrect",
                defiContent.feedbackIncorrect || t('defi.incorrect_answer')
            );
        }
    };
    
    // DEBUG
    console.log('🔍 DEBUG DefiScreen:', {
        hasExistingProgress: !!existingProgress,
        evaluationStatus: existingProgress?.evaluationStatus,
        canSubmit,
        isTextDefi
    });

    // Fonction de soumission
    const handleSubmit = async () => {
        const userId = user?.id;
        
        if (!userId) {
            Alert.alert(t('global.error'), "Utilisateur non connecté ou ID manquant.");
            return;
        }

        // Validation pour les défis textuels
        if (isTextDefi && !responseText.trim()) {
            Alert.alert(
                t('global.error'),
                t('defi.error_empty_response') || "Merci d'écrire une réponse avant de soumettre."
            );
            return;
        }
        
        // Validation pour les Quiz : vérifier qu'une réponse correcte a été validée
        if (!isTextDefi && !quizValidated) {
            Alert.alert(
                t('global.error'),
                "Vous devez d'abord valider votre réponse et obtenir la bonne réponse avant de soumettre."
            );
            return;
        }

        setSubmitting(true);

        try {
            // Déterminer le statut d'évaluation
            // Les défis QCM sont validés immédiatement, les défis texte vont en révision
            const evaluationStatus = isTextDefi ? 'SOUMIS' : 'COMPLETION_IMMEDIATE';
            
            await saveDefiProgress(
                userId, 
                moduleId, 
                defiId,
                responseText,
                evaluationStatus,
                100
            );
            
            // Message de succès
            if (evaluationStatus === 'SOUMIS') {
                Alert.alert(
                    t('defi.submit_title') || "Défi soumis !",
                    t('defi.submit_message_pending') || "Ton mentor va évaluer ta réponse. Tu seras notifié quand il aura répondu.",
                    [{ text: "OK", onPress: () => navigation.pop(2) }]
                );
            } else {
                // Afficher le feedback correct pour les Quiz
                Alert.alert(
                    t('defi.submit_title') || "Défi complété !",
                    defiContent.feedbackCorrect || t('defi.submit_message') || "Bravo ! Tu as gagné 100 XP.",
                    [{ text: "OK", onPress: () => navigation.pop(2) }]
                );
            }

        } catch (error: any) {
            console.error("Erreur complète:", error);
            Alert.alert(
                t('global.error'),
                "Échec de l'enregistrement de la progression: " + (error.message || error)
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.subtitle}>{t('global.loading') || "Chargement..."}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!defiContent || !defiContent.titre) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.header}>{t('global.error')}</Text>
                    <Text style={styles.subtitle}>{t('dashboard.load_error')}</Text>
                    <Button title={t('global.back')} onPress={() => navigation.goBack()} color="#EF4444" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
            >
                <View style={styles.container}>
                    {/* En-tête */}
                    <Text style={styles.moduleTag}>{moduleId.toUpperCase()} / {defiId.toUpperCase().replace('DEFI', 'D')}</Text>
                    <Text style={styles.header}>{defiContent.titre || defiTitle}</Text>
                    
                    {/* Alerte de statut si elle existe */}
                    {statusInfo.message && (
                        <View style={[styles.statusAlert, { borderLeftColor: statusInfo.color }]}>
                            <Text style={styles.statusAlertText}>{statusInfo.message}</Text>
                            {existingProgress?.attemptCount && existingProgress.attemptCount > 1 && (
                                <Text style={styles.attemptText}>
                                    Tentative #{existingProgress.attemptCount}
                                </Text>
                            )}
                        </View>
                    )}
                    
                    {/* Affiche le Scénario si présent */}
                    {defiContent.scenario && (
                        <>
                            <Text style={styles.sectionTitle}>{t('defi.scenario_title') || "Scénario"} :</Text>
                            <Text style={styles.scenarioText}>{defiContent.scenario}</Text>
                        </>
                    )}
                    
                    <Text style={styles.sectionTitle}>{t('defi.instruction_title') || "Instruction"} :</Text>
                    <Text style={styles.instructionText}>{defiContent.instruction}</Text>
                    
                    {/* Zone de travail (Rendu Dynamique) */}
                    <View style={styles.workArea}>
                        <DefiContentRenderer 
                            content={defiContent} 
                            responseText={responseText}
                            setResponseText={setResponseText}
                            selectedOption={selectedOption}
                            setSelectedOption={setSelectedOption}
                        /> 
                    </View>
                    
                    {/* Feedback pour les Quiz */}
                    {!isTextDefi && quizFeedback && (
                        <View style={[
                            styles.feedbackBox,
                            { backgroundColor: quizFeedback === 'correct' ? '#D1FAE5' : '#FEE2E2' }
                        ]}>
                            <Text style={[
                                styles.feedbackText,
                                { color: quizFeedback === 'correct' ? '#065F46' : '#991B1B' }
                            ]}>
                                {quizFeedback === 'correct' 
                                    ? t('defi.correct_answer')
                                    : t('defi.incorrect_answer')
                                }
                            </Text>
                        </View>
                    )}

                    {/* Boutons d'Action */}
                    <View style={styles.buttonRow}>
                        {defiContent.briefing && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setIsBriefingVisible(true)}
                            >
                                <Text style={styles.actionButtonText}>{t('defi.briefing_button')}</Text>
                            </TouchableOpacity>
                        )}
                        
                        {/* Bouton Valider pour les Quiz */}
                        {!isTextDefi && !quizValidated && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.validateButton]}
                                onPress={handleValidateQuiz}
                                disabled={selectedOption === null}
                            >
                                <Text style={styles.actionButtonText}>
                                    {t('defi.validate_button') || "Valider ma Réponse"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                        {/* Bouton Soumettre */}
                        {(isTextDefi || quizValidated) && (
                            <TouchableOpacity
                                style={[
                                    styles.actionButton, 
                                    styles.submitButton,
                                    (!canSubmit || submitting) && styles.disabledButton
                                ]}
                                onPress={handleSubmit}
                                disabled={!canSubmit || submitting}
                            >
                                <Text style={[
                                    styles.actionButtonText,
                                    (!canSubmit || submitting) && styles.disabledButtonText
                                ]}>
                                    {existingProgress?.evaluationStatus === 'REVISION_DEMANDEE'
                                        ? t('defi.resubmit_button') || "📤 Soumettre à nouveau"
                                        : t('defi.submit_button') || "Soumettre le Défi"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {submitting && <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 20 }} />}

                    <Text style={styles.lecon}>
                        {t('defi.lecon_title') || "Leçon Stratégique"}: {defiContent.leconStrategique}
                    </Text>

                </View>
            </ScrollView>
            
            {/* Le Modal de la Fiche de Travail Guidée */}
            {defiContent.briefing && (
                <BriefingModal
                    isVisible={isBriefingVisible}
                    onClose={() => setIsBriefingVisible(false)}
                    defiTitle={defiContent.titre || defiTitle}
                    briefingContent={defiContent.briefing} 
                />
            )}
        </SafeAreaView>
    );
};

// Styles spécifiques au Rendu de Contenu (Renderer)
const rendererStyles = StyleSheet.create({
    quizContainer: {
        marginBottom: 30,
        padding: isWeb ? 20 : 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    questionText: {
        fontSize: isWeb ? 20 : 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#1F2937',
    },
    optionButton: {
        padding: 12,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        backgroundColor: 'white',
    },
    selectedOption: {
        borderColor: '#3B82F6',
        borderWidth: 2,
        backgroundColor: '#EBF5FF',
    },
    optionText: {
        fontSize: isWeb ? 16 : 14,
        color: '#1F2937',
    },
    textInputContainer: {
        marginBottom: 30,
    },
    simpleInput: { 
        minHeight: isWeb ? 200 : 180, 
        borderColor: '#D1D5DB', 
        borderWidth: 1, 
        padding: 15, 
        borderRadius: 8,
        backgroundColor: 'white',
        fontSize: isWeb ? 16 : 14,
        textAlignVertical: 'top',
    },
});

// Styles principaux
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E5E7EB' },
  scrollContent: {
    padding: isWeb ? 40 : 20,
    paddingBottom: 100,
  },
  container: {
    width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
    backgroundColor: 'white',
    borderRadius: isWeb ? 10 : 0,
    padding: isWeb ? 40 : 20,
    shadowColor: isWeb ? '#000' : 'transparent',
    shadowOpacity: isWeb ? 0.1 : 0,
    shadowRadius: isWeb ? 10 : 0,
    elevation: isWeb ? 5 : 0,
  },
  moduleTag: { fontSize: 16, color: '#6B7280', fontWeight: '500', marginBottom: 5 },
  header: { fontSize: isWeb ? 34 : 26, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  subtitle: { fontSize: isWeb ? 18 : 16, color: '#6B7280', marginBottom: 20 },
  
  // Alerte de statut
  statusAlert: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusAlertText: {
    fontSize: isWeb ? 16 : 14,
    color: '#1F2937',
    lineHeight: isWeb ? 24 : 20,
  },
  attemptText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  sectionTitle: { fontSize: isWeb ? 22 : 18, fontWeight: '600', color: '#3B82F6', marginTop: 15, marginBottom: 10 },
  scenarioText: { fontSize: isWeb ? 18 : 16, color: '#4B5563', marginBottom: 10, lineHeight: isWeb ? 28 : 24 },
  instructionText: { fontSize: isWeb ? 16 : 14, color: '#4B5563', marginBottom: 20 },
  workArea: { 
    padding: 5, 
    borderRadius: 8, 
    marginBottom: 30,
    backgroundColor: 'white'
  },
  buttonRow: { flexDirection: isWeb ? 'row' : 'column', justifyContent: 'space-around', marginTop: 10, marginBottom: 30, paddingHorizontal: isWeb ? '15%' : 0, gap: 10 },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    minHeight: 48,
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  validateButton: {
    backgroundColor: '#F59E0B',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#E5E7EB',
  },
  feedbackBox: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    borderWidth: 2,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  lecon: { 
    fontSize: isWeb ? 16 : 14, 
    fontWeight: '500', 
    fontStyle: 'italic', 
    color: '#10B981', 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    paddingTop: 15, 
    textAlign: 'center' 
  },
});

export default DefiScreen;
