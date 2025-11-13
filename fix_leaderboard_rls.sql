-- Fix RLS pour Hall of Fame Leaderboards
-- Date: 13 Novembre 2025
-- Permet la lecture publique des streaks et XP pour les classements

-- =====================================================
-- Policy: Lecture publique des streaks pour leaderboard
-- =====================================================

-- Supprimer l'ancienne policy restrictive si elle existe
DROP POLICY IF EXISTS "Explorateurs peuvent lire leur streak" ON public.user_streaks;

-- Nouvelle policy : Tout le monde peut lire les streaks (pour leaderboard)
CREATE POLICY "Public peut lire streaks pour leaderboard"
    ON public.user_streaks
    FOR SELECT
    USING (true);

-- Policy : Les explorateurs peuvent mettre à jour leur propre streak
CREATE POLICY "Explorateurs peuvent modifier leur streak"
    ON public.user_streaks
    FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy : Les explorateurs peuvent insérer leur propre streak
CREATE POLICY "Explorateurs peuvent créer leur streak"
    ON public.user_streaks
    FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================================================
-- Policy: Lecture publique des explorers pour leaderboard
-- =====================================================

-- Note: explorers devrait déjà avoir une policy de lecture publique
-- Si ce n'est pas le cas, décommenter ci-dessous:

-- DROP POLICY IF EXISTS "Public peut lire profils explorateurs" ON public.explorers;

-- CREATE POLICY "Public peut lire profils explorateurs"
--     ON public.explorers
--     FOR SELECT
--     USING (true);

-- =====================================================
-- Vérification
-- =====================================================

-- Tester que la lecture fonctionne (à exécuter après avoir appliqué)
-- SELECT user_id, longest_streak, current_streak 
-- FROM public.user_streaks 
-- ORDER BY longest_streak DESC 
-- LIMIT 10;


