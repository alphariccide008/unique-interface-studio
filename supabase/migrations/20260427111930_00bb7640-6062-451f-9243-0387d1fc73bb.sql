
-- Enums
create type public.gender_type as enum ('woman', 'man', 'nonbinary', 'other');
create type public.looking_for_type as enum ('women', 'men', 'everyone');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  date_of_birth date,
  bio text,
  gender public.gender_type,
  looking_for public.looking_for_type,
  city text,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users delete their own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- Profile photos
create table public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, position)
);

alter table public.profile_photos enable row level security;

create policy "Photos viewable by authenticated users"
  on public.profile_photos for select
  to authenticated
  using (true);

create policy "Users insert own photos"
  on public.profile_photos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own photos"
  on public.profile_photos for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users delete own photos"
  on public.profile_photos for delete
  to authenticated
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create empty profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "Photos publicly viewable"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

create policy "Users upload own photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
