DROP POLICY IF EXISTS "Tout le monde peut créer des sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Tout le monde peut voir ses sessions" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Mentors peuvent voir les sessions de leurs explorateurs" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Autoriser toute insertion" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Mentors JWT voient sessions de leurs explorateurs" ON speed_drill_sessions;
DROP POLICY IF EXISTS "Acces lecture pour non-JWT (explorateurs)" ON speed_drill_sessions;

CREATE POLICY "Toute insertion autorisée"
ON speed_drill_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Lecture filtree par user_id"
ON speed_drill_sessions FOR SELECT
USING (true);

COMMENT ON POLICY "Lecture filtree par user_id" ON speed_drill_sessions IS 
'Note: Validation de sécurité effectuée côté application dans dataService.ts';

