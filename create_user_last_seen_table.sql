CREATE TABLE IF NOT EXISTS public.user_last_seen (
    user_id UUID NOT NULL,
    section TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, section)
);

CREATE INDEX IF NOT EXISTS idx_user_last_seen_user_id ON public.user_last_seen(user_id);
CREATE INDEX IF NOT EXISTS idx_user_last_seen_section ON public.user_last_seen(section);

ALTER TABLE public.user_last_seen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateurs peuvent lire leur last_seen" ON public.user_last_seen;
DROP POLICY IF EXISTS "Utilisateurs peuvent créer leur last_seen" ON public.user_last_seen;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur last_seen" ON public.user_last_seen;

CREATE POLICY "Utilisateurs peuvent lire leur last_seen"
    ON public.user_last_seen
    FOR SELECT
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Utilisateurs peuvent créer leur last_seen"
    ON public.user_last_seen
    FOR INSERT
    WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Utilisateurs peuvent modifier leur last_seen"
    ON public.user_last_seen
    FOR UPDATE
    USING (user_id::text = auth.uid()::text);
