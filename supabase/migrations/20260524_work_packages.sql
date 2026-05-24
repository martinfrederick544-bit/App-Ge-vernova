-- ============================================================
-- Migration : work_packages + corrections RLS
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Table work_packages
CREATE TABLE IF NOT EXISTS work_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE work_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wp_select_all"              ON work_packages;
DROP POLICY IF EXISTS "wp_insert_authenticated"    ON work_packages;
DROP POLICY IF EXISTS "wp_delete_creator"          ON work_packages;

CREATE POLICY "wp_select_all"           ON work_packages FOR SELECT USING (true);
CREATE POLICY "wp_insert_authenticated" ON work_packages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "wp_delete_creator"       ON work_packages FOR DELETE  USING (auth.uid() = created_by);

-- 2. Ajouter work_package_id aux dessins
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS work_package_id UUID REFERENCES work_packages(id) ON DELETE SET NULL;

-- 3. S'assurer que tous les rôles voient tous les projets (RLS)
DROP POLICY IF EXISTS "projects_select"             ON projects;
DROP POLICY IF EXISTS "member_projects_select"      ON projects;
DROP POLICY IF EXISTS "all_users_select_projects"   ON projects;

CREATE POLICY "projects_select_all" ON projects FOR SELECT USING (true);

-- 4. S'assurer que tous les rôles voient tous les dessins
DROP POLICY IF EXISTS "member_drawings_select"    ON drawings;
DROP POLICY IF EXISTS "drawings_select"           ON drawings;
DROP POLICY IF EXISTS "all_users_select_drawings" ON drawings;

CREATE POLICY "drawings_select_all" ON drawings FOR SELECT USING (true);

-- 5. S'assurer que tous les rôles voient toutes les révisions
DROP POLICY IF EXISTS "member_revisions_select"    ON revisions;
DROP POLICY IF EXISTS "revisions_select"           ON revisions;
DROP POLICY IF EXISTS "all_users_select_revisions" ON revisions;

CREATE POLICY "revisions_select_all" ON revisions FOR SELECT USING (true);
