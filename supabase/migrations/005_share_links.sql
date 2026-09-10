-- Read-only schedule share links.
--
-- Security model:
--   * share_links rows are owner-only under RLS (create / list / revoke).
--   * Viewers never touch items/tags/rules/overrides directly — those tables
--     stay fully locked by their existing owner-only policies.
--   * The ONLY public entry point is get_shared_schedule(token): a
--     SECURITY DEFINER function that resolves the token to its owner and
--     returns that owner's schedule (full details, minus user ids). Invalid,
--     revoked, and nonexistent tokens all return NULL — indistinguishable.
--   * Tokens are 192-bit random (generated client-side, url-safe base64),
--     enforced to be ≥ 20 chars, and unique.

create table share_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique check (length(token) >= 20),
  label text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index share_links_user_id_idx on share_links(user_id);

alter table share_links enable row level security;

create policy "share_links: user owns" on share_links for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function get_shared_schedule(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user uuid;
  v_label text;
begin
  select user_id, label into v_user, v_label
    from share_links
   where token = p_token
     and revoked_at is null;

  if v_user is null then
    return null;
  end if;

  return jsonb_build_object(
    'label', v_label,
    'items', (
      select coalesce(jsonb_agg(to_jsonb(i) - 'user_id'), '[]'::jsonb)
        from items i where i.user_id = v_user
    ),
    'tags', (
      select coalesce(jsonb_agg(to_jsonb(t) - 'user_id'), '[]'::jsonb)
        from tags t where t.user_id = v_user
    ),
    'rules', (
      select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
        from recurrence_rules r
        join items i on i.id = r.item_id
       where i.user_id = v_user
    ),
    'overrides', (
      select coalesce(jsonb_agg(to_jsonb(o)), '[]'::jsonb)
        from instance_overrides o
        join items i on i.id = o.item_id
       where i.user_id = v_user
    )
  );
end;
$$;

-- Lock the function down to exactly the callers we intend
revoke all on function get_shared_schedule(text) from public;
grant execute on function get_shared_schedule(text) to anon, authenticated;
