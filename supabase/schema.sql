-- ============================================================
-- GE Vernova — Schéma Supabase complet
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('drafter', 'engineer', 'project_manager');
create type revision_status as enum ('pending_review', 'approved', 'returned');

-- ============================================================
-- TABLES
-- ============================================================

-- profiles — miroir de auth.users
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'drafter',
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- projects
create table projects (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now(),
  archived     boolean not null default false
);

-- project_members
create table project_members (
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- drawings (current_revision_id ajouté après la table revisions)
create table drawings (
  id                   uuid primary key default uuid_generate_v4(),
  project_id           uuid not null references projects(id) on delete cascade,
  drawing_number       text not null,
  title                text not null,
  created_by           uuid not null references profiles(id),
  created_at           timestamptz not null default now(),
  current_revision_id  uuid  -- FK ajoutée ci-dessous après revisions
);

-- revisions
create table revisions (
  id               uuid primary key default uuid_generate_v4(),
  drawing_id       uuid not null references drawings(id) on delete cascade,
  revision_number  text not null,
  box_url          text not null,
  uploaded_by      uuid not null references profiles(id),
  uploaded_at      timestamptz not null default now(),
  status           revision_status not null default 'pending_review',
  reviewed_by      uuid references profiles(id),
  reviewed_at      timestamptz,
  review_comment   text,
  -- Un retour exige un commentaire
  constraint returned_requires_comment check (
    status != 'returned' or (review_comment is not null and trim(review_comment) != '')
  ),
  -- Validation de l'URL Box (backup côté DB)
  constraint valid_box_url check (
    box_url like 'https://gehealthcare.box.com/%'
    or box_url like 'https://app.box.com/%'
  )
);

-- FK circulaire drawings → revisions
alter table drawings
  add constraint drawings_current_revision_id_fkey
  foreign key (current_revision_id) references revisions(id) on delete set null;

-- notifications
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null,  -- 'new_revision' | 'approved' | 'returned'
  message     text not null,
  drawing_id  uuid references drawings(id) on delete cascade,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- audit_log (lecture seule pour l'app, insert via service role)
create table audit_log (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id),
  action       text not null,  -- 'submit_revision' | 'approve' | 'return' | 'login'
  drawing_id   uuid references drawings(id),
  revision_id  uuid references revisions(id),
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- INDEX
-- ============================================================

create index idx_project_members_user    on project_members(user_id);
create index idx_project_members_project on project_members(project_id);
create index idx_drawings_project        on drawings(project_id);
create index idx_revisions_drawing       on revisions(drawing_id);
create index idx_revisions_status        on revisions(status);
create index idx_notifications_user      on notifications(user_id, read);
create index idx_audit_log_user          on audit_log(user_id);
create index idx_audit_log_drawing       on audit_log(drawing_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles        enable row level security;
alter table projects        enable row level security;
alter table project_members enable row level security;
alter table drawings        enable row level security;
alter table revisions       enable row level security;
alter table notifications   enable row level security;
alter table audit_log       enable row level security;

-- Helpers
create or replace function get_user_role()
returns user_role
language sql security definer stable
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_project_member(p_project_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists(
    select 1 from project_members
    where project_id = p_project_id and user_id = auth.uid()
  )
$$;

-- ---- profiles ----
create policy "own_profile_select"
  on profiles for select using (id = auth.uid());

create policy "shared_project_profiles_select"
  on profiles for select using (
    exists(
      select 1 from project_members a
      join project_members b on a.project_id = b.project_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
    )
  );

create policy "own_profile_insert"
  on profiles for insert with check (id = auth.uid());

create policy "own_profile_update"
  on profiles for update using (id = auth.uid());

-- ---- projects ----
create policy "member_projects_select"
  on projects for select
  using (is_project_member(id) or created_by = auth.uid());

create policy "authenticated_project_insert"
  on projects for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "creator_project_update"
  on projects for update
  using (created_by = auth.uid());

-- ---- project_members ----
create policy "member_list_select"
  on project_members for select
  using (is_project_member(project_id) or user_id = auth.uid());

create policy "creator_add_members"
  on project_members for insert
  with check (
    exists(select 1 from projects where id = project_id and created_by = auth.uid())
    or user_id = auth.uid()
  );

create policy "creator_remove_members"
  on project_members for delete
  using (
    exists(select 1 from projects where id = project_id and created_by = auth.uid())
  );

-- ---- drawings ----
create policy "member_drawings_select"
  on drawings for select
  using (is_project_member(project_id));

create policy "drafter_drawings_insert"
  on drawings for insert
  with check (
    get_user_role() = 'drafter'
    and created_by = auth.uid()
    and is_project_member(project_id)
  );

create policy "member_drawings_update"
  on drawings for update
  using (is_project_member(project_id));

-- ---- revisions ----
create policy "member_revisions_select"
  on revisions for select
  using (
    exists(
      select 1 from drawings d
      where d.id = drawing_id and is_project_member(d.project_id)
    )
  );

create policy "drafter_revisions_insert"
  on revisions for insert
  with check (
    get_user_role() = 'drafter'
    and uploaded_by = auth.uid()
    and exists(
      select 1 from drawings d
      where d.id = drawing_id and is_project_member(d.project_id)
    )
  );

create policy "engineer_revisions_update"
  on revisions for update
  using (
    get_user_role() = 'engineer'
    and exists(
      select 1 from drawings d
      where d.id = drawing_id and is_project_member(d.project_id)
    )
  );

-- ---- notifications ----
create policy "own_notifications_select"
  on notifications for select using (user_id = auth.uid());

create policy "notifications_insert"
  on notifications for insert with check (auth.uid() is not null);

create policy "own_notifications_update"
  on notifications for update using (user_id = auth.uid());

-- ---- audit_log ----
create policy "authenticated_audit_select"
  on audit_log for select using (auth.uid() is not null);

-- Insert uniquement via service_role (pas de policy INSERT)

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Création automatique du profil après signup
create or replace function handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'drafter')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- REALTIME
-- ============================================================

-- Activer Realtime sur notifications pour le badge live
alter publication supabase_realtime add table notifications;

-- ============================================================
-- FIN DU SCHÉMA
-- ============================================================
