-- Création de la table pour suivre la progression des explorateurs
CREATE TABLE explorer_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    module_id TEXT NOT NULL,
    defi_id TEXT NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL, -- 'completed' | 'submitted' | 'failed'
    xp_earned INTEGER DEFAULT 0 NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Empêcher les doublons pour un même défi complété par un utilisateur
    UNIQUE (user_id, module_id, defi_id)
);

-- Active la sécurité au niveau des lignes (Row Level Security)
ALTER TABLE explorer_progress ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne peuvent voir que leur propre progression
CREATE POLICY "Explorers can view their own progress" 
ON explorer_progress FOR SELECT USING (auth.uid() = user_id);

-- Les explorateurs peuvent insérer/mettre à jour leur progression (pas les autres)
CREATE POLICY "Explorers can insert/update their own progress" 
ON explorer_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Explorers can update their own progress" 
ON explorer_progress FOR UPDATE USING (auth.uid() = user_id);

-- Optionnel: Créer un index
CREATE INDEX idx_user_defi ON explorer_progress (user_id, module_id, defi_id);

