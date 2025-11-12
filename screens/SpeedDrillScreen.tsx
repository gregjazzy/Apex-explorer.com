// /screens/SpeedDrillScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Dimensions, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

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
    const [mistakes, setMistakes] = useState<MistakeRecord[]>([]); // NOUVEAU : Enregistrer les erreurs

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
    const endGame = () => {
        setGameState('results');
        setEndTime(Date.now());
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
        } else {
            setFeedback('incorrect');
            // NOUVEAU : Enregistrer l'erreur
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
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.container}>
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

    // Écran de jeu
    if (gameState === 'playing') {
        const currentQuestion = questions[currentQuestionIndex];
        
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.gameHeader}>
                        <Text style={styles.questionCount}>
                            {t('speed_drills.question_count', { current: currentQuestionIndex + 1, total: 10 })}
                        </Text>
                        <Text style={[styles.timer, timeLeft <= 10 && styles.timerWarning]}>
                            {t('speed_drills.time_left', { seconds: timeLeft })}
                        </Text>
                    </View>

                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>
                            {currentQuestion.num1} {getOperationSymbol(currentQuestion.operation)} {currentQuestion.num2} = ?
                        </Text>
                    </View>

                    <View style={styles.answerContainer}>
                        <Text style={styles.answerLabel}>{t('speed_drills.your_answer')}</Text>
                        <TextInput
                            style={[styles.answerInput, feedback === 'correct' && styles.answerInputCorrect, feedback === 'incorrect' && styles.answerInputIncorrect]}
                            value={userAnswer}
                            onChangeText={setUserAnswer}
                            keyboardType="numeric"
                            placeholder="..."
                            autoFocus
                            editable={!feedback}
                            onSubmitEditing={submitAnswer}
                        />
                        {feedback && (
                            <Text style={[styles.feedbackText, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
                                {t(`speed_drills.${feedback}`)}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, feedback && styles.submitButtonDisabled]}
                        onPress={submitAnswer}
                        disabled={!!feedback}
                    >
                        <Text style={styles.submitButtonText}>{t('speed_drills.submit_answer')}</Text>
                    </TouchableOpacity>

                    <View style={styles.scoreBar}>
                        <Text style={styles.scoreText}>✅ {correctAnswers} / {currentQuestionIndex + 1}</Text>
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
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
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: {
        padding: isWeb ? 40 : 20,
        alignItems: 'center',
        flexGrow: 1,
    },
    container: {
        width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
        backgroundColor: 'white',
        borderRadius: isWeb ? 10 : 8,
        padding: isWeb ? 40 : 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        fontSize: isWeb ? 34 : 26,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: isWeb ? 18 : 16,
        color: '#6B7280',
        marginBottom: 30,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 15,
    },
    sectionTitle: {
        fontSize: isWeb ? 20 : 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 20,
        marginBottom: 10,
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 10,
    },
    optionButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: 'white',
    },
    optionButtonSelected: {
        borderColor: '#F59E0B',
        backgroundColor: '#FEF3C7',
    },
    optionButtonText: {
        fontSize: isWeb ? 16 : 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    optionButtonTextSelected: {
        color: '#F59E0B',
    },
    startButton: {
        marginTop: 30,
        backgroundColor: '#F59E0B',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: isWeb ? 20 : 18,
        fontWeight: '700',
        color: 'white',
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
    },
    questionCount: {
        fontSize: isWeb ? 18 : 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    timer: {
        fontSize: isWeb ? 20 : 18,
        fontWeight: '700',
        color: '#10B981',
    },
    timerWarning: {
        color: '#EF4444',
    },
    questionContainer: {
        alignItems: 'center',
        marginVertical: 40,
    },
    questionText: {
        fontSize: isWeb ? 48 : 36,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    answerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    answerLabel: {
        fontSize: isWeb ? 18 : 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 10,
    },
    answerInput: {
        width: '80%',
        height: 60,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        fontSize: isWeb ? 32 : 24,
        textAlign: 'center',
        backgroundColor: 'white',
        fontWeight: '600',
    },
    answerInputCorrect: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    answerInputIncorrect: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    feedbackText: {
        marginTop: 10,
        fontSize: isWeb ? 18 : 16,
        fontWeight: '700',
    },
    feedbackCorrect: {
        color: '#10B981',
    },
    feedbackIncorrect: {
        color: '#EF4444',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: isWeb ? 20 : 18,
        fontWeight: '700',
        color: 'white',
    },
    scoreBar: {
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    scoreText: {
        fontSize: isWeb ? 18 : 16,
        fontWeight: '600',
        color: '#10B981',
    },
    resultsTitle: {
        fontSize: isWeb ? 40 : 32,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 10,
    },
    resultsSubtitle: {
        fontSize: isWeb ? 24 : 20,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
    },
    resultsContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 20,
        marginBottom: 30,
    },
    resultItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    resultLabel: {
        fontSize: isWeb ? 20 : 18,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
    resultsButtons: {
        gap: 15,
    },
    playAgainButton: {
        backgroundColor: '#F59E0B',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    playAgainButtonText: {
        fontSize: isWeb ? 20 : 18,
        fontWeight: '700',
        color: 'white',
    },
    backButton: {
        backgroundColor: '#6B7280',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: isWeb ? 18 : 16,
        fontWeight: '600',
        color: 'white',
    },
    reviewButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewButtonText: {
        fontSize: isWeb ? 20 : 18,
        fontWeight: '700',
        color: 'white',
    },
    reviewButtonSubtext: {
        fontSize: isWeb ? 14 : 12,
        fontWeight: '400',
        color: 'white',
        marginTop: 5,
    },
    mistakesContainer: {
        marginBottom: 30,
    },
    mistakeCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        padding: 20,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    mistakeHeader: {
        fontSize: isWeb ? 16 : 14,
        fontWeight: '700',
        color: '#991B1B',
        marginBottom: 10,
    },
    mistakeQuestion: {
        fontSize: isWeb ? 24 : 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 15,
        textAlign: 'center',
    },
    mistakeAnswers: {
        marginBottom: 15,
    },
    mistakeUserAnswer: {
        fontSize: isWeb ? 16 : 14,
        color: '#991B1B',
        marginBottom: 5,
    },
    mistakeCorrectAnswer: {
        fontSize: isWeb ? 16 : 14,
        color: '#059669',
        fontWeight: '600',
    },
    hintBox: {
        backgroundColor: '#DBEAFE',
        borderRadius: 8,
        padding: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    hintTitle: {
        fontSize: isWeb ? 16 : 14,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 10,
    },
    hintText: {
        fontSize: isWeb ? 14 : 12,
        color: '#1F2937',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        lineHeight: 20,
    },
    noMistakesText: {
        fontSize: isWeb ? 24 : 20,
        fontWeight: '600',
        color: '#10B981',
        textAlign: 'center',
        marginVertical: 40,
    },
});

export default SpeedDrillScreen;

