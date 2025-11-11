// /App.tsx (Le Point d'Entrée)

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

// Imports de Configuration, Hooks et Composants
import i18n from './config/i18n'; 
import { AuthProvider, useAuth } from './hooks/useAuth'; 
import LanguageSwitcher from './components/LanguageSwitcher'; 

// Imports des écrans
import AuthScreen from './screens/AuthScreen';
import ExplorerDashboardScreen from './screens/ExplorerDashboardScreen';
import MentorDashboardScreen from './screens/MentorDashboardScreen';
import DefiListScreen from './screens/DefiListScreen'; 
import DefiScreen from './screens/DefiScreen'; 

const Stack = createNativeStackNavigator();

// --- Composant qui gère la navigation conditionnelle ---
const AppContent: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const userRole = user?.role; 

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10 }}>{t('global.loading')}</Text>
      </View>
    );
  }

  // Composant pour le header avec langue ET logout
  const HeaderRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
      <LanguageSwitcher />
      {user && (
        <TouchableOpacity 
          onPress={logout} 
          style={{ 
            marginLeft: 10, 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 5, 
            backgroundColor: '#EF4444' 
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {t('global.logout')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerBackVisible: true,
        headerBackTitle: t('global.back') || 'Retour',
        headerRight: () => <HeaderRight />, 
        headerTitle: "Apex Junior Explorer", 
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      {!user ? (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ 
            headerTitle: t('global.welcome'),
            headerBackVisible: false
          }}
        />
      ) : userRole === 'explorer' ? (
        <> 
          <Stack.Screen 
            name="Explorer" 
            component={ExplorerDashboardScreen} 
            options={{ 
              headerTitle: t('dashboard.title'),
              headerBackVisible: false
            }}
          />
          <Stack.Screen 
            name="DefiList" 
            component={DefiListScreen}
            options={{ 
              headerTitle: t('defi.title'),
              headerBackVisible: true,
              headerRight: undefined // Pas de bouton de langue
            }}
          /> 
          <Stack.Screen 
            name="Defi" 
            component={DefiScreen}
            options={{ 
              headerTitle: t('defi.title'),
              headerBackVisible: true,
              headerRight: undefined // Pas de bouton de langue
            }}
          /> 
        </>
      ) : (
        <Stack.Screen 
          name="Mentor" 
          component={MentorDashboardScreen} 
          options={{ 
            headerTitle: t('mentor.title'),
            headerBackVisible: false
          }}
        />
      )}
    </Stack.Navigator>
  );
};
// --------------------------------------------------------

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simule la fin de l'initialisation après un court délai
    setTimeout(() => setIsReady(true), 50); 
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AuthProvider> 
        <AppContent />
      </AuthProvider>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

