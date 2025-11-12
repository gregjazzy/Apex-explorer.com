ALTER TABLE explorer_progress ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE explorer_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Explorers can view their own progress" ON explorer_progress;
CREATE POLICY "Explorers can view their own progress" 
ON explorer_progress FOR SELECT 
USING (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);
DROP POLICY IF EXISTS "Explorers can write their own progress" ON explorer_progress;
CREATE POLICY "Explorers can write their own progress"
ON explorer_progress FOR INSERT 
WITH CHECK (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);
DROP POLICY IF EXISTS "Explorers can update their own progress" ON explorer_progress;
CREATE POLICY "Explorers can update their own progress"
ON explorer_progress FOR UPDATE 
USING (
    user_id IN (SELECT explorer_uuid::TEXT FROM explorers WHERE is_active = true)
);
DROP POLICY IF EXISTS "Mentors can view explorer progress" ON explorer_progress;
CREATE POLICY "Mentors can view explorer progress"
ON explorer_progress FOR SELECT 
USING (
    user_id IN (
        SELECT explorer_uuid::TEXT 
        FROM explorers 
        WHERE mentor_id = auth.uid()
    )
);

