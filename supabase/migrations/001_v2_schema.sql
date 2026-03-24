-- ============================================
-- VibeCoding Gallery v2 Schema Migration
-- ============================================

-- 1. New tables
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (char_length(name) <= 30 AND name = lower(trim(name)))
);

CREATE TABLE IF NOT EXISTS project_tags (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

-- 2. Extend existing tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IS NULL OR category IN ('Game','Dashboard','Landing Page','Portfolio','E-commerce','Utility','Other'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 300);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- 3. RLS policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_read" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON comments FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_read" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_tags_read" ON project_tags FOR SELECT USING (true);
CREATE POLICY "project_tags_insert" ON project_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "project_tags_delete" ON project_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()));

-- 4. Triggers
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET likes_count = likes_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET likes_count = likes_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_likes_count ON likes;
CREATE TRIGGER trigger_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 5. RPC
CREATE OR REPLACE FUNCTION increment_view(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects SET views_count = views_count + 1 WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments (project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_projects_popular ON projects (created_at DESC, likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON project_tags (tag_id);
