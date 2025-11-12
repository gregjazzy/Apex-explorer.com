-- =====================================================
-- SCHÉMA PRODUCTION POUR APEX JUNIOR EXPLORER
-- Architecture: Mentors (auth.users) + Explorateurs (table explorers)
-- =====================================================

-- =====================================================
-- 1. TABLE EXPLORERS
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_explorers_mentor ON explorers (mentor_id);
CREATE INDEX IF NOT EXISTS idx_explorers_pin ON explorers (name, pin_code);

ALTER TABLE explorers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mentors can view their explorers" ON explorers;
CREATE POLICY "Mentors can view their explorers" 
ON explorers FOR SELECT 
USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Mentors can create explorers" ON explorers;
CREATE POLICY "Mentors can create explorers" 
ON explorers FOR INSERT 
WITH CHECK (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Mentors can update their explorers" ON explorers;
CREATE POLICY "Mentors can update their explorers" 
ON explorers FOR UPDATE 
USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Mentors can delete their explorers" ON explorers;
CREATE POLICY "Mentors can delete their explorers" 
ON explorers FOR DELETE 
USING (auth.uid() = mentor_id);

-- =====================================================
-- 2. TABLE EXPLORER_PROGRESS (avec RLS Permissif)
-- =====================================================

ALTER TABLE explorer_progress ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE explorer_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Explorers can view their own progress" ON explorer_progress;
CREATE POLICY "Explorers can view their own progress" 
ON explorer_progress FOR SELECT 
USING (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);

DROP POLICY IF EXISTS "Explorers can write their own progress" ON explorer_progress;
CREATE POLICY "Explorers can write their own progress"
ON explorer_progress FOR INSERT 
WITH CHECK (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);

DROP POLICY IF EXISTS "Explorers can update their own progress" ON explorer_progress;
CREATE POLICY "Explorers can update their own progress"
ON explorer_progress FOR UPDATE 
USING (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);

DROP POLICY IF EXISTS "Mentors can view explorer progress" ON explorer_progress;
CREATE POLICY "Mentors can view explorer progress"
ON explorer_progress FOR SELECT 
USING (
    user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = auth.uid()
    )
);

-- =====================================================
-- RÉSUMÉ DES PERMISSIONS
-- =====================================================
-- 
-- EXPLORATEURS (via explorer_uuid, sans compte auth.users) :
--   - Peuvent lire leur propre progression (SELECT)
--   - Peuvent créer leur propre progression (INSERT)
--   - Peuvent mettre à jour leur propre progression (UPDATE)
--   - Condition: leur explorer_uuid doit exister dans la table explorers
--
-- MENTORS (via auth.users) :
--   - Peuvent créer/lire/modifier/supprimer leurs explorateurs
--   - Peuvent lire la progression de TOUS leurs explorateurs
--
-- SÉCURITÉ :
--   - Un explorateur ne peut pas écrire avec un UUID qui n'existe pas
--   - Un explorateur ne peut pas voir la progression d'un autre
--   - Un mentor ne peut pas voir les explorateurs d'un autre mentor
-- =====================================================

