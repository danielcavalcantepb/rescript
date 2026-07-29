-- Owners and admins are operationally equivalent to a full-access role for
-- Foundation policies. Without this explicit branch, RLS hides the default
-- branch from the organization owner and customer scope validation rejects
-- otherwise valid customer inserts.
create or replace function public.fundamental_has_permission(
  p_org uuid,
  p_permission text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select role into v_role
  from public.membership
  where organization_id = p_org
    and user_id = auth.uid()
    and status = 'active';

  if v_role in ('owner', 'admin') then
    return true;
  end if;

  if p_permission in ('branches.read', 'payment_terms.read', 'inventory.policy.read') then
    return v_role in ('manager', 'seller', 'inventory', 'finance', 'viewer');
  end if;

  if p_permission in ('branches.manage', 'payment_terms.manage', 'inventory.policy.manage') then
    return v_role = 'manager';
  end if;

  return false;
end;
$$;
