-- Fix RLS pour Hall of Fame Leaderboards
-- Date: 13 Novembre 2025
-- Permet la lecture publique des streaks et XP pour les classements

-- =====================================================
-- Policy: Lecture publique des streaks pour leaderboard
-- =====================================================

DROP POLICY IF EXISTS "Explorateurs peuvent lire leur streak" ON public.user_streaks;

CREATE POLICY "Public peut lire streaks pour leaderboard"
    ON public.user_streaks
    FOR SELECT
    USING (true);

CREATE POLICY "Explorateurs peuvent modifier leur streak"
    ON public.user_streaks
    FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Explorateurs peuvent créer leur streak"
    ON public.user_streaks
    FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================================================
-- Policy: Lecture publique des explorers pour leaderboard
-- =====================================================

DROP POLICY IF EXISTS "Public peut lire profils explorateurs" ON public.explorers;

CREATE POLICY "Public peut lire profils explorateurs"
    ON public.explorers
    FOR SELECT
    USING (true);
