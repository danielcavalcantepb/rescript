-- Allow controlled admin wipe of append-only ledger rows (test cleanup / ops).
-- Application clients never set this GUC; production writes remain append-only.

create or replace function public.deny_inventory_ledger_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('inventory.allow_ledger_admin', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'inventory_ledger_immutable' using errcode = '42501';
end;
$$;
