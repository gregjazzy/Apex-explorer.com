// /hooks/useAuth.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import i18n from '../config/i18n';
import { loginExplorerByPin, createSoloExplorer } from '../services/dataService';

interface UserProfile extends User {
    role: 'explorer' | 'mentor';
}

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  signUpMentor: (name: string, email: string, password: string) => Promise<void>;
  login: (nameOrEmail: string, password?: string, role?: 'explorer' | 'mentor') => Promise<void>; 
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- SIMULATION D'AUTH (pour la démo) ---
const SIM_USER_BASE: Omit<UserProfile, 'id' | 'role'> = {
    aud: 'authenticated',
    email: undefined,
    email_confirmed_at: '2025-01-01',
    phone: undefined,
    last_sign_in_at: '2025-01-01',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    app_metadata: {},
    user_metadata: {}
};

const SIM_SESSION_BASE: Omit<Session, 'user'> = {
    access_token: 'sim-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    refresh_token: 'sim-refresh'
};

// --- Fournisseur de Contexte d'Authentification ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // NOUVELLE FONCTION: Inscription Mentor
  const signUpMentor = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: 'mentor',
            name: name,
          }
        }
      });

      if (error) throw error;
      
      Alert.alert(
        i18n.t('mentor.signup_success_title') || "Vérifiez votre e-mail",
        i18n.t('mentor.signup_success_message', { email: email }) || `Un lien de confirmation a été envoyé à ${email}. Veuillez cliquer dessus pour activer votre compte.`,
      );

    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(i18n.t('global.error') || "Erreur", error.message);
      } else {
        Alert.alert(i18n.t('global.error') || "Erreur", "Une erreur d'inscription est survenue.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (nameOrEmail: string, password?: string, role?: 'explorer' | 'explorer_solo' | 'mentor') => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      const isMentor = role === 'mentor' && password;
      const isExplorerSolo = role === 'explorer_solo';

      if (isMentor) {
          // Utilisation de la connexion Supabase réelle
          const { data, error } = await supabase.auth.signInWithPassword({ email: nameOrEmail, password: password });

          if (error) {
             Alert.alert(i18n.t('global.error') || "Erreur", error.message);
          } else if (data.user) {
             // Mise à jour de l'état local après la connexion réelle
             const loggedInUser: UserProfile = { ...data.user, role: 'mentor' } as UserProfile;
             setSession(data.session);
             setUser(loggedInUser);
             Alert.alert(i18n.t('global.welcome'), `Connexion Mentor réussie.`);
          }
      } else if (isExplorerSolo && password) {
          // NOUVEAU: Créer un explorateur solo (sans mentor)
          const newExplorer = await createSoloExplorer(nameOrEmail, password);
          
          if (newExplorer) {
              const loggedInUser: UserProfile = { 
                  ...SIM_USER_BASE, 
                  id: newExplorer.explorer_uuid,
                  role: 'explorer', 
                  user_metadata: { name: newExplorer.name } 
              } as UserProfile;
              setSession({ ...SIM_SESSION_BASE, user: loggedInUser });
              setUser(loggedInUser);
              Alert.alert('🎉 Compte créé !', `Bienvenue, ${newExplorer.name}! Ton aventure commence maintenant.`);
          } else {
              Alert.alert(i18n.t('global.error'), "Impossible de créer le compte. Ce nom est peut-être déjà pris.");
          }
      } else if (role === 'explorer' && password) {
          // Vérification de l'Explorateur par Nom et PIN
          const explorerProfile = await loginExplorerByPin(nameOrEmail, password);

          if (explorerProfile) {
              const loggedInUser: UserProfile = { 
                  ...SIM_USER_BASE, 
                  id: explorerProfile.explorer_uuid,
                  role: 'explorer', 
                  user_metadata: { name: explorerProfile.name } 
              } as UserProfile;
              setSession({ ...SIM_SESSION_BASE, user: loggedInUser });
              setUser(loggedInUser);
              Alert.alert(i18n.t('global.welcome'), `Bienvenue, ${explorerProfile.name}!`);
          } else {
              Alert.alert(i18n.t('global.error'), "Nom de l'Explorateur ou Code PIN incorrect.");
          }
      } else {
          Alert.alert(i18n.t('global.error'), "Erreur d'authentification ou rôle manquant.");
      }
      setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    // Déconnexion Supabase réelle
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  const value = { session, user, loading, login, logout, signUpMentor };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

