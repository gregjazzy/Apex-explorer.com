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
import SpeedDrillScreen from './screens/SpeedDrillScreen'; 

const Stack = createNativeStackNavigator();

// Header DISCRET pour les explorateurs (enfants)
const HeaderRightExplorer: React.FC<{ logout: () => void; i18n: any }> = ({ logout, i18n }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, gap: 8 }}>
    <TouchableOpacity 
      onPress={() => {
        const currentLang = i18n.language.substring(0, 2);
        const nextLang = currentLang === 'fr' ? 'en' : 'fr';
        i18n.changeLanguage(nextLang);
      }}
      style={{ 
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 16 }}>🌐</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={logout} 
      style={{ 
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 16 }}>🚪</Text>
    </TouchableOpacity>
  </View>
);

// Header VISIBLE pour les mentors (adultes)
const HeaderRightMentor: React.FC<{ logout: () => void; t: any }> = ({ logout, t }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
    <LanguageSwitcher />
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
  </View>
);

// --- Composant qui gère la navigation conditionnelle ---
const AppContent: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const userRole = user?.role; 

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10 }}>{t('global.loading')}</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerBackVisible: true,
        headerBackTitle: t('global.back') || 'Retour',
        headerTitle: "Apex Junior Explorer", 
        headerTitleStyle: { fontWeight: 'bold' },
        // NOUVEAU: Animations de transition premium
        animation: 'slide_from_right',
        animationDuration: 300,
        presentation: 'card',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {!user ? (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ 
            headerTitle: t('global.welcome'),
            headerBackVisible: false,
            animation: 'fade',
          }}
        />
      ) : userRole === 'explorer' ? (
        <> 
          <Stack.Screen 
            name="Explorer" 
            component={ExplorerDashboardScreen} 
            options={{ 
              headerTitle: t('dashboard.title'),
              headerBackVisible: false,
              headerRight: () => <HeaderRightExplorer logout={logout} i18n={i18n} />,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="DefiList" 
            component={DefiListScreen as any}
            options={{ 
              headerTitle: t('defi.title'),
              headerBackVisible: true,
              headerRight: () => <HeaderRightExplorer logout={logout} i18n={i18n} />
            }}
          /> 
          <Stack.Screen 
            name="Defi" 
            component={DefiScreen as any}
            options={{ 
              headerTitle: t('defi.title'),
              headerBackVisible: true,
              headerRight: () => <HeaderRightExplorer logout={logout} i18n={i18n} />
            }}
          />
          <Stack.Screen 
            name="SpeedDrill" 
            component={SpeedDrillScreen as any}
            options={{ 
              headerTitle: t('speed_drills.title'),
              headerBackVisible: true,
              headerRight: () => <HeaderRightExplorer logout={logout} i18n={i18n} />,
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }}
          />
        </>
      ) : (
        <Stack.Screen 
          name="Mentor" 
          component={MentorDashboardScreen} 
          options={{ 
            headerTitle: t('mentor.title'),
            headerBackVisible: false,
            headerRight: () => <HeaderRightMentor logout={logout} t={t} />,
            animation: 'slide_from_bottom',
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

