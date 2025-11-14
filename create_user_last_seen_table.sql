-- Table pour tracker la dernière visite de l'utilisateur dans différentes sections
-- Permet d'afficher uniquement les nouveaux éléments dans les badges notification

CREATE TABLE IF NOT EXISTS public.user_last_seen (
    user_id UUID NOT NULL,
    section TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, section),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_last_seen_user_id ON public.user_last_seen(user_id);
CREATE INDEX IF NOT EXISTS idx_user_last_seen_section ON public.user_last_seen(section);

-- RLS Policies
ALTER TABLE public.user_last_seen ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent lire leurs propres timestamps
CREATE POLICY "Utilisateurs peuvent lire leur last_seen"
    ON public.user_last_seen
    FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Les utilisateurs peuvent insérer leurs propres timestamps
CREATE POLICY "Utilisateurs peuvent créer leur last_seen"
    ON public.user_last_seen
    FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Les utilisateurs peuvent modifier leurs propres timestamps
CREATE POLICY "Utilisateurs peuvent modifier leur last_seen"
    ON public.user_last_seen
    FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Commentaires
COMMENT ON TABLE public.user_last_seen IS 'Stocke la dernière visite de l''utilisateur dans différentes sections pour afficher les nouveaux éléments';
COMMENT ON COLUMN public.user_last_seen.user_id IS 'ID de l''utilisateur (référence auth.users)';
COMMENT ON COLUMN public.user_last_seen.section IS 'Section visitée: badges, hall_of_fame, speed_drill_stats';
COMMENT ON COLUMN public.user_last_seen.last_seen_at IS 'Timestamp de la dernière visite';

