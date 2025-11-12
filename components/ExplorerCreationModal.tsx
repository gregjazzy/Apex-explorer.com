// /components/ExplorerCreationModal.tsx

import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, Button, Alert, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { createExplorerProfile, linkExistingExplorer } from '../services/dataService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 500; 

interface CreationModalProps {
  isVisible: boolean;
  onClose: (profileCreated?: boolean) => void;
  onProfileCreated: () => void;
}

export const ExplorerCreationModal: React.FC<CreationModalProps> = ({ isVisible, onClose, onProfileCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Mode : 'create' ou 'link'
  const [mode, setMode] = useState<'create' | 'link'>('create');
  
  // États pour créer un nouveau
  const [explorerName, setExplorerName] = useState('');
  
  // États pour lier un existant
  const [linkName, setLinkName] = useState('');
  const [linkPin, setLinkPin] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!explorerName || explorerName.length < 2) {
      Alert.alert(t('global.error'), t('mentor.error_name_length') || "Le nom doit contenir au moins 2 caractères.");
      return;
    }
    if (!user || user.role !== 'mentor') {
      Alert.alert(t('global.error'), "Seul un Mentor peut créer un Explorateur.");
      return;
    }

    setLoading(true);
    try {
      const newProfile = await createExplorerProfile(user.id, explorerName);
      
      Alert.alert(
        t('mentor.creation_success_title') || "Succès!",
        t('mentor.creation_success_message', { name: newProfile.name, pin: newProfile.pin_code }) || 
        `Le profil de ${newProfile.name} a été créé.\n\nCode PIN: ${newProfile.pin_code}\n\nNotez ce PIN pour la connexion !`
      );
      
      setExplorerName('');
      onProfileCreated();
      onClose(true);

    } catch (error) {
      console.error(error);
      Alert.alert(t('global.error'), t('mentor.creation_error') || "Échec de la création du profil.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLink = async () => {
    if (!linkName || linkName.length < 2) {
      Alert.alert(t('global.error'), "Veuillez entrer le nom de l'explorateur.");
      return;
    }
    if (!linkPin || linkPin.length !== 4) {
      Alert.alert(t('global.error'), "Le code PIN doit contenir 4 chiffres.");
      return;
    }
    if (!user || user.role !== 'mentor') {
      Alert.alert(t('global.error'), "Seul un Mentor peut lier un Explorateur.");
      return;
    }

    setLoading(true);
    try {
      const linkedProfile = await linkExistingExplorer(linkName, linkPin, user.id);
      
      if (!linkedProfile) {
        Alert.alert(
          t('global.error'),
          "Explorateur non trouvé, PIN incorrect, ou déjà lié à un autre mentor."
        );
        return;
      }
      
      Alert.alert(
        "✅ Explorateur lié !",
        `${linkedProfile.name} est maintenant lié à votre compte.\n\nSa progression a été conservée ! 🎉`
      );
      
      setLinkName('');
      setLinkPin('');
      onProfileCreated();
      onClose(true);

    } catch (error) {
      console.error(error);
      Alert.alert(t('global.error'), "Échec de la liaison de l'explorateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={() => onClose(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.title}>{t('mentor.manage_explorer') || "Gérer les Explorateurs"}</Text>
          
          {/* Onglets */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, mode === 'create' && styles.tabActive]}
              onPress={() => setMode('create')}
            >
              <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>
                ➕ Créer nouveau
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, mode === 'link' && styles.tabActive]}
              onPress={() => setMode('link')}
            >
              <Text style={[styles.tabText, mode === 'link' && styles.tabTextActive]}>
                🔗 Lier existant
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Mode Création */}
          {mode === 'create' && (
            <>
              <Text style={styles.subtitle}>
                Créez un nouveau profil pour votre enfant. Un code PIN sera généré automatiquement.
              </Text>

              <TextInput
                style={styles.input}
                placeholder={t('mentor.explorer_name_placeholder') || "Nom de l'Explorateur"}
                value={explorerName}
                onChangeText={setExplorerName}
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
              
              <View style={styles.buttonContainer}>
                <Button 
                    title={t('global.cancel') || "Annuler"} 
                    onPress={() => onClose(false)} 
                    color="#EF4444"
                />
                <Button 
                    title={loading ? t('global.loading') : (t('mentor.create_button') || "Créer le Profil")} 
                    onPress={handleCreate} 
                    color="#10B981"
                    disabled={loading}
                />
              </View>
            </>
          )}
          
          {/* Mode Liaison */}
          {mode === 'link' && (
            <>
              <Text style={styles.subtitle}>
                Liez un explorateur existant qui a créé son compte en mode autonome. Sa progression sera conservée ! 🎉
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nom de l'explorateur"
                value={linkName}
                onChangeText={setLinkName}
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Code PIN (4 chiffres)"
                value={linkPin}
                onChangeText={setLinkPin}
                keyboardType="numeric"
                maxLength={4}
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
              
              <View style={styles.buttonContainer}>
                <Button 
                    title={t('global.cancel') || "Annuler"} 
                    onPress={() => onClose(false)} 
                    color="#EF4444"
                />
                <Button 
                    title={loading ? t('global.loading') : "Lier l'Explorateur"} 
                    onPress={handleLink} 
                    color="#3B82F6"
                    disabled={loading}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
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
  },
  title: { fontSize: isWeb ? 26 : 22, fontWeight: '700', marginBottom: 15, color: '#1F2937', textAlign: 'center' },
  subtitle: { fontSize: isWeb ? 16 : 14, color: '#4B5563', marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  // Onglets
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1F2937',
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
  buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
  }
});

