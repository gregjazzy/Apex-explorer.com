DROP POLICY IF EXISTS "Tout le monde peut créer des sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Tout le monde peut voir ses sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Mentors peuvent voir les sessions de leurs explorateurs" ON speed_drill_sessions;

CREATE POLICY "Autoriser toute insertion"
ON speed_drill_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Mentors JWT voient sessions de leurs explorateurs"
ON speed_drill_sessions FOR SELECT
USING (
    auth.uid() IS NOT NULL 
    AND user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = auth.uid()
    )
);

CREATE POLICY "Acces lecture pour non-JWT (explorateurs)"
ON speed_drill_sessions FOR SELECT
USING (auth.uid() IS NULL);

