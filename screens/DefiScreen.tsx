// /screens/DefiScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Platform, Dimensions, ScrollView, Alert, TextInput, TouchableOpacity, ActivityIndicator, Modal, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { BriefingModal } from '../components/BriefingModal'; 
import VideoModal from '../components/VideoModal';
import { saveDefiProgress, fetchExplorerProgressForDefi, ExplorerProgressItem, getExplorerProfile, willUnlockNewBadge } from '../services/dataService';
import { useAuth } from '../hooks/useAuth'; 
import { LinearGradient } from 'expo-linear-gradient'; 

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
    onQuizValidation: (isCorrect: boolean, selectedIndex: number) => void;
    onQuizError: () => void; // Nouveau callback pour les erreurs
}

const DefiContentRenderer: React.FC<DefiContentRendererProps> = ({ 
    content, 
    responseText, 
    setResponseText,
    onQuizValidation,
    onQuizError
}) => {
    const { t } = useTranslation();
    
    // États internes pour les Quiz
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [validated, setValidated] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    
    // Détermination du type de défi
    const isQuiz = !!content.options && content.options.length > 0;
    
    // Fonction de validation interne au Quiz
    const handleValidate = () => {
        if (selectedOption === null) {
            return;
        }
        
        const correct = selectedOption === content.bonneReponseIndex;
        setIsCorrect(correct);
        setValidated(true);
        onQuizValidation(correct, selectedOption);
        
        if (!correct) {
            // Afficher la modal de leçon au lieu de l'Alert
            onQuizError();
        }
    };
    
    // Reset validation quand l'utilisateur change de réponse
    const handleOptionSelect = (index: number) => {
        setSelectedOption(index);
        // Si l'utilisateur était bloqué après une mauvaise réponse, reset
        if (validated && !isCorrect) {
            setValidated(false);
            setIsCorrect(false);
        }
    };
    
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
                            // Feedback visuel après validation (seulement si validé ET correct)
                            validated && isCorrect && index === content.bonneReponseIndex && rendererStyles.correctOption,
                            validated && isCorrect && index === selectedOption && !isCorrect && rendererStyles.incorrectOption,
                        ]}
                        onPress={() => handleOptionSelect(index)}
                        disabled={validated && isCorrect}
                    >
                        <Text style={rendererStyles.optionText}>{option}</Text>
                    </TouchableOpacity>
                ))}
                
                {/* Bouton de validation intégré */}
                {!validated && (
                    <View style={rendererStyles.validationArea}>
                        <TouchableOpacity
                            style={[
                                rendererStyles.validateButtonInternal,
                                selectedOption === null && rendererStyles.disabledValidateButton
                            ]}
                            onPress={handleValidate}
                            disabled={selectedOption === null}
                        >
                            <Text style={rendererStyles.validateButtonText}>
                                {t('defi.validate_button') || "Valider ma Réponse"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
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

// --- COMPOSANT MODAL LEÇON STRATÉGIQUE ---
interface StrategicLessonModalProps {
    visible: boolean;
    onClose: () => void;
    lesson: string;
    isCorrect: boolean;
    isMentorSubmission?: boolean; // Nouveau : défi soumis au mentor
}

const StrategicLessonModal: React.FC<StrategicLessonModalProps> = ({ visible, onClose, lesson, isCorrect, isMentorSubmission = false }) => {
    const { t } = useTranslation();
    
    // Extraire l'URL YouTube si elle existe
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = lesson.match(urlRegex);
    const youtubeUrl = urls ? urls.find(url => url.includes('youtube.com') || url.includes('youtu.be')) : null;
    
    // Texte sans l'URL
    const textWithoutUrl = youtubeUrl 
        ? lesson.split(urlRegex).filter(part => !part.match(urlRegex)).join('').trim()
        : lesson;
    
    const handleOpenVideo = () => {
        if (youtubeUrl) {
            // Ouvrir directement dans le navigateur/app YouTube
            Linking.openURL(youtubeUrl);
        }
    };
    
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={lessonModalStyles.overlay}>
                <View style={lessonModalStyles.modalContainer}>
                    {/* Header avec gradient */}
                    <LinearGradient
                        colors={isCorrect ? ['#10B981', '#059669'] : ['#4F46E5', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={lessonModalStyles.header}
                    >
                        <Text style={lessonModalStyles.headerEmoji}>
                            {isCorrect ? '🎉' : '💡'}
                        </Text>
                        <Text style={lessonModalStyles.headerTitle}>
                            {isCorrect ? t('defi.completed_title') || 'Bravo !' : t('defi.feedback_incorrect') || 'Pas tout à fait'}
                        </Text>
                        {isCorrect && (
                            <Text style={lessonModalStyles.xpBadge}>+100 XP</Text>
                        )}
                    </LinearGradient>
                    
                    {/* Contenu */}
                    <View style={lessonModalStyles.content}>
                        <View style={lessonModalStyles.lessonHeader}>
                            <Text style={lessonModalStyles.lessonIcon}>💡</Text>
                            <Text style={lessonModalStyles.lessonTitle}>
                                {t('defi.lecon_title') || 'Leçon Stratégique'}
                            </Text>
                        </View>
                        
                        <Text style={lessonModalStyles.lessonText}>
                            {textWithoutUrl}
                        </Text>
                        
                        {/* Bouton vidéo YouTube si présent */}
                        {youtubeUrl && (
                            <TouchableOpacity
                                style={lessonModalStyles.videoButton}
                                onPress={handleOpenVideo}
                                activeOpacity={0.7}
                            >
                                <Text style={lessonModalStyles.videoButtonText}>
                                    📹 Voir la vidéo
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    {/* Bouton */}
                    <TouchableOpacity
                        style={lessonModalStyles.button}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={lessonModalStyles.buttonText}>
                            {isMentorSubmission 
                                ? (t('defi.submit_understood') || "J'ai compris 💡")
                                : isCorrect 
                                    ? (t('global.continue') || 'Continuer 🚀') 
                                    : (t('defi.retry_button') || 'Réessayer')
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
// --- FIN COMPOSANT MODAL LEÇON STRATÉGIQUE ---

const DefiScreen: React.FC<DefiScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { moduleId, defiId, defiTitle } = route.params;
    const [isBriefingVisible, setIsBriefingVisible] = useState(false);
    
    // État pour vérifier si l'explorateur est en mode solo
    const [isSoloExplorer, setIsSoloExplorer] = useState(false);
    
    // États pour le cycle de feedback
    const [responseText, setResponseText] = useState('');
    const [existingProgress, setExistingProgress] = useState<ExplorerProgressItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // États pour les Quiz (QCM) - simplifiés
    const [quizValidated, setQuizValidated] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);
    
    // États pour la modal de leçon stratégique
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [lessonIsCorrect, setLessonIsCorrect] = useState(false);
    const [hasNewBadgeToUnlock, setHasNewBadgeToUnlock] = useState(false);
    const [isMentorSubmission, setIsMentorSubmission] = useState(false);
    
    // Callback pour la validation du Quiz
    const handleQuizValidation = async (isCorrect: boolean, selectedIndex: number) => {
        setQuizValidated(isCorrect);
        setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
        
        // Si correct, soumettre automatiquement
        if (isCorrect && user?.id) {
            setSubmitting(true);
            try {
                await saveDefiProgress(
                    user.id, 
                    moduleId, 
                    defiId,
                    responseText,
                    'COMPLETION_IMMEDIATE',
                    100
                );
                
                // Vérifier si un nouveau badge sera débloqué
                const hasNewBadge = await willUnlockNewBadge(user.id, moduleId, defiId);
                setHasNewBadgeToUnlock(hasNewBadge);
                
                // Afficher la modal de leçon stratégique
                setLessonIsCorrect(true);
                setShowLessonModal(true);
            } catch (error: any) {
                console.error("Erreur lors de la soumission automatique du Quiz:", error);
                Alert.alert(
                    t('global.error'),
                    "Échec de l'enregistrement de la progression: " + (error.message || error)
                );
            } finally {
                setSubmitting(false);
            }
        }
    };

    // Fonction pour fermer la modal et naviguer
    const handleLessonModalClose = () => {
        setShowLessonModal(false);
        
        // Si réponse correcte, retourner à l'écran précédent
        if (lessonIsCorrect) {
            navigation.goBack();
            
            // Recharger UNIQUEMENT si nouveau badge
            if (hasNewBadgeToUnlock) {
                navigation.navigate('Explorer', { shouldReload: true });
            }
        } else {
            // Si incorrecte, reset le feedback pour permettre un nouvel essai
            setQuizFeedback(null);
        }
    };
    
    // Callback pour gérer les erreurs de quiz (afficher modal avec leçon)
    const handleQuizError = () => {
        setLessonIsCorrect(false);
        setShowLessonModal(true);
    };

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
            // Charger le profil de l'explorateur pour vérifier s'il est solo
            const profile = await getExplorerProfile(user.id);
            if (profile) {
                setIsSoloExplorer(profile.is_solo === true);
            }
            
            // Charger la progression du défi
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
            // - Quiz (QCM) : validés immédiatement
            // - Défis texte en mode solo : auto-validés (pas besoin de mentor)
            // - Défis texte avec mentor : vont en révision
            const evaluationStatus = isTextDefi 
                ? (isSoloExplorer ? 'COMPLETION_IMMEDIATE' : 'SOUMIS')
                : 'COMPLETION_IMMEDIATE';
            
            await saveDefiProgress(
                userId, 
                moduleId, 
                defiId,
                responseText,
                evaluationStatus,
                100
            );
            
            // Message de succès adapté au mode
            if (evaluationStatus === 'SOUMIS') {
                // Défi soumis à un mentor → Afficher leçon quand même
                setHasNewBadgeToUnlock(false); // Pas de badge tant que pas validé
                setLessonIsCorrect(true);
                setIsMentorSubmission(true);
                setShowLessonModal(true);
            } else {
                // Défi complété immédiatement → Vérifier si nouveau badge
                const hasNewBadge = await willUnlockNewBadge(userId, moduleId, defiId);
                setHasNewBadgeToUnlock(hasNewBadge);
                
                // Afficher la modal de leçon stratégique
                setLessonIsCorrect(true);
                setIsMentorSubmission(false);
                setShowLessonModal(true);
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
                    
                    {/* Badge Mode Autonome */}
                    {isSoloExplorer && isTextDefi && (
                        <View style={styles.soloBadge}>
                            <Text style={styles.soloBadgeText}>{t('defi.solo_mode_badge')}</Text>
                        </View>
                    )}
                    
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
                            onQuizValidation={handleQuizValidation}
                            onQuizError={handleQuizError}
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
                        
                        {/* Bouton Soumettre (uniquement pour les défis texte) */}
                        {isTextDefi && (
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
            
            {/* Modal de Leçon Stratégique */}
            <StrategicLessonModal
                visible={showLessonModal}
                onClose={handleLessonModalClose}
                lesson={defiContent.leconStrategique}
                isCorrect={lessonIsCorrect}
                isMentorSubmission={isMentorSubmission}
            />
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
    correctOption: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
        borderWidth: 3,
    },
    incorrectOption: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
        borderWidth: 3,
    },
    validationArea: {
        marginTop: 15,
        alignItems: 'center',
    },
    validateButtonInternal: {
        backgroundColor: '#F59E0B',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    disabledValidateButton: {
        backgroundColor: '#9CA3AF',
        opacity: 0.5,
    },
    validateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
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
  
  // Badge Mode Autonome
  soloBadge: {
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  soloBadgeText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
    textAlign: 'center',
  },
  
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

// Styles pour la Modal de Leçon Stratégique
const lessonModalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: 500,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        padding: 24,
        alignItems: 'center',
    },
    headerEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    xpBadge: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 12,
    },
    content: {
        padding: 24,
    },
    lessonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    lessonIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    lessonTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    lessonText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4B5563',
    },
    videoButton: {
        backgroundColor: '#FFFFFF',
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        alignSelf: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    videoButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    button: {
        backgroundColor: '#4F46E5',
        margin: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
  },
});

export default DefiScreen;
