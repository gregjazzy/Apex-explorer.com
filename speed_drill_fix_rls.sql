DROP POLICY IF EXISTS "Explorateurs peuvent créer leurs sessions" ON speed_drill_sessions;

CREATE POLICY "Tout le monde peut créer des sessions"
ON speed_drill_sessions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Explorateurs peuvent voir leurs sessions" ON speed_drill_sessions;

CREATE POLICY "Tout le monde peut voir ses sessions"
ON speed_drill_sessions FOR SELECT
USING (true);

