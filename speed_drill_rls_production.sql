DROP POLICY IF EXISTS "Tout le monde peut créer des sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Tout le monde peut voir ses sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Mentors peuvent voir les sessions de leurs explorateurs" ON speed_drill_sessions;

CREATE POLICY "Utilisateurs peuvent créer leurs sessions"
ON speed_drill_sessions FOR INSERT
WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Utilisateurs voient leurs propres sessions"
ON speed_drill_sessions FOR SELECT
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Mentors voient sessions de leurs explorateurs"
ON speed_drill_sessions FOR SELECT
USING (
    user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
    )
);

