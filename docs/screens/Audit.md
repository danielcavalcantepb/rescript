---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / Audit
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Audit

## Objetivo
Consultar trilha de auditoria (quem fez o quê) para owner — sem log técnico de infra.

## Usuário
Owner/admin com audit.view.

## Frequência
Baixa.

## Dados exibidos
Quando · quem · ação · entidade · resumo · correlation.  
Filtros: período · ator · tipo entidade.  
Prioridade: rastreabilidade. **Não** dump de JSON sensível (PII mascarada se necessário).

## Componentes
Header · Filters · Date range · Table · Empty · Detail drawer (before/after seletivo) · No permission state

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Filtrar/buscar | query | audit.view | não | — |
| Abrir detalhe | drawer | audit.view | não | — |
| Export | futuro | audit.view | — | — |

## Estados
Loading · Empty · Error · No permission · Offline · Partial

## Permissões
audit.view (restrito)

## Navegação
Settings

## Eventos
Consome AuditEvent; não produz (exceto audit do próprio acesso se policy)

## Regras
AuditModel · DataClassification · suporte grant aparece como ator especial

## Casos extremos
Volume alto · suporte impersonation entries · sem secrets em clear

## Design QA
- [ ] Não parecer SIEM
- [ ] Linguagem de negócio nas ações
