-- Sprint 022 — Price Engine: priority + description on price_list.
-- Currency remain allowlisted (BRL today); check rewritten for additive expansion.

alter table public.price_list
  drop constraint if exists price_list_currency_check;

alter table public.price_list
  add constraint price_list_currency_chk
  check (currency in ('BRL'));

alter table public.price_list
  add column if not exists priority integer not null default 0
    check (priority >= 0 and priority <= 1000);

alter table public.price_list
  add column if not exists description text
    check (
      description is null
      or (
        char_length(trim(description)) >= 1
        and char_length(description) <= 500
      )
    );

create index if not exists price_list_org_priority_idx
  on public.price_list (organization_id, priority desc, name);

comment on column public.price_list.priority is
  'Resolution priority among active lists (higher wins). Default list still preferred when resolving without explicit list.';

comment on column public.price_list.description is
  'Optional human description for the price list.';
