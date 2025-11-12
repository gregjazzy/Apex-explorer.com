-- ========================================
-- SCRIPT DE MIGRATION COMPLET
-- Correction de la table explorer_progress
-- ========================================

-- ÉTAPE 1 : Modifier le type de user_id de UUID à TEXT
-- (Car explorer_uuid est TEXT, pas UUID)

-- D'abord, supprimer la contrainte de clé étrangère
ALTER TABLE explorer_progress 
DROP CONSTRAINT IF EXISTS explorer_progress_user_id_fkey;

-- Ensuite, changer le type de colonne
ALTER TABLE explorer_progress 
ALTER COLUMN user_id TYPE TEXT;

-- ÉTAPE 2 : Ajouter les nouvelles colonnes pour le feedback
ALTER TABLE explorer_progress
ADD COLUMN IF NOT EXISTS response_text TEXT NULL,
ADD COLUMN IF NOT EXISTS mentor_comment TEXT NULL,
ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'SOUMIS' NOT NULL,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1 NOT NULL;

-- ÉTAPE 3 : Supprimer les anciennes politiques RLS (incorrectes)
DROP POLICY IF EXISTS "Explorers can view their own progress" ON explorer_progress;
DROP POLICY IF EXISTS "Explorers can insert/update their own progress" ON explorer_progress;
DROP POLICY IF EXISTS "Explorers can update their own progress" ON explorer_progress;
DROP POLICY IF EXISTS "Mentors can view explorer progress" ON explorer_progress;

-- ÉTAPE 4 : Créer les nouvelles politiques RLS (correctes pour notre modèle hybride)

-- Les explorateurs peuvent voir leur propre progression
CREATE POLICY "Explorers can view their own progress" 
ON explorer_progress FOR SELECT 
USING (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);

-- Les explorateurs peuvent insérer leur propre progression
CREATE POLICY "Explorers can write their own progress"
ON explorer_progress FOR INSERT 
WITH CHECK (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);

-- Les explorateurs peuvent mettre à jour leur propre progression
CREATE POLICY "Explorers can update their own progress"
ON explorer_progress FOR UPDATE 
USING (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);

-- Les mentors peuvent voir la progression de leurs explorateurs
CREATE POLICY "Mentors can view explorer progress"
ON explorer_progress FOR SELECT 
USING (
    user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = auth.uid()::TEXT
    )
);

-- Les mentors peuvent mettre à jour les commentaires et statuts de leurs explorateurs
CREATE POLICY "Mentors can update explorer progress"
ON explorer_progress FOR UPDATE 
USING (
    user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = auth.uid()::TEXT
    )
);

-- ÉTAPE 5 : Ajouter des commentaires pour documentation
COMMENT ON COLUMN explorer_progress.response_text IS 'La réponse de l''explorateur au défi';
COMMENT ON COLUMN explorer_progress.mentor_comment IS 'Le commentaire du mentor suite à l''évaluation';
COMMENT ON COLUMN explorer_progress.evaluation_status IS 'SOUMIS | REVISION_DEMANDEE | VALIDE | COMPLETION_IMMEDIATE';
COMMENT ON COLUMN explorer_progress.attempt_count IS 'Nombre de tentatives pour ce défi';

-- ÉTAPE 6 : Créer un index pour améliorer les performances des requêtes mentor
CREATE INDEX IF NOT EXISTS idx_evaluation_status ON explorer_progress(evaluation_status);
CREATE INDEX IF NOT EXISTS idx_mentor_view ON explorer_progress(user_id, evaluation_status);

-- ========================================
-- FIN DU SCRIPT DE MIGRATION
-- ========================================

-- VÉRIFICATION : Exécuter ces requêtes pour vérifier
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'explorer_progress';
-- SELECT * FROM pg_policies WHERE tablename = 'explorer_progress';

