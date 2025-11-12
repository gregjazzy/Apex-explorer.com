DROP POLICY IF EXISTS "Tout le monde peut créer des sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Tout le monde peut voir ses sessions" ON speed_drill_sessions;

CREATE POLICY "Explorateurs peuvent créer leurs propres sessions"
ON speed_drill_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Explorateurs peuvent voir leurs propres sessions"
ON speed_drill_sessions FOR SELECT
USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Mentors peuvent voir les sessions de leurs explorateurs"
ON speed_drill_sessions FOR SELECT
USING (
    user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = auth.uid()
    )
);

