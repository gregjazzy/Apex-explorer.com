// /components/ExplorerCreationModal.tsx

import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, Button, Alert, Dimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { createExplorerProfile } from '../services/dataService';

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
  const [explorerName, setExplorerName] = useState('');
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

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={() => onClose(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.title}>{t('mentor.create_explorer_title') || "Créer un nouvel Explorateur"}</Text>
          <Text style={styles.subtitle}>{t('mentor.create_explorer_subtitle') || "Ceci crée le profil de votre enfant. Le code UUID sera son identifiant de connexion."}</Text>

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
  title: { fontSize: isWeb ? 26 : 22, fontWeight: '700', marginBottom: 10, color: '#1F2937', textAlign: 'center' },
  subtitle: { fontSize: isWeb ? 16 : 14, color: '#4B5563', marginBottom: 20, textAlign: 'center' },
  input: {
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 25,
    backgroundColor: 'white',
    fontSize: isWeb ? 18 : 16,
  },
  buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
  }
});

