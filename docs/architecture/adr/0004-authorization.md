# ADR-0004 — Autorização (RBAC baseado em permissões)

**Status:** Aceito · **Reversibilidade:** média

## Contexto
Papéis iniciais (Proprietário, Admin, Gerente, Vendedor, Estoquista, Financeiro, Consulta), mas o sistema não deve ficar preso a eles. Precisamos separar autorização de entitlements. Detalhes em `../Authorization.md` e `../Entitlements.md`.

## Problema
Como autorizar ações de forma granular, evoluir para papéis personalizados e não espalhar `if role ==` pelo código?

## Alternativas
- **A. RBAC com papéis como conjuntos de permissões granulares** (checagem por permissão).
- **B. RBAC "duro"** (checagem por nome de papel no código).
- **C. ABAC** (baseado em atributos) completo.

## Decisão
**(A) RBAC baseado em permissões:** papéis são presets de permissões (`recurso.acao`); o código verifica **permissão**, nunca nome de papel. Autorização e entitlement são checagens **independentes e combinadas**.

## Justificativa
(B) engessa e espalha condicionais — muda um papel e quebra o código. (C) ABAC completo é complexo demais para agora (AP6). (A) dá granularidade, permite papéis personalizados futuros só recombinando permissões, e mantém a evolução aditiva.

## Consequências positivas
- Papéis personalizados sem mudar código.
- Segregação de funções e permissões sensíveis viáveis.
- Separação limpa de entitlements.

## Consequências negativas
- Mais permissões para gerenciar que RBAC duro.
- Requer catálogo de permissões bem mantido.

## Riscos
Escalada de privilégio (mitigada por papéis no banco, revalidação, auditoria). Explosão de permissões (mitigada por bom design do catálogo).

## Gatilhos de revisão
- Demanda por papéis personalizados por cliente.
- Necessidade de regras baseadas em atributos (migração parcial a ABAC).
- Necessidade de SoD formal / aprovação de duas pessoas.
