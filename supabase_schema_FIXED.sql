-- =====================================================
-- SCHÉMA CORRIGÉ POUR APEX JUNIOR EXPLORER
-- =====================================================

-- 1. Table des Explorateurs (Profils enfants gérés par les mentors)
CREATE TABLE IF NOT EXISTS explorers (
    id SERIAL PRIMARY KEY,
    explorer_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pin_code TEXT NOT NULL,
    xp_total INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par mentor
CREATE INDEX IF NOT EXISTS idx_explorers_mentor ON explorers (mentor_id);
CREATE INDEX IF NOT EXISTS idx_explorers_pin ON explorers (name, pin_code);

-- RLS pour la table explorers
ALTER TABLE explorers ENABLE ROW LEVEL SECURITY;

-- Les mentors peuvent voir leurs propres explorateurs
CREATE POLICY "Mentors can view their explorers" 
ON explorers FOR SELECT USING (auth.uid() = mentor_id);

-- Les mentors peuvent créer des explorateurs
CREATE POLICY "Mentors can create explorers" 
ON explorers FOR INSERT WITH CHECK (auth.uid() = mentor_id);

-- Les mentors peuvent mettre à jour leurs explorateurs
CREATE POLICY "Mentors can update their explorers" 
ON explorers FOR UPDATE USING (auth.uid() = mentor_id);

-- Les mentors peuvent supprimer leurs explorateurs
CREATE POLICY "Mentors can delete their explorers" 
ON explorers FOR DELETE USING (auth.uid() = mentor_id);

-- =====================================================
-- 2. Table de Progression (CORRIGÉE)
-- =====================================================

-- CORRECTION : user_id est maintenant un TEXT qui peut être soit un UUID d'auth.users
-- soit un explorer_uuid de la table explorers
DROP TABLE IF EXISTS explorer_progress CASCADE;

CREATE TABLE explorer_progress (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- CHANGÉ: TEXT au lieu de UUID avec REFERENCES
    module_id TEXT NOT NULL,
    defi_id TEXT NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL, -- 'completed' | 'submitted' | 'failed'
    xp_earned INTEGER DEFAULT 0 NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Empêcher les doublons pour un même défi complété par un utilisateur
    UNIQUE (user_id, module_id, defi_id)
);

-- Index pour recherche rapide
CREATE INDEX idx_user_defi ON explorer_progress (user_id, module_id, defi_id);

-- Active la sécurité au niveau des lignes (Row Level Security)
ALTER TABLE explorer_progress ENABLE ROW LEVEL SECURITY;

-- POLITIQUE 1: Les explorateurs peuvent voir leur propre progression
-- (via leur explorer_uuid stocké comme TEXT dans user_id)
CREATE POLICY "Anyone can view progress by user_id" 
ON explorer_progress FOR SELECT USING (true);

-- POLITIQUE 2: N'importe qui peut insérer une progression
-- (car les explorateurs n'ont pas de compte auth, on ne peut pas vérifier auth.uid())
CREATE POLICY "Anyone can insert progress" 
ON explorer_progress FOR INSERT WITH CHECK (true);

-- POLITIQUE 3: N'importe qui peut mettre à jour une progression
CREATE POLICY "Anyone can update progress" 
ON explorer_progress FOR UPDATE USING (true);

-- =====================================================
-- NOTES IMPORTANTES :
-- =====================================================
-- 
-- Pour un système de production, vous devriez :
-- 1. Créer des comptes auth.users pour les explorateurs aussi
-- 2. Ou implémenter un système de tokens/sessions personnalisé
-- 3. Ou ajouter une vérification côté serveur (Supabase Functions)
--
-- Pour l'instant, cette solution permet aux explorateurs de sauvegarder
-- leur progression sans avoir besoin d'un compte auth.
-- =====================================================

