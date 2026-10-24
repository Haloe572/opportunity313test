
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- First account ever created becomes admin; all others are regular users.
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created_role after insert on auth.users
  for each row execute function public.handle_new_user_role();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null default '',
  category text not null default 'scholarship',
  description text not null default '',
  min_age int,
  max_age int,
  eligible_areas text[] not null default '{}',
  education_levels text[] not null default '{}',
  tags text[] not null default '{}',
  deadline date,
  application_status text not null default 'unknown',
  official_url text,
  notes text,
  prep_tips text,
  image_url text,
  last_verified date,
  published boolean not null default false,
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.opportunities to anon;
grant select, insert, update, delete on public.opportunities to authenticated;
grant all on public.opportunities to service_role;
alter table public.opportunities enable row level security;
create policy "Anyone reads published" on public.opportunities for select to anon, authenticated
  using (published = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert" on public.opportunities for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update" on public.opportunities for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete" on public.opportunities for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create trigger opp_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();

create table public.student_profiles (
  user_id uuid primary key,
  display_name text,
  age int,
  city text,
  zip text,
  education_level text,
  interests text[] not null default '{}',
  goals text[] not null default '{}',
  goals_note text,
  opportunity_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.student_profiles to authenticated;
grant all on public.student_profiles to service_role;
alter table public.student_profiles enable row level security;
create policy "Own profile select" on public.student_profiles for select to authenticated using (user_id = auth.uid());
create policy "Own profile insert" on public.student_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "Own profile update" on public.student_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own profile delete" on public.student_profiles for delete to authenticated using (user_id = auth.uid());
create trigger prof_touch before update on public.student_profiles
  for each row execute function public.touch_updated_at();

create table public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null default 'saved',
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);
grant select, insert, update, delete on public.saved_opportunities to authenticated;
grant all on public.saved_opportunities to service_role;
alter table public.saved_opportunities enable row level security;
create policy "Own saved all" on public.saved_opportunities for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.opportunity_views (
  user_id uuid not null,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);
grant select, insert, update, delete on public.opportunity_views to authenticated;
grant all on public.opportunity_views to service_role;
alter table public.opportunity_views enable row level security;
create policy "Own views all" on public.opportunity_views for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.opportunities (title, organization, category, description, min_age, max_age, eligible_areas, education_levels, tags, application_status, notes, published, is_placeholder)
values
('[PLACEHOLDER] Sample Scholarship', '[PLACEHOLDER] Replace with real organization', 'scholarship', 'Placeholder record for testing layout only. Not a real opportunity — edit or delete in the admin portal.', 14, 24, '{Detroit}', '{high_school,college}', '{technology,education}', 'unknown', 'Placeholder. Needs verification.', true, true),
('[PLACEHOLDER] Sample Internship', '[PLACEHOLDER] Replace with real organization', 'internship', 'Placeholder record for testing layout only. Not a real opportunity — edit or delete in the admin portal.', 16, 24, '{}', '{}', '{business,technology}', 'unknown', 'Placeholder. Needs verification.', true, true);
