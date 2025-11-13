-- =====================================================
-- RLS POLICIES POUR LA TABLE earned_badges
-- =====================================================
-- Date: 13 Novembre 2025
-- Objectif: Permettre aux utilisateurs de sauvegarder leurs badges
-- =====================================================

-- 1. ACTIVER RLS sur la table earned_badges
ALTER TABLE earned_badges ENABLE ROW LEVEL SECURITY;

-- 2. POLICY SELECT: Les utilisateurs peuvent voir UNIQUEMENT leurs propres badges
-- Cast explicite: auth.uid()::text pour matcher avec user_id (TEXT)
CREATE POLICY "Users can view their own badges"
  ON earned_badges
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 3. POLICY INSERT: Les utilisateurs peuvent insérer UNIQUEMENT leurs propres badges
CREATE POLICY "Users can insert their own badges"
  ON earned_badges
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 4. POLICY UPDATE: Les utilisateurs peuvent mettre à jour UNIQUEMENT leurs propres badges
CREATE POLICY "Users can update their own badges"
  ON earned_badges
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- 5. POLICY DELETE: Les utilisateurs peuvent supprimer UNIQUEMENT leurs propres badges
CREATE POLICY "Users can delete their own badges"
  ON earned_badges
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- =====================================================
-- VÉRIFICATION (optionnel)
-- =====================================================
-- Pour vérifier que les policies sont bien créées:
-- SELECT * FROM pg_policies WHERE tablename = 'earned_badges';


