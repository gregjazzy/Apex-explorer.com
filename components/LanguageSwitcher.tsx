// /components/LanguageSwitcher.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language.substring(0, 2); 
  const nextLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
  const displayNextLanguage = nextLanguage.toUpperCase();

  const toggleLanguage = async () => {
    try {
      await i18n.changeLanguage(nextLanguage);
    } catch (error) {
      console.error("Erreur lors du changement de langue:", error);
    }
  };

  return (
    <TouchableOpacity onPress={toggleLanguage} style={styles.button}>
      <Text style={styles.text}>
        {displayNextLanguage}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#6B7280', 
    marginRight: 10, 
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LanguageSwitcher;

