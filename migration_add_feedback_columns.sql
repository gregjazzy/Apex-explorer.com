-- =====================================================
-- MIGRATION: Ajouter les colonnes pour le système de feedback
-- Date: 2025-01-12
-- =====================================================

-- Ajouter les nouvelles colonnes à explorer_progress
ALTER TABLE explorer_progress 
ADD COLUMN IF NOT EXISTS response_text TEXT,
ADD COLUMN IF NOT EXISTS mentor_comment TEXT,
ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'COMPLETION_IMMEDIATE',
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1;

-- Créer un index pour faciliter les requêtes par statut d'évaluation
CREATE INDEX IF NOT EXISTS idx_evaluation_status ON explorer_progress (evaluation_status);

-- Ajouter une politique RLS pour que les mentors puissent mettre à jour le feedback
DROP POLICY IF EXISTS "Mentors can update explorer progress" ON explorer_progress;
CREATE POLICY "Mentors can update explorer progress"
ON explorer_progress FOR UPDATE 
USING (
    user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = auth.uid()
    )
);

-- =====================================================
-- NOTES:
-- =====================================================
-- 
-- Nouvelles colonnes :
-- - response_text : La réponse textuelle de l'explorateur
-- - mentor_comment : Le commentaire du mentor (validation ou révision)
-- - evaluation_status : 'SOUMIS' | 'REVISION_DEMANDEE' | 'VALIDE' | 'COMPLETION_IMMEDIATE'
-- - attempt_count : Nombre de tentatives de l'explorateur (incrémenté à chaque resoumission)
--
-- Valeurs par défaut :
-- - evaluation_status = 'COMPLETION_IMMEDIATE' pour les défis QCM
-- - attempt_count = 1 pour la première tentative
--
-- =====================================================

