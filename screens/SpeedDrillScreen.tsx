// /screens/SpeedDrillScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Dimensions, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { saveSpeedDrillSession } from '../services/dataService';
import PremiumTheme from '../config/premiumTheme';
import CircularTimer from '../components/CircularTimer';
import ConfettiAnimation from '../components/ConfettiAnimation';
import Mascot from '../components/Mascot';
import { getMascotMessageForContext, getMascotMessageForPerformance } from '../utils/mascotMessages';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600;

type SpeedDrillScreenProps = StackScreenProps<any, 'SpeedDrill'>;

type DifficultyLevel = 'easy' | 'medium' | 'hard';
type OperationType = 'multiplication' | 'division' | 'addition' | 'subtraction';

interface Question {
    num1: number;
    num2: number;
    operation: OperationType;
    answer: number;
}

interface MistakeRecord {
    question: Question;
    userAnswer: number;
    questionNumber: number;
}

type GameState = 'setup' | 'playing' | 'results' | 'review';

const SpeedDrillScreen: React.FC<SpeedDrillScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const { user } = useAuth(); // NOUVEAU : Récupérer l'utilisateur pour sauvegarder
    
    // Configuration
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
    const [operationType, setOperationType] = useState<OperationType>('multiplication');
    
    // État du jeu
    const [gameState, setGameState] = useState<GameState>('setup');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [mistakes, setMistakes] = useState<MistakeRecord[]>([]); // Enregistrer les erreurs
    const [showConfetti, setShowConfetti] = useState(false); // NOUVEAU : Confettis

    // Générateur de nombres selon la difficulté
    const generateNumber = useCallback((difficulty: DifficultyLevel, operation: OperationType): { min: number; max: number } => {
        if (operation === 'multiplication') {
            switch (difficulty) {
                case 'easy': return { min: 2, max: 10 };
                case 'medium': return { min: 5, max: 15 };
                case 'hard': return { min: 10, max: 25 };
            }
        } else if (operation === 'division') {
            switch (difficulty) {
                case 'easy': return { min: 2, max: 10 };
                case 'medium': return { min: 5, max: 12 };
                case 'hard': return { min: 5, max: 20 };
            }
        } else if (operation === 'addition') {
            switch (difficulty) {
                case 'easy': return { min: 1, max: 50 };
                case 'medium': return { min: 20, max: 100 };
                case 'hard': return { min: 50, max: 500 };
            }
        } else { // subtraction
            switch (difficulty) {
                case 'easy': return { min: 1, max: 50 };
                case 'medium': return { min: 20, max: 100 };
                case 'hard': return { min: 50, max: 500 };
            }
        }
    }, []);

    // NOUVEAU : Générer une astuce pédagogique pour une question
    const generateHint = useCallback((question: Question): string => {
        const { num1, num2, operation, answer } = question;
        
        if (operation === 'multiplication') {
            // Décomposition en dizaines et unités
            if (num1 >= 10 || num2 >= 10) {
                const larger = num1 > num2 ? num1 : num2;
                const smaller = num1 > num2 ? num2 : num1;
                const tens = Math.floor(larger / 10) * 10;
                const ones = larger % 10;
                
                if (ones === 0) {
                    return `${larger} × ${smaller} = (${tens} × ${smaller}) = ${answer}`;
                } else {
                    const step1 = tens * smaller;
                    const step2 = ones * smaller;
                    return `${larger} × ${smaller} = (${tens} × ${smaller}) + (${ones} × ${smaller})\n        = ${step1} + ${step2}\n        = ${answer}`;
                }
            } else {
                return `${num1} × ${num2} = ${answer}\n(Table de multiplication)`;
            }
        } else if (operation === 'division') {
            return `${num1} ÷ ${num2} = ${answer}\nVérification: ${answer} × ${num2} = ${num1}`;
        } else if (operation === 'addition') {
            if (num1 >= 10 && num2 >= 10) {
                // Décomposition en dizaines et unités
                const tens1 = Math.floor(num1 / 10) * 10;
                const ones1 = num1 % 10;
                const tens2 = Math.floor(num2 / 10) * 10;
                const ones2 = num2 % 10;
                return `${num1} + ${num2} = (${tens1} + ${tens2}) + (${ones1} + ${ones2})\n        = ${tens1 + tens2} + ${ones1 + ones2}\n        = ${answer}`;
            } else {
                return `${num1} + ${num2} = ${answer}`;
            }
        } else { // subtraction
            if (num1 >= 10 && num2 >= 10) {
                const tens1 = Math.floor(num1 / 10) * 10;
                const ones1 = num1 % 10;
                const tens2 = Math.floor(num2 / 10) * 10;
                const ones2 = num2 % 10;
                return `${num1} − ${num2} = (${tens1} − ${tens2}) + (${ones1} − ${ones2})\n        = ${tens1 - tens2} + ${ones1 - ones2}\n        = ${answer}`;
            } else {
                return `${num1} − ${num2} = ${answer}`;
            }
        }
    }, []);

    // Génération d'une question
    const generateQuestion = useCallback((operation: OperationType, difficulty: DifficultyLevel): Question => {
        const range = generateNumber(difficulty, operation);
        
        if (operation === 'division') {
            // Pour la division, on génère d'abord le résultat et le diviseur
            const answer = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            const num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            const num1 = answer * num2; // Assure une division exacte
            return { num1, num2, operation, answer };
        } else if (operation === 'subtraction') {
            // Pour la soustraction, on assure un résultat positif
            const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            const num2 = Math.floor(Math.random() * num1) + 1;
            const answer = num1 - num2;
            return { num1, num2, operation, answer };
        } else {
            const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            const num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            let answer: number;
            
            if (operation === 'multiplication') {
                answer = num1 * num2;
            } else { // addition
                answer = num1 + num2;
            }
            
            return { num1, num2, operation, answer };
        }
    }, [generateNumber]);

    // Générer 10 questions
    const generateQuestions = useCallback(() => {
        const newQuestions: Question[] = [];
        for (let i = 0; i < 10; i++) {
            newQuestions.push(generateQuestion(operationType, difficulty));
        }
        setQuestions(newQuestions);
    }, [operationType, difficulty, generateQuestion]);

    // Timer
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (gameState === 'playing' && timeLeft === 0) {
            endGame();
        }
    }, [gameState, timeLeft]);

    // Démarrer le jeu
    const startGame = () => {
        generateQuestions();
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setCorrectAnswers(0);
        setTimeLeft(60);
        setUserAnswer('');
        setStartTime(Date.now());
        setEndTime(null);
        setFeedback(null);
        setMistakes([]); // NOUVEAU : Réinitialiser les erreurs
    };

    // Terminer le jeu
    const endGame = async () => {
        const endTime = Date.now();
        setGameState('results');
        setEndTime(endTime);
        
        // NOUVEAU : Confettis si bon score (80%+)
        const finalAccuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
        if (finalAccuracy >= 80) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }
        
        // Sauvegarder la session dans Supabase
        if (user?.id && startTime) {
            try {
                const accuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
                const timeSeconds = Math.round((endTime - startTime) / 1000);
                
                await saveSpeedDrillSession({
                    user_id: user.id,
                    operation_type: operationType,
                    difficulty: difficulty,
                    score: correctAnswers,
                    total_questions: questions.length,
                    accuracy: accuracy,
                    time_seconds: timeSeconds
                });
                
                console.log("Session Speed Drill sauvegardée avec succès");
            } catch (error) {
                console.error("Erreur lors de la sauvegarde de la session:", error);
                // Ne pas bloquer l'utilisateur si la sauvegarde échoue
            }
        }
    };

    // Soumettre une réponse
    const submitAnswer = () => {
        if (!userAnswer.trim()) {
            Alert.alert(t('global.error'), 'Veuillez entrer une réponse');
            return;
        }

        const currentQuestion = questions[currentQuestionIndex];
        const userAnswerNum = parseInt(userAnswer);
        const isCorrect = userAnswerNum === currentQuestion.answer;

        if (isCorrect) {
            setCorrectAnswers(correctAnswers + 1);
            setFeedback('correct');
            // Haptic feedback sur mobile
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } else {
            setFeedback('incorrect');
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            // Enregistrer l'erreur
            setMistakes(prev => [...prev, {
                question: currentQuestion,
                userAnswer: userAnswerNum,
                questionNumber: currentQuestionIndex + 1
            }]);
        }

        // Attendre 500ms pour montrer le feedback, puis passer à la question suivante
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setUserAnswer('');
                setFeedback(null);
            } else {
                endGame();
            }
        }, 500);
    };

    // Symbole de l'opération
    const getOperationSymbol = (operation: OperationType): string => {
        switch (operation) {
            case 'multiplication': return '×';
            case 'division': return '÷';
            case 'addition': return '+';
            case 'subtraction': return '−';
        }
    };

    // Configuration du header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: t('speed_drills.title'),
            headerShown: true,
        });
    }, [navigation, t]);

    // Écran de configuration
    if (gameState === 'setup') {
        const setupMessage = getMascotMessageForContext('speedDrillStart');
        
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.container}>
                        {/* Mascotte pour le Speed Drill */}
                        <Mascot 
                            mood={setupMessage.mood}
                            message={setupMessage.message}
                            size="medium"
                            showBubble={true}
                            animated={true}
                        />
                        
                        <Text style={styles.header}>{t('speed_drills.title')}</Text>
                        <Text style={styles.description}>{t('speed_drills.description')}</Text>

                        {/* Sélection du niveau */}
                        <Text style={styles.sectionTitle}>{t('speed_drills.level')}</Text>
                        <View style={styles.buttonGroup}>
                            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[styles.optionButton, difficulty === level && styles.optionButtonSelected]}
                                    onPress={() => setDifficulty(level)}
                                >
                                    <Text style={[styles.optionButtonText, difficulty === level && styles.optionButtonTextSelected]}>
                                        {t(`speed_drills.${level}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Sélection de l'opération */}
                        <Text style={styles.sectionTitle}>{t('speed_drills.type_math')}</Text>
                        <View style={styles.buttonGroup}>
                            {(['multiplication', 'division', 'addition', 'subtraction'] as OperationType[]).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.optionButton, operationType === type && styles.optionButtonSelected]}
                                    onPress={() => setOperationType(type)}
                                >
                                    <Text style={[styles.optionButtonText, operationType === type && styles.optionButtonTextSelected]}>
                                        {t(`speed_drills.${type}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.startButton} onPress={startGame}>
                            <Text style={styles.startButtonText}>{t('speed_drills.start_button')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Écran de jeu avec timer circulaire et gradients premium
    if (gameState === 'playing') {
        const currentQuestion = questions[currentQuestionIndex];
        const progress = timeLeft / 60;
        
        return (
            <SafeAreaView style={styles.safeArea}>
                <ConfettiAnimation active={showConfetti} count={60} duration={2500} />
                <View style={styles.container}>
                    {/* Header avec compteur de questions */}
                    <Animatable.View animation="fadeInDown" style={styles.gameHeader}>
                        <View style={styles.questionBadge}>
                            <Text style={styles.questionBadgeText}>
                                {currentQuestionIndex + 1} / {questions.length}
                            </Text>
                        </View>
                    </Animatable.View>

                    {/* Timer circulaire au centre */}
                    <Animatable.View animation="zoomIn" delay={200}>
                        <CircularTimer
                            size={140}
                            progress={progress}
                            timeLeft={timeLeft}
                            strokeWidth={10}
                            showTime
                        />
                    </Animatable.View>

                    {/* Question avec animation */}
                    <Animatable.View 
                        key={currentQuestionIndex} 
                        animation="fadeInUp" 
                        duration={400}
                        style={styles.questionContainer}
                    >
                        <Text style={styles.questionText}>
                            {currentQuestion.num1} {getOperationSymbol(currentQuestion.operation)} {currentQuestion.num2} = ?
                        </Text>
                    </Animatable.View>

                    {/* Input avec feedback visuel */}
                    <View style={styles.answerContainer}>
                        <Text style={styles.answerLabel}>{t('speed_drills.your_answer')}</Text>
                        <TextInput
                            style={[
                                styles.answerInput, 
                                feedback === 'correct' && styles.answerInputCorrect, 
                                feedback === 'incorrect' && styles.answerInputIncorrect
                            ]}
                            value={userAnswer}
                            onChangeText={setUserAnswer}
                            keyboardType="numeric"
                            placeholder="..."
                            autoFocus
                            editable={!feedback}
                            onSubmitEditing={submitAnswer}
                        />
                        {feedback && (
                            <Animatable.Text 
                                animation={feedback === 'correct' ? 'bounceIn' : 'shake'}
                                style={[styles.feedbackText, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect]}
                            >
                                {feedback === 'correct' ? '✅ ' : '❌ '}{t(`speed_drills.${feedback}`)}
                            </Animatable.Text>
                        )}
                    </View>

                    {/* Bouton de soumission avec gradient */}
                    <TouchableOpacity
                        style={[styles.submitButton, feedback && styles.submitButtonDisabled]}
                        onPress={submitAnswer}
                        disabled={!!feedback}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={feedback ? ['#9CA3AF', '#6B7280'] : PremiumTheme.gradients.primary.colors}
                            start={PremiumTheme.gradients.primary.start}
                            end={PremiumTheme.gradients.primary.end}
                            style={styles.submitButtonGradient}
                        >
                            <Text style={styles.submitButtonText}>
                                {feedback ? t('speed_drills.wait') || 'Patientez...' : t('speed_drills.submit_answer')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Barre de score */}
                    <View style={styles.scoreBar}>
                        <Text style={styles.scoreText}>✅ {correctAnswers} bonnes réponses</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Écran de revue pédagogique
    if (gameState === 'review') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.container}>
                        <Text style={styles.resultsTitle}>{t('speed_drills.review_title')}</Text>
                        <Text style={styles.resultsSubtitle}>{t('speed_drills.review_subtitle')}</Text>

                        {mistakes.length === 0 ? (
                            <Text style={styles.noMistakesText}>{t('speed_drills.no_mistakes')}</Text>
                        ) : (
                            <View style={styles.mistakesContainer}>
                                {mistakes.map((mistake, index) => (
                                    <View key={index} style={styles.mistakeCard}>
                                        <Text style={styles.mistakeHeader}>
                                            Question {mistake.questionNumber}
                                        </Text>
                                        <Text style={styles.mistakeQuestion}>
                                            {mistake.question.num1} {getOperationSymbol(mistake.question.operation)} {mistake.question.num2} = ?
                                        </Text>
                                        <View style={styles.mistakeAnswers}>
                                            <Text style={styles.mistakeUserAnswer}>
                                                {t('speed_drills.your_answer_was')}: {mistake.userAnswer} ❌
                                            </Text>
                                            <Text style={styles.mistakeCorrectAnswer}>
                                                {t('speed_drills.correct_answer_is')}: {mistake.question.answer} ✅
                                            </Text>
                                        </View>
                                        <View style={styles.hintBox}>
                                            <Text style={styles.hintTitle}>{t('speed_drills.calculation_hint')}</Text>
                                            <Text style={styles.hintText}>{generateHint(mistake.question)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity style={styles.backButton} onPress={() => setGameState('results')}>
                            <Text style={styles.backButtonText}>{t('speed_drills.back_to_results')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Écran de résultats
    const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    const timeTaken = startTime && endTime ? Math.round((endTime - startTime) / 1000) : 60;
    
    // Message de la mascotte basé sur les performances
    const performanceMessage = getMascotMessageForPerformance(accuracy, timeTaken);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    {/* Mascotte pour feedback des résultats */}
                    <Mascot 
                        mood={performanceMessage.mood}
                        message={performanceMessage.message}
                        size="medium"
                        showBubble={true}
                        animated={true}
                    />
                    
                    <Text style={styles.resultsTitle}>{t('speed_drills.game_over')}</Text>
                    <Text style={styles.resultsSubtitle}>{t('speed_drills.results_title')}</Text>

                    <View style={styles.resultsContainer}>
                        <View style={styles.resultItem}>
                            <Text style={styles.resultLabel}>{t('speed_drills.score', { correct: correctAnswers, total: questions.length })}</Text>
                        </View>
                        <View style={styles.resultItem}>
                            <Text style={styles.resultLabel}>{t('speed_drills.accuracy', { percent: accuracy })}</Text>
                        </View>
                        <View style={styles.resultItem}>
                            <Text style={styles.resultLabel}>{t('speed_drills.time_taken', { seconds: timeTaken })}</Text>
                        </View>
                    </View>

                    <View style={styles.resultsButtons}>
                        {mistakes.length > 0 && (
                            <TouchableOpacity style={styles.reviewButton} onPress={() => setGameState('review')}>
                                <Text style={styles.reviewButtonText}>{t('speed_drills.review_button')}</Text>
                                <Text style={styles.reviewButtonSubtext}>{t('speed_drills.mistakes_count', { count: mistakes.length })}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.playAgainButton} onPress={startGame}>
                            <Text style={styles.playAgainButtonText}>{t('speed_drills.play_again')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.backButtonText}>{t('speed_drills.back_to_dashboard')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: PremiumTheme.colors.lightGray },
    scrollContent: {
        padding: isWeb ? 40 : 20,
        alignItems: 'center',
        flexGrow: 1,
    },
    container: {
        width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
        backgroundColor: PremiumTheme.colors.white,
        borderRadius: isWeb ? PremiumTheme.borderRadius.xlarge : PremiumTheme.borderRadius.large,
        padding: isWeb ? 40 : 20,
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
    header: {
        fontSize: PremiumTheme.typography.fontSize.display,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
        marginBottom: PremiumTheme.spacing.sm,
        textAlign: 'center',
    },
    description: {
        fontSize: PremiumTheme.typography.fontSize.lg,
        color: PremiumTheme.colors.gray,
        marginBottom: PremiumTheme.spacing.xl,
        textAlign: 'center',
        paddingBottom: PremiumTheme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    },
    sectionTitle: {
        fontSize: PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
        marginTop: PremiumTheme.spacing.lg,
        marginBottom: PremiumTheme.spacing.md,
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: PremiumTheme.spacing.sm,
        marginBottom: PremiumTheme.spacing.md,
    },
    optionButton: {
        paddingVertical: PremiumTheme.spacing.md,
        paddingHorizontal: PremiumTheme.spacing.lg,
        borderRadius: PremiumTheme.borderRadius.large,
        borderWidth: 2,
        borderColor: PremiumTheme.colors.gray,
        backgroundColor: PremiumTheme.colors.white,
    },
    optionButtonSelected: {
        borderColor: PremiumTheme.colors.orange,
        backgroundColor: '#FEF3C7',
    },
    optionButtonText: {
        fontSize: PremiumTheme.typography.fontSize.base,
        color: PremiumTheme.colors.gray,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
    },
    optionButtonTextSelected: {
        color: PremiumTheme.colors.orange,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
    },
    startButton: {
        marginTop: PremiumTheme.spacing.xxxl,
        backgroundColor: PremiumTheme.colors.orange,
        paddingVertical: PremiumTheme.spacing.lg,
        borderRadius: PremiumTheme.borderRadius.large,
        alignItems: 'center',
        // Ombres cross-platform
        ...(isWeb 
            ? { boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }
            : {
                shadowColor: PremiumTheme.colors.orange,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
            }
        ),
    },
    startButtonText: {
        fontSize: PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: PremiumTheme.spacing.xl,
    },
    questionBadge: {
        backgroundColor: PremiumTheme.colors.primary,
        paddingHorizontal: PremiumTheme.spacing.lg,
        paddingVertical: PremiumTheme.spacing.sm,
        borderRadius: PremiumTheme.borderRadius.full,
    },
    questionBadgeText: {
        fontSize: PremiumTheme.typography.fontSize.base,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    questionContainer: {
        alignItems: 'center',
        marginVertical: PremiumTheme.spacing.xxxl,
    },
    questionText: {
        fontSize: isWeb ? 48 : 36,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
    },
    answerContainer: {
        alignItems: 'center',
        marginBottom: PremiumTheme.spacing.xl,
    },
    answerLabel: {
        fontSize: PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.gray,
        marginBottom: PremiumTheme.spacing.sm,
    },
    answerInput: {
        width: '80%',
        height: 60,
        borderWidth: 2,
        borderColor: PremiumTheme.colors.gray,
        borderRadius: PremiumTheme.borderRadius.large,
        fontSize: isWeb ? 32 : 24,
        textAlign: 'center',
        backgroundColor: PremiumTheme.colors.white,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
    },
    answerInputCorrect: {
        borderColor: PremiumTheme.colors.green,
        backgroundColor: '#ECFDF5',
    },
    answerInputIncorrect: {
        borderColor: PremiumTheme.colors.red,
        backgroundColor: '#FEF2F2',
    },
    feedbackText: {
        marginTop: PremiumTheme.spacing.sm,
        fontSize: PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
    },
    feedbackCorrect: {
        color: PremiumTheme.colors.green,
    },
    feedbackIncorrect: {
        color: PremiumTheme.colors.red,
    },
    submitButton: {
        borderRadius: PremiumTheme.borderRadius.large,
        overflow: 'hidden',
        marginBottom: PremiumTheme.spacing.lg,
    },
    submitButtonGradient: {
        paddingVertical: PremiumTheme.spacing.lg,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    scoreBar: {
        alignItems: 'center',
        paddingTop: PremiumTheme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.06)',
    },
    scoreText: {
        fontSize: PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.green,
    },
    resultsTitle: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.display : PremiumTheme.typography.fontSize.xxxl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
        textAlign: 'center',
        marginBottom: PremiumTheme.spacing.sm,
    },
    resultsSubtitle: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.xxl : PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.gray,
        textAlign: 'center',
        marginBottom: PremiumTheme.spacing.xxxl,
    },
    resultsContainer: {
        backgroundColor: PremiumTheme.colors.lightGray,
        borderRadius: PremiumTheme.borderRadius.large,
        padding: PremiumTheme.spacing.xl,
        marginBottom: PremiumTheme.spacing.xxxl,
    },
    resultItem: {
        paddingVertical: PremiumTheme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    },
    resultLabel: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.xl : PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.darkGray,
        textAlign: 'center',
    },
    resultsButtons: {
        gap: PremiumTheme.spacing.md,
    },
    playAgainButton: {
        backgroundColor: PremiumTheme.colors.orange,
        paddingVertical: PremiumTheme.spacing.lg,
        borderRadius: PremiumTheme.borderRadius.large,
        alignItems: 'center',
    },
    playAgainButtonText: {
        fontSize: PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    backButton: {
        backgroundColor: PremiumTheme.colors.gray,
        paddingVertical: PremiumTheme.spacing.lg,
        borderRadius: PremiumTheme.borderRadius.large,
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: PremiumTheme.typography.fontSize.lg,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.white,
    },
    reviewButton: {
        backgroundColor: PremiumTheme.colors.primary,
        paddingVertical: PremiumTheme.spacing.lg,
        borderRadius: PremiumTheme.borderRadius.large,
        alignItems: 'center',
        marginBottom: PremiumTheme.spacing.sm,
    },
    reviewButtonText: {
        fontSize: PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.white,
    },
    reviewButtonSubtext: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        fontWeight: PremiumTheme.typography.fontWeight.normal,
        color: PremiumTheme.colors.white,
        marginTop: 5,
        opacity: 0.9,
    },
    mistakesContainer: {
        marginBottom: PremiumTheme.spacing.xxxl,
    },
    mistakeCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: PremiumTheme.borderRadius.large,
        padding: PremiumTheme.spacing.xl,
        marginBottom: PremiumTheme.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: PremiumTheme.colors.red,
    },
    mistakeHeader: {
        fontSize: PremiumTheme.typography.fontSize.base,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: '#991B1B',
        marginBottom: PremiumTheme.spacing.sm,
    },
    mistakeQuestion: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.xxl : PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: PremiumTheme.colors.darkGray,
        marginBottom: PremiumTheme.spacing.md,
        textAlign: 'center',
    },
    mistakeAnswers: {
        marginBottom: PremiumTheme.spacing.md,
    },
    mistakeUserAnswer: {
        fontSize: PremiumTheme.typography.fontSize.base,
        color: '#991B1B',
        marginBottom: 5,
    },
    mistakeCorrectAnswer: {
        fontSize: PremiumTheme.typography.fontSize.base,
        color: PremiumTheme.colors.green,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
    },
    hintBox: {
        backgroundColor: '#DBEAFE',
        borderRadius: PremiumTheme.borderRadius.medium,
        padding: PremiumTheme.spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: PremiumTheme.colors.primary,
    },
    hintTitle: {
        fontSize: PremiumTheme.typography.fontSize.base,
        fontWeight: PremiumTheme.typography.fontWeight.bold,
        color: '#1E40AF',
        marginBottom: PremiumTheme.spacing.sm,
    },
    hintText: {
        fontSize: PremiumTheme.typography.fontSize.sm,
        color: PremiumTheme.colors.darkGray,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        lineHeight: 20,
    },
    noMistakesText: {
        fontSize: isWeb ? PremiumTheme.typography.fontSize.xxl : PremiumTheme.typography.fontSize.xl,
        fontWeight: PremiumTheme.typography.fontWeight.semibold,
        color: PremiumTheme.colors.green,
        textAlign: 'center',
        marginVertical: 40,
    },
});

export default SpeedDrillScreen;

