# ADR-0003 — Multi-Tenancy (RLS + organization_id)

**Status:** Aceito · **Reversibilidade:** BAIXA (cara de mudar) — decisão estrutural

## Contexto
SaaS B2B com muitas empresas na mesma base. Uma pessoa pode participar de várias empresas; cada empresa tem vários usuários. Isolamento é requisito de segurança inegociável. Detalhes em `../MultiTenancy.md`.

## Problema
Como isolar dados de milhares de tenants com segurança forte, custo baixo e sem reescrever ao escalar?

## Alternativas
- **A. Banco/schema compartilhado + `organization_id` + RLS.**
- **B. Schema por tenant.**
- **C. Banco por tenant.**
- **D. Isolamento só na aplicação (sem RLS).**

## Decisão
**(A) Banco e schema compartilhados, isolamento lógico por `organization_id` + RLS**, com **defesa em profundidade** (aplicação também impõe tenant). Isolamento físico (B/C) reservado para grandes contas no futuro — o modelo `organization_id` permite migrar um tenant sem refazer o domínio.

## Justificativa
(A) equilibra simplicidade, custo e escala para dezenas de milhares de tenants. (B/C) têm custo operacional alto (migrations × N, provisionamento) desnecessário agora. (D) é inseguro — RLS é rede de segurança essencial (AP10). A defesa em profundidade cobre o risco de política RLS malfeita.

## Consequências positivas
- Custo/operação proporcionais; um lugar para migrar.
- Segurança em camadas; caminho para isolamento físico sem reescrita.

## Consequências negativas
- Risco concentrado em políticas RLS corretas.
- "Vizinho barulhento" (grande tenant) até haver isolamento físico.

## Riscos
R1 (vazamento entre tenants) — o risco mais crítico do produto. Mitigado por testes de isolamento bloqueando deploy, IDs opacos, buckets por tenant, revisão obrigatória (`../TestingStrategy.md`, `../Security.md`).

## Gatilhos de revisão
- Grande conta exigindo isolamento físico.
- Saturação do primário → sharding por tenant.
- Qualquer incidente de isolamento.
