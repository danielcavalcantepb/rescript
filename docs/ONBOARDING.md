---
Status: Active
Owner: Product Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: onboarding / first login
Supersedes: screens/Onboarding.md
Superseded-By: None
Related-Modules: Checkout, Provisioning, Organization, Sales, Catalog, Inventory
---

# Onboarding

## Aggregate raiz da jornada pública

O ciclo pré-operacional usa `OnboardingSession`, não `Customer`. A sessão organiza conta, consentimentos, perfil do negócio, identidade empresarial, plano, pagamento e provisionamento antes da criação da operação ERP. `current_step` é somente navegação; `state` é a autoridade de lifecycle. As RPCs públicas continuam sob o prefixo `cap_*` para preservar o contrato do módulo.

Onboarding conduz o owner da empresa criada até o primeiro valor operacional.

## Workspace inicial

Após o checkout, o provisionamento cria:

- organização ativa;
- owner ativo;
- assinatura inicial;
- local de estoque padrão;
- checklist de onboarding.

## Checklist canônico

- cadastrar cliente;
- cadastrar produto;
- configurar estoque inicial;
- registrar primeira venda.

## UX

Onboarding deve parecer continuação natural do checkout. Ele não deve expor configurações avançadas, fiscal, cobrança ou módulos futuros antes do usuário atingir o primeiro resultado.
