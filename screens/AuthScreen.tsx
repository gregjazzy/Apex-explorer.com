// /screens/AuthScreen.tsx

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Platform, Dimensions, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth'; 

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 550; 

const AuthScreen: React.FC<StackScreenProps<any, 'Auth'>> = () => {
  const { t } = useTranslation();
  const { login, signUpMentor, loading } = useAuth(); // AJOUT: signUpMentor
  
  // États de l'écran
  const [explorerName, setExplorerName] = useState('');
  const [explorerPin, setExplorerPin] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorPassword, setMentorPassword] = useState('');
  const [mentorName, setMentorName] = useState(''); // NOUVEAU: Nom pour l'inscription
  
  const [authMode, setAuthMode] = useState<'explorer' | 'mentor_login' | 'mentor_signup'>('explorer');

  const handleExplorerLogin = () => {
    if (explorerName.length < 3 || explorerPin.length !== 4) {
      Alert.alert(t('global.error'), "Veuillez entrer un Nom et un PIN (4 chiffres) valides.");
      return;
    }
    login(explorerName, explorerPin, 'explorer');
  };
  
  const handleMentorLogin = () => {
    if (!mentorEmail || !mentorPassword) {
      Alert.alert(t('global.error'), "Veuillez entrer votre email et mot de passe.");
      return;
    }
    login(mentorEmail, mentorPassword, 'mentor'); 
  };

  // NOUVELLE FONCTION: Gérer l'Inscription Mentor
  const handleMentorSignup = () => {
    if (!mentorName || !mentorEmail || !mentorPassword) {
      Alert.alert(t('global.error'), "Veuillez remplir tous les champs.");
      return;
    }
    signUpMentor(mentorName, mentorEmail, mentorPassword);
  };

  const renderMentorForm = () => {
      // Formulaire d'Inscription
      if (authMode === 'mentor_signup') {
          return (
              <View style={styles.formGroup}>
                  <Text style={styles.formTitle}>{t('mentor.signup_title') || "Créer un Compte Mentor"}</Text>
                   <TextInput
                      style={styles.input}
                      placeholder={t('mentor.name_placeholder') || "Votre Nom"}
                      value={mentorName}
                      onChangeText={setMentorName}
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
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
                          title={loading ? t('global.loading') : (t('mentor.signup_button') || "S'inscrire")}
                          onPress={handleMentorSignup}
                          color="#3B82F6"
                          disabled={loading}
                      />
                  </View>
                  <Button
                      title={t('mentor.already_have_account') || "J'ai déjà un compte"}
                      onPress={() => setAuthMode('mentor_login')}
                      color="#6B7280"
                  />
              </View>
          );
      }
      
      // Formulaire de Connexion Mentor
      return (
          <View style={styles.formGroup}>
              <Text style={styles.formTitle}>{t('global.mentor_login')}</Text>
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
                      title={loading ? t('global.loading') : t('global.mentor_login')}
                      onPress={handleMentorLogin}
                      color="#10B981"
                      disabled={loading}
                  />
              </View>
              <Button
                  title={t('mentor.need_account') || "Je n'ai pas de compte"}
                  onPress={() => setAuthMode('mentor_signup')}
                  color="#9CA3AF"
              />
          </View>
      );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>APEX JUNIOR EXPLORER</Text>
        <Text style={styles.subtitle}>{t('global.welcome')}</Text>

        {authMode === 'explorer' ? (
          // --- Connexion Explorateur ---
          <View style={styles.formGroup}>
             <Text style={styles.formTitle}>{t('global.continue')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.explorer_name_placeholder')}
              value={explorerName}
              onChangeText={setExplorerName}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder={t('mentor.pin_placeholder') || "Code PIN (4 chiffres)"}
              value={explorerPin}
              onChangeText={setExplorerPin}
              keyboardType="numeric"
              maxLength={4}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
            <View style={styles.buttonWrapper}>
              <Button
                title={loading ? t('global.loading') : t('auth.start_adventure')}
                onPress={handleExplorerLogin}
                color="#3B82F6"
                disabled={loading}
              />
            </View>
            <Button
              title={t('global.mentor_login')}
              onPress={() => setAuthMode('mentor_login')}
              color="#10B981"
            />
          </View>
        ) : (
          // --- Connexion/Inscription Mentor ---
          <View>
            {renderMentorForm()}
            <Button
              title={t('auth.back_to_explorer')}
              onPress={() => setAuthMode('explorer')}
              color="#6B7280"
            />
          </View>
        )}

        {loading && <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 20 }} />}

        <Text style={styles.footer}>{t('auth.choose_role')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E5E7EB' },
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
    fontSize: isWeb ? 38 : 30,
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
  formGroup: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: isWeb ? 20 : 0,
  },
  formTitle: {
      fontSize: isWeb ? 22 : 18,
      fontWeight: '700',
      marginBottom: 20,
      textAlign: 'center',
      color: '#1F2937'
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
});

export default AuthScreen;

