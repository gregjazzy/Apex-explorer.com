-- Table pour sauvegarder les sessions Speed Drills
CREATE TABLE IF NOT EXISTS speed_drill_sessions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    accuracy FLOAT NOT NULL,
    time_seconds INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_speed_drill_user ON speed_drill_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_speed_drill_created_at ON speed_drill_sessions(created_at);

-- RLS (Row Level Security) : Les explorateurs peuvent voir leurs propres sessions
ALTER TABLE speed_drill_sessions ENABLE ROW LEVEL SECURITY;

-- Politique : L'explorateur peut voir et insérer ses propres sessions
CREATE POLICY "Explorateurs peuvent voir leurs sessions"
ON speed_drill_sessions FOR SELECT
USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Explorateurs peuvent créer leurs sessions"
ON speed_drill_sessions FOR INSERT
WITH CHECK (user_id = current_setting('request.jwt.claim.sub', true));

-- Politique : Les mentors peuvent voir les sessions de leurs explorateurs
CREATE POLICY "Mentors peuvent voir les sessions de leurs explorateurs"
ON speed_drill_sessions FOR SELECT
USING (
    user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = auth.uid()
    )
);

