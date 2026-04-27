
-- Fix search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoke execute on SECURITY DEFINER functions from public/auth roles (only triggers need them)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Replace overly broad public storage SELECT with authenticated-only
drop policy if exists "Photos publicly viewable" on storage.objects;
create policy "Photos viewable by authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-photos');
