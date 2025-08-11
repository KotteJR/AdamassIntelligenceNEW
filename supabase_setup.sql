-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analyses table
CREATE TABLE IF NOT EXISTS user_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  job_id TEXT NOT NULL UNIQUE,
  company_alias TEXT,
  legal_alias TEXT,
  website_url TEXT,
  country_of_incorporation TEXT,
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_analyses
CREATE POLICY "Users can view their own analyses" ON user_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON user_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON user_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for featured analyses (all analyses visible)
CREATE POLICY "Public can view all analyses for featured section" ON user_analyses
  FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_job_id ON user_analyses(job_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_created_at ON user_analyses(created_at DESC);

-- Generated artifacts per user and analysis
CREATE TABLE IF NOT EXISTS user_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('audio_overview','audio_report','podcast','mindmap')),
  meta JSONB,             -- e.g., script, projectId
  content JSONB,          -- mindmap JSON or other structured content
  audio_base64 TEXT,      -- optionally store audio (base64) if small
  audio_url TEXT,         -- blob/object URL or external link
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their artifacts" ON user_artifacts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_artifacts_user ON user_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_artifacts_job ON user_artifacts(job_id);
CREATE INDEX IF NOT EXISTS idx_user_artifacts_kind ON user_artifacts(kind);