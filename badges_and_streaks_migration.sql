-- Migration pour Système de Badges Sophistiqués et Streaks
-- Date: 12 Novembre 2025

-- =====================================================
-- Table: earned_badges
-- =====================================================
CREATE TABLE IF NOT EXISTS public.earned_badges (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- explorer_uuid
    badge_id TEXT NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id) -- Un badge ne peut être gagné qu'une fois
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_earned_badges_user ON public.earned_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_earned_badges_badge ON public.earned_badges(badge_id);

-- RLS pour earned_badges
ALTER TABLE public.earned_badges ENABLE ROW LEVEL SECURITY;

-- Les explorateurs peuvent lire leurs propres badges
CREATE POLICY "Explorateurs peuvent lire leurs badges"
    ON public.earned_badges
    FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Les explorateurs peuvent insérer leurs propres badges (via app)
CREATE POLICY "Explorateurs peuvent gagner des badges"
    ON public.earned_badges
    FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Les mentors peuvent voir les badges de leurs explorateurs
CREATE POLICY "Mentors peuvent voir badges de leurs explorateurs"
    ON public.earned_badges
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.explorers e
            WHERE e.explorer_uuid = earned_badges.user_id
            AND e.mentor_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
        )
    );

-- =====================================================
-- Table: user_streaks (Jours consécutifs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- explorer_uuid
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON public.user_streaks(user_id);

-- RLS pour user_streaks
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Les explorateurs peuvent lire leur propre streak
CREATE POLICY "Explorateurs peuvent lire leur streak"
    ON public.user_streaks
    FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Les explorateurs peuvent mettre à jour leur streak
CREATE POLICY "Explorateurs peuvent mettre à jour leur streak"
    ON public.user_streaks
    FOR ALL
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Les mentors peuvent voir les streaks de leurs explorateurs
CREATE POLICY "Mentors peuvent voir streaks de leurs explorateurs"
    ON public.user_streaks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.explorers e
            WHERE e.explorer_uuid = user_streaks.user_id
            AND e.mentor_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
        )
    );

-- =====================================================
-- Fonction: Mettre à jour le streak automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id TEXT)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER) AS $$
DECLARE
    v_last_activity_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Récupérer les données existantes
    SELECT last_activity_date, user_streaks.current_streak, user_streaks.longest_streak
    INTO v_last_activity_date, v_current_streak, v_longest_streak
    FROM public.user_streaks
    WHERE user_id = p_user_id;
    
    -- Si pas de record, créer
    IF NOT FOUND THEN
        INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
        VALUES (p_user_id, 1, 1, v_today);
        
        RETURN QUERY SELECT 1, 1;
        RETURN;
    END IF;
    
    -- Si activité déjà aujourd'hui, ne rien faire
    IF v_last_activity_date = v_today THEN
        RETURN QUERY SELECT v_current_streak, v_longest_streak;
        RETURN;
    END IF;
    
    -- Si activité hier, incrémenter le streak
    IF v_last_activity_date = v_today - INTERVAL '1 day' THEN
        v_current_streak := v_current_streak + 1;
        
        -- Mettre à jour le longest si nécessaire
        IF v_current_streak > v_longest_streak THEN
            v_longest_streak := v_current_streak;
        END IF;
        
        UPDATE public.user_streaks
        SET current_streak = v_current_streak,
            longest_streak = v_longest_streak,
            last_activity_date = v_today,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RETURN QUERY SELECT v_current_streak, v_longest_streak;
        RETURN;
    END IF;
    
    -- Sinon, le streak est cassé, réinitialiser à 1
    UPDATE public.user_streaks
    SET current_streak = 1,
        last_activity_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT 1, v_longest_streak;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Vues utiles pour analytics
-- =====================================================

-- Vue: Badges par utilisateur avec détails
CREATE OR REPLACE VIEW badge_analytics AS
SELECT 
    user_id,
    COUNT(*) as total_badges,
    COUNT(*) FILTER (WHERE earned_at >= CURRENT_DATE - INTERVAL '7 days') as badges_this_week,
    MAX(earned_at) as last_badge_earned
FROM public.earned_badges
GROUP BY user_id;

-- Vue: Top streaks
CREATE OR REPLACE VIEW top_streaks AS
SELECT 
    e.name as explorer_name,
    us.current_streak,
    us.longest_streak,
    us.last_activity_date
FROM public.user_streaks us
JOIN public.explorers e ON e.explorer_uuid = us.user_id
ORDER BY us.current_streak DESC
LIMIT 100;

-- =====================================================
-- Commentaires
-- =====================================================
COMMENT ON TABLE public.earned_badges IS 'Badges débloqués par les explorateurs';
COMMENT ON TABLE public.user_streaks IS 'Suivi des jours consécutifs d''activité des explorateurs';
COMMENT ON FUNCTION update_user_streak IS 'Fonction pour mettre à jour automatiquement le streak d''un utilisateur';

