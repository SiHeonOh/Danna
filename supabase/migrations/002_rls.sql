alter table tags enable row level security;
alter table items enable row level security;
alter table recurrence_rules enable row level security;
alter table instance_overrides enable row level security;

create policy "tags: user owns" on tags for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "items: user owns" on items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rules: user owns via item" on recurrence_rules for all
  using (exists (
    select 1 from items where items.id = recurrence_rules.item_id
      and items.user_id = auth.uid()
  ));

create policy "overrides: user owns via item" on instance_overrides for all
  using (exists (
    select 1 from items where items.id = instance_overrides.item_id
      and items.user_id = auth.uid()
  ));
