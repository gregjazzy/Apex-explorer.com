// /screens/DefiScreen.tsx

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Platform, Dimensions, ScrollView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { BriefingModal } from '../components/BriefingModal'; 
import { saveDefiProgress } from '../services/dataService'; // NOUVEL IMPORT
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
const DefiContentRenderer: React.FC<{ content: DefiContent }> = ({ content }) => {
    const { t } = useTranslation();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    
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
            />
        </View>
    );
};
// --- FIN NOUVEAU COMPOSANT ---

const DefiScreen: React.FC<DefiScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { user } = useAuth(); // AJOUT : Récupérer l'utilisateur
    const { moduleId, defiId, defiTitle } = route.params;
    const [isBriefingVisible, setIsBriefingVisible] = useState(false);

    // Chargement du contenu réel depuis i18n
    const defiKey = `${moduleId}.${defiId}`; 
    // Utilisation de la clé M1/D1 pour le test car elle est garantie d'exister dans Prompt 1
    const contentToLoad = moduleId === 'm1' && defiId === 'defi1' ? 'm1.defi1' : defiKey; 
    const defiContent = t(contentToLoad, { returnObjects: true }) as DefiContent;

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
    
    // AJOUT : La fonction de soumission utilise maintenant Supabase
    const handleSubmit = async () => {
        const userId = user?.id;
        
        if (!userId) {
            Alert.alert(t('global.error'), "Utilisateur non connecté ou ID manquant.");
            return;
        }

        try {
            // Dans ce scénario simple, on assume que la soumission = complété.
            await saveDefiProgress(
                userId, 
                moduleId, 
                defiId, 
                'completed', // Statut final
                100 // XP accordé
            );
            
            // Message de succès même en mode simulation
            Alert.alert(
                t('defi.submit_title'),
                userId.startsWith('sim-') 
                    ? "Mode simulation : Progression non sauvegardée (utilisateur de test)"
                    : t('defi.submit_message'),
                [{ text: "OK", onPress: () => navigation.pop(2) }]
            );

        } catch (error: any) {
            console.error("Erreur complète:", error);
            // Si c'est un utilisateur simulé, ne pas bloquer
            if (userId.startsWith('sim-') || userId.startsWith('explorer-sim')) {
                Alert.alert(
                    t('defi.submit_title'),
                    "Mode simulation : Défi soumis (progression non sauvegardée)",
                    [{ text: "OK", onPress: () => navigation.pop(2) }]
                );
            } else {
                Alert.alert(t('global.error'), "Échec de l'enregistrement de la progression: " + (error.message || error));
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    {/* En-tête */}
                    <Text style={styles.moduleTag}>{moduleId.toUpperCase()} / {defiId.toUpperCase().replace('DEFI', 'D')}</Text>
                    <Text style={styles.header}>{defiContent.titre || defiTitle}</Text> 
                    
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
                        <DefiContentRenderer content={defiContent} /> 
                    </View>

                    {/* Boutons d'Action */}
                    <View style={styles.buttonRow}>
                        <Button
                            title={t('defi.briefing_button')}
                            onPress={() => setIsBriefingVisible(true)}
                            color="#3B82F6"
                        />
                        <Button
                            title={t('defi.submit_button') || "Soumettre le Défi"}
                            onPress={handleSubmit}
                            color="#10B981"
                        />
                    </View>

                    <Text style={styles.lecon}>
                        {t('defi.lecon_title') || "Leçon Stratégique"}: {defiContent.leconStrategique}
                    </Text>

                </View>
            </ScrollView>
            
            {/* Le Modal de la Fiche de Travail Guidée */}
            <BriefingModal
                isVisible={isBriefingVisible}
                onClose={() => setIsBriefingVisible(false)}
                defiTitle={defiContent.titre || defiTitle}
                briefingContent={defiContent.briefing} 
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
    alignItems: 'center',
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
