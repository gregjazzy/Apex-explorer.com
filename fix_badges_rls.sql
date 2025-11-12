-- Correction des RLS pour earned_badges et user_streaks
-- Les explorateurs utilisent un système custom (PIN), pas JWT Supabase

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Explorateurs peuvent lire leurs badges" ON public.earned_badges;
DROP POLICY IF EXISTS "Explorateurs peuvent gagner des badges" ON public.earned_badges;
DROP POLICY IF EXISTS "Mentors peuvent voir badges de leurs explorateurs" ON public.earned_badges;
DROP POLICY IF EXISTS "Explorateurs peuvent lire leur streak" ON public.user_streaks;
DROP POLICY IF EXISTS "Explorateurs peuvent mettre à jour leur streak" ON public.user_streaks;
DROP POLICY IF EXISTS "Mentors peuvent voir streaks de leurs explorateurs" ON public.user_streaks;

-- Nouvelles policies PERMISSIVES pour earned_badges
CREATE POLICY "Tous peuvent lire earned_badges"
    ON public.earned_badges FOR SELECT
    USING (true);

CREATE POLICY "Tous peuvent insérer earned_badges"
    ON public.earned_badges FOR INSERT
    WITH CHECK (true);

-- Nouvelles policies PERMISSIVES pour user_streaks
CREATE POLICY "Tous peuvent lire user_streaks"
    ON public.user_streaks FOR SELECT
    USING (true);

CREATE POLICY "Tous peuvent gérer user_streaks"
    ON public.user_streaks FOR ALL
    USING (true)
    WITH CHECK (true);

