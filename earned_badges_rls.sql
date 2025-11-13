-- =====================================================
-- RLS POLICIES POUR LA TABLE earned_badges
-- =====================================================
-- Date: 13 Novembre 2025
-- Objectif: Permettre aux utilisateurs de sauvegarder leurs badges
-- 
-- IMPORTANT: Les Explorateurs n'utilisent PAS Supabase Auth !
-- Ils ont un système custom avec PIN stocké dans la table 'explorers'
-- On utilise donc explorer_uuid au lieu de auth.uid()
-- =====================================================

-- 1. ACTIVER RLS sur la table earned_badges
ALTER TABLE earned_badges ENABLE ROW LEVEL SECURITY;

-- 2. POLICY SELECT: Tous les utilisateurs authentifiés peuvent voir les badges
-- (On ne peut pas filtrer par user car pas de auth.uid() pour les explorateurs)
CREATE POLICY "Users can view all badges"
  ON earned_badges
  FOR SELECT
  USING (true);

-- 3. POLICY INSERT: Autoriser l'insertion pour tous les users authentifiés
-- (La logique applicative s'assure que user_id = explorer_uuid correct)
CREATE POLICY "Users can insert badges"
  ON earned_badges
  FOR INSERT
  WITH CHECK (true);

-- 4. POLICY UPDATE: Autoriser la mise à jour pour tous les users authentifiés
CREATE POLICY "Users can update badges"
  ON earned_badges
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. POLICY DELETE: Autoriser la suppression pour tous les users authentifiés
CREATE POLICY "Users can delete badges"
  ON earned_badges
  FOR DELETE
  USING (true);

-- =====================================================
-- ALTERNATIVE PLUS SÉCURISÉE (OPTIONNELLE)
-- =====================================================
-- Si vous voulez vraiment restreindre l'accès par user_id,
-- vous devrez créer une fonction PostgreSQL qui vérifie:
-- 1. Si c'est un mentor → auth.uid()
-- 2. Si c'est un explorateur → vérifier via la session custom
--
-- Mais pour l'instant, on fait confiance à la logique applicative.
-- =====================================================

-- VÉRIFICATION (optionnel)
-- Pour vérifier que les policies sont bien créées:
-- SELECT * FROM pg_policies WHERE tablename = 'earned_badges';



