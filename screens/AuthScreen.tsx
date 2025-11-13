// /screens/AuthScreen.tsx

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Platform, Dimensions, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth'; 

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 550; 

const AuthScreen: React.FC<NativeStackScreenProps<any, 'Auth'>> = () => {
  const { t } = useTranslation();
  const { login, signUpMentor, loading } = useAuth();
  
  // États
  const [step, setStep] = useState<'role_choice' | 'explorer' | 'mentor'>('role_choice');
  const [mentorMode, setMentorMode] = useState<'login' | 'signup'>('login');
  
  const [explorerName, setExplorerName] = useState('');
  const [explorerPin, setExplorerPin] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorPassword, setMentorPassword] = useState('');
  const [mentorName, setMentorName] = useState('');

  // Gestion Explorateur (avec auto-création si nouveau)
  const handleExplorerSubmit = () => {
    if (explorerName.length < 3) {
      Alert.alert(t('global.error'), "Le nom doit faire au moins 3 caractères.");
      return;
    }
    if (explorerPin.length !== 4) {
      Alert.alert(t('global.error'), "Le PIN doit faire exactement 4 chiffres.");
      return;
    }
    
    // Le backend déterminera si c'est une connexion ou une création
    login(explorerName, explorerPin, 'explorer_solo');
  };

  // Gestion Mentor
  const handleMentorLogin = () => {
    if (!mentorEmail || !mentorPassword) {
      Alert.alert(t('global.error'), "Veuillez entrer votre email et mot de passe.");
      return;
    }
    login(mentorEmail, mentorPassword, 'mentor'); 
  };

  const handleMentorSignup = () => {
    if (!mentorName || !mentorEmail || !mentorPassword) {
      Alert.alert(t('global.error'), "Veuillez remplir tous les champs.");
      return;
    }
    signUpMentor(mentorName, mentorEmail, mentorPassword);
  };

  // --- ÉTAPE 1 : CHOIX DU RÔLE ---
  if (step === 'role_choice') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.header}>APEX JUNIOR EXPLORER</Text>
          <Text style={styles.subtitle}>{t('global.welcome')}</Text>

          <View style={styles.roleChoiceContainer}>
            <Text style={styles.roleTitle}>Qui es-tu ?</Text>
            
            <TouchableOpacity 
              style={[styles.roleButton, styles.explorerButton]}
              onPress={() => setStep('explorer')}
            >
              <Text style={styles.roleButtonIcon}>👦</Text>
              <Text style={styles.roleButtonText}>Un Explorateur</Text>
              <Text style={styles.roleButtonSubtext}>Je veux apprendre et m'amuser !</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleButton, styles.mentorButton]}
              onPress={() => setStep('mentor')}
            >
              <Text style={styles.roleButtonIcon}>👨‍🏫</Text>
              <Text style={styles.roleButtonText}>Un Mentor</Text>
              <Text style={styles.roleButtonSubtext}>J'accompagne des explorateurs</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>{t('auth.choose_role')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- ÉTAPE 2A : FORMULAIRE EXPLORATEUR ---
  if (step === 'explorer') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.header}>🚀 Espace Explorateur</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.infoBox}>
              💡 Entre ton nom et ton code PIN.{'\n\n'}
              • Déjà inscrit ? → Tu seras connecté !{'\n'}
              • Première fois ? → Ton compte sera créé !
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ton nom d'explorateur"
              value={explorerName}
              onChangeText={setExplorerName}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
              autoFocus
            />
            
            <TextInput
              style={styles.input}
              placeholder="Ton code PIN (4 chiffres)"
              value={explorerPin}
              onChangeText={setExplorerPin}
              keyboardType="numeric"
              maxLength={4}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
              secureTextEntry
            />

            <View style={styles.buttonWrapper}>
              <Button
                title={loading ? t('global.loading') : "C'est parti ! 🎯"}
                onPress={handleExplorerSubmit}
                color="#3B82F6"
                disabled={loading}
              />
            </View>

            <Button
              title="← Retour"
              onPress={() => setStep('role_choice')}
              color="#9CA3AF"
            />
          </View>

          {loading && <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 20 }} />}
        </View>
      </SafeAreaView>
    );
  }

  // --- ÉTAPE 2B : FORMULAIRE MENTOR ---
  if (step === 'mentor') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.header}>👨‍🏫 Espace Mentor</Text>
          
          {/* Tabs Connexion / Inscription */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, mentorMode === 'login' && styles.tabActive]}
              onPress={() => setMentorMode('login')}
            >
              <Text style={[styles.tabText, mentorMode === 'login' && styles.tabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, mentorMode === 'signup' && styles.tabActive]}
              onPress={() => setMentorMode('signup')}
            >
              <Text style={[styles.tabText, mentorMode === 'signup' && styles.tabTextActive]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            {mentorMode === 'login' ? (
              // CONNEXION
              <>
                <TextInput
                  style={styles.input}
                  placeholder={t('mentor.email_placeholder')}
                  value={mentorEmail}
                  onChangeText={setMentorEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                  autoFocus
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('mentor.password_placeholder')}
                  value={mentorPassword}
                  onChangeText={setMentorPassword}
                  secureTextEntry
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
                <View style={styles.buttonWrapper}>
                  <Button
                    title={loading ? t('global.loading') : "Me connecter"}
                    onPress={handleMentorLogin}
                    color="#10B981"
                    disabled={loading}
                  />
                </View>
              </>
            ) : (
              // INSCRIPTION
              <>
                <TextInput
                  style={styles.input}
                  placeholder={t('mentor.name_placeholder') || "Votre Nom"}
                  value={mentorName}
                  onChangeText={setMentorName}
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                  autoFocus
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('mentor.email_placeholder')}
                  value={mentorEmail}
                  onChangeText={setMentorEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('mentor.password_placeholder')}
                  value={mentorPassword}
                  onChangeText={setMentorPassword}
                  secureTextEntry
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
                <View style={styles.buttonWrapper}>
                  <Button
                    title={loading ? t('global.loading') : "Créer mon compte"}
                    onPress={handleMentorSignup}
                    color="#3B82F6"
                    disabled={loading}
                  />
                </View>
              </>
            )}

            <Button
              title="← Retour"
              onPress={() => setStep('role_choice')}
              color="#9CA3AF"
            />
          </View>

          {loading && <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 20 }} />}
        </View>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#E5E7EB' 
  },
  container: {
    flex: 1,
    padding: isWeb ? 60 : 25,
    backgroundColor: 'white',
    width: isWeb ? Math.min(width * 0.9, MAX_WIDTH) : '100%',
    alignSelf: 'center',
    shadowColor: isWeb ? '#000' : 'transparent',
    shadowOpacity: isWeb ? 0.1 : 0,
    shadowRadius: isWeb ? 10 : 0,
    elevation: isWeb ? 5 : 0,
    borderRadius: isWeb ? 10 : 0,
    marginTop: isWeb ? 40 : 0,
    marginBottom: isWeb ? 40 : 0,
    justifyContent: 'center', 
  },
  header: {
    fontSize: isWeb ? 38 : 28,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isWeb ? 22 : 18,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  footer: {
    marginTop: 60,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // CHOIX DU RÔLE
  roleChoiceContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 30,
    textAlign: 'center',
  },
  roleButton: {
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  explorerButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  mentorButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  roleButtonIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  roleButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 5,
  },
  roleButtonSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // FORMULAIRES
  formGroup: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: isWeb ? 20 : 0,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  input: {
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: isWeb ? 18 : 16,
  },
  buttonWrapper: {
    marginVertical: 10,
  },
  
  // TABS MENTOR
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
});

export default AuthScreen;
