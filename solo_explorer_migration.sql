-- =====================================================
-- MIGRATION: Mode Explorateur Autonome
-- Date: 12 Novembre 2025
-- Description: Permettre aux explorateurs de créer un compte sans mentor
-- =====================================================

-- 1. Modifier la colonne mentor_id pour la rendre nullable
ALTER TABLE explorers 
ALTER COLUMN mentor_id DROP NOT NULL;

-- 2. Ajouter une colonne pour indiquer le mode
ALTER TABLE explorers 
ADD COLUMN IF NOT EXISTS is_solo BOOLEAN DEFAULT false;

-- 3. Mettre à jour les explorateurs existants
UPDATE explorers 
SET is_solo = false 
WHERE mentor_id IS NOT NULL;

-- 4. Mettre à jour les politiques RLS pour autoriser les explorateurs solo

-- Politique SELECT : Les explorateurs peuvent voir leur propre profil
DROP POLICY IF EXISTS "Explorateurs solo peuvent voir leur profil" ON explorers;
CREATE POLICY "Explorateurs solo peuvent voir leur profil"
ON explorers FOR SELECT
USING (
  mentor_id IS NULL OR auth.uid() = mentor_id
);

-- Politique INSERT : Permettre la création d'explorateurs solo
DROP POLICY IF EXISTS "Tout le monde peut créer un explorateur solo" ON explorers;
CREATE POLICY "Tout le monde peut créer un explorateur solo"
ON explorers FOR INSERT
WITH CHECK (
  mentor_id IS NULL OR auth.uid() = mentor_id
);

-- Politique UPDATE : Les explorateurs peuvent mettre à jour leur propre profil
DROP POLICY IF EXISTS "Explorateurs peuvent se mettre à jour" ON explorers;
CREATE POLICY "Explorateurs peuvent se mettre à jour"
ON explorers FOR UPDATE
USING (
  mentor_id IS NULL OR auth.uid() = mentor_id
);

-- 5. Créer un index pour optimiser les requêtes sur is_solo
CREATE INDEX IF NOT EXISTS idx_explorers_solo ON explorers (is_solo);

-- 6. Commentaires pour documentation
COMMENT ON COLUMN explorers.mentor_id IS 'UUID du mentor (NULL si explorateur autonome)';
COMMENT ON COLUMN explorers.is_solo IS 'true si explorateur sans mentor, false si supervisé';

-- =====================================================
-- NOTES:
-- =====================================================
-- 
-- Mode Solo:
-- - mentor_id = NULL
-- - is_solo = true
-- - Les défis texte sont auto-validés
-- - Option "Inviter un mentor" disponible dans le dashboard
--
-- Mode Supervisé:
-- - mentor_id = UUID du mentor
-- - is_solo = false
-- - Cycle de feedback mentor actif
--
-- Migration des explorateurs existants:
-- - Tous les explorateurs existants restent en mode supervisé
-- - Les nouveaux peuvent choisir solo ou supervisé
--
-- =====================================================

