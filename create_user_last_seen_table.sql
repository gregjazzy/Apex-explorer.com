DROP TABLE IF EXISTS public.user_last_seen CASCADE;

CREATE TABLE public.user_last_seen (
    user_id UUID NOT NULL,
    section TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, section)
);

CREATE INDEX idx_user_last_seen_user_id ON public.user_last_seen(user_id);
CREATE INDEX idx_user_last_seen_section ON public.user_last_seen(section);

ALTER TABLE public.user_last_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public peut tout faire sur user_last_seen"
    ON public.user_last_seen
    FOR ALL
    USING (true)
    WITH CHECK (true);
