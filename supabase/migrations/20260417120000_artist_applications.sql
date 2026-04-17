-- Artist applications submitted via the public /for-artists/apply form.
-- Keeps leads in the database instead of relying on email-only capture so
-- the team can triage and convert applicants to vendors systematically.

create table if not exists public.artist_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  name text not null,
  instagram text,
  portfolio_url text,
  bio text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'approved', 'rejected', 'invited')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  notes text
);

create index if not exists artist_applications_email_idx
  on public.artist_applications (lower(email));
create index if not exists artist_applications_status_idx
  on public.artist_applications (status);
create index if not exists artist_applications_created_at_idx
  on public.artist_applications (created_at desc);

-- Keep updated_at current on any change
create or replace function public.touch_artist_applications_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists artist_applications_touch_updated_at on public.artist_applications;
create trigger artist_applications_touch_updated_at
  before update on public.artist_applications
  for each row execute function public.touch_artist_applications_updated_at();

-- Row-level security: public can insert (submitting an application) but only
-- admins can read/update. Anon inserts are safe because the API route is the
-- only writer and it validates payloads.
alter table public.artist_applications enable row level security;

drop policy if exists "Public can submit artist applications" on public.artist_applications;
create policy "Public can submit artist applications"
  on public.artist_applications for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins read artist applications" on public.artist_applications;
create policy "Admins read artist applications"
  on public.artist_applications for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
        and coalesce(ur.is_active, true) = true
    )
  );

drop policy if exists "Admins update artist applications" on public.artist_applications;
create policy "Admins update artist applications"
  on public.artist_applications for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
        and coalesce(ur.is_active, true) = true
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
        and coalesce(ur.is_active, true) = true
    )
  );

comment on table public.artist_applications is
  'Public artist applications captured from /for-artists/apply. Reviewed by admins before becoming vendors.';
