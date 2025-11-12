DROP POLICY IF EXISTS "Tout le monde peut créer des sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Tout le monde peut voir ses sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Mentors peuvent voir les sessions de leurs explorateurs" ON speed_drill_sessions;

CREATE POLICY "Autoriser insertion de sessions"
ON speed_drill_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Autoriser lecture de sessions"
ON speed_drill_sessions FOR SELECT
USING (true);

