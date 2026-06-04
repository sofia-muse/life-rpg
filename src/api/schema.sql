-- Life RPG — Supabase SQL Schema Reference
-- Run this in Supabase SQL Editor when ready to set up backend

-- Heroes table
CREATE TABLE heroes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_seed TEXT,
  stats JSONB NOT NULL DEFAULT '{}',
  stat_xp JSONB NOT NULL DEFAULT '{}',
  hero_level INT DEFAULT 1,
  class_name TEXT DEFAULT 'Apprentice',
  class_tier INT DEFAULT 1,
  dominant_stat TEXT DEFAULT 'strength',
  total_quests_completed INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  rest_days_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quests table
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id UUID REFERENCES heroes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'side', 'boss')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
  stat TEXT NOT NULL,
  xp_reward INT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  days_completed INT DEFAULT 0,
  total_steps INT,
  completed_steps INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quest completions log
CREATE TABLE quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  hero_id UUID REFERENCES heroes(id) ON DELETE CASCADE,
  xp_gained INT NOT NULL,
  stat TEXT NOT NULL,
  streak_multiplier NUMERIC(3,2) DEFAULT 1.0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unlocked skills
CREATE TABLE unlocked_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id UUID REFERENCES heroes(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hero_id, skill_id)
);

-- Journal entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id UUID REFERENCES heroes(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  narrative TEXT,
  quests_completed TEXT[] DEFAULT '{}',
  xp_gained JSONB DEFAULT '{}',
  levels_gained TEXT[] DEFAULT '{}',
  skills_unlocked TEXT[] DEFAULT '{}',
  milestones TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own hero" ON heroes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own quests" ON quests
  FOR ALL USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own completions" ON quest_completions
  FOR ALL USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own skills" ON unlocked_skills
  FOR ALL USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own journal" ON journal_entries
  FOR ALL USING (hero_id IN (SELECT id FROM heroes WHERE user_id = auth.uid()));
