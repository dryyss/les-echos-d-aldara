-- Les Échos d'Aldara : sauvegardes en ligne.
-- À exécuter dans l'éditeur SQL de Supabase (voir docs/technique/supabase.md).
--
-- Une ligne par utilisateur et par emplacement :
--   slot 0      = sauvegarde automatique
--   slots 1 à 3 = emplacements manuels
-- Les utilisateurs anonymes (mode invité en ligne) ont aussi une ligne dans auth.users,
-- donc les mêmes règles s'appliquent à eux.

create table if not exists public.saves (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  slot         integer     not null check (slot between 0 and 3),
  data         jsonb       not null,
  save_version integer     not null default 1,
  summary      jsonb       not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, slot)
);

comment on table public.saves is
  'Sauvegardes des joueurs. slot 0 = automatique, 1 à 3 = manuelles. data = GameStateData, summary = SaveSummary.';

-- Index : liste des sauvegardes d''un joueur, la plus récente d''abord.
create index if not exists saves_user_id_idx on public.saves (user_id);
create index if not exists saves_user_updated_idx on public.saves (user_id, updated_at desc);

-- updated_at mis à jour automatiquement à chaque modification.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saves_set_updated_at on public.saves;
create trigger saves_set_updated_at
  before update on public.saves
  for each row
  execute function public.set_updated_at();

-- Sécurité : chaque utilisateur ne lit et n''écrit que ses propres lignes.
alter table public.saves enable row level security;

drop policy if exists "saves_select_own" on public.saves;
create policy "saves_select_own"
  on public.saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "saves_insert_own" on public.saves;
create policy "saves_insert_own"
  on public.saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "saves_update_own" on public.saves;
create policy "saves_update_own"
  on public.saves
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "saves_delete_own" on public.saves;
create policy "saves_delete_own"
  on public.saves
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Les visiteurs non connectés (rôle anon) n''ont aucun accès : aucune politique pour eux.
revoke all on public.saves from anon;
grant select, insert, update, delete on public.saves to authenticated;
