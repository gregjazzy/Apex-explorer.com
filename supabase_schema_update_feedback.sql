-- Prompt 23 : Ajout des colonnes pour le cycle de feedback Mentor-Explorateur
-- Ce script ajoute les colonnes nécessaires pour enregistrer les réponses des explorateurs
-- et permettre au mentor de valider/demander des révisions

-- AJOUTER LE TEXTE DE RÉPONSE, LES COMMENTAIRES DU MENTOR, LE STATUT ET LE COMPTEUR
ALTER TABLE explorer_progress
ADD COLUMN IF NOT EXISTS response_text TEXT NULL,
ADD COLUMN IF NOT EXISTS mentor_comment TEXT NULL,
ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'SOUMIS' NOT NULL, 
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1 NOT NULL;

-- Commentaires pour la documentation
COMMENT ON COLUMN explorer_progress.response_text IS 'La réponse de l''explorateur au défi';
COMMENT ON COLUMN explorer_progress.mentor_comment IS 'Le commentaire du mentor suite à l''évaluation';
COMMENT ON COLUMN explorer_progress.evaluation_status IS 'SOUMIS | REVISION_DEMANDEE | VALIDE | COMPLETION_IMMEDIATE';
COMMENT ON COLUMN explorer_progress.attempt_count IS 'Nombre de tentatives pour ce défi';

-- Note: Les politiques RLS existantes fonctionnent avec ces nouvelles colonnes
-- car elles se basent sur user_id qui correspond à explorer_uuid

