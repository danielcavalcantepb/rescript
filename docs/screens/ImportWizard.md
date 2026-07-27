---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / ImportWizard
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# ImportWizard

## Objetivo
Importar clientes/produtos/estoque inicial com preview, erros por linha e commit parcial idempotente.

## Usuário
Owner/admin.

## Frequência
Baixa-média (onboarding, periódica).

## Dados exibidos — etapas

| Etapa | UI |
|---|---|
| 1 Upload | tipo import · file drop · template download |
| 2 Mapeamento | colunas arquivo → campos Rescript |
| 3 Preview | N ok · N erro · tabela amostra · erros por linha |
| 4 Resumo | created/updated/skipped · política conflito |
| 5 Resultado | relatório · link entidades · reexecutar bloqueado se same key |

Prioridade: corrigir erros antes do commit; default conflito **skip** (FQ-04).

**Rollback:** não automático no MVP — copy honest “não desfaz; corrija e reimporte com cuidado”.

## Componentes
Stepper · File upload · Mapping selects · Preview Table · Alert errors · Progress · Buttons · Empty · History list jobs anteriores · **Desktop-first** banner mobile

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Upload | File + ImportJob | imports.run | não | map |
| Validar preview | rows status | imports.run | não | preview |
| Commit parciais | cria/atualiza domínio | imports.run | sim resumo | resultado |
| Baixar erros | CSV erros | imports.run | não | — |
| Ver histórico | jobs | imports.run | não | — |

## Estados
Loading · Empty history · Error file/parse · No permission · Offline · Partial commit · Idempotent re-run · Conflito SKU

## Permissões
imports.run (+ permissões implícitas create entidades)

## Navegação
Sidebar Importar · Onboarding · ⌘K · **Desktop-first**

## Eventos
ImportJob* · ProductCreated… · IdempotencyRecord

## Regras
ImportModel · unique SKU · walkthrough 22–24 · tenant no File

## Casos extremos
Reexecução mesmo arquivo · import ∥ create manual · 50k linhas batch · encoding

## Design QA
- [ ] Preview antes de commit
- [ ] Linguagem humana erros
- [ ] Sem parecer ETL enterprise
- [ ] Parece Rescript?
