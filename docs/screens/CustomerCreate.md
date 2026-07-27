---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / CustomerCreate
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# CustomerCreate (e Edit form)

## Objetivo
Cadastrar cliente com campos mínimos; também serve edição full-page se não inline.

## Usuário
Vendedor, admin.

## Frequência
Média.

## Dados exibidos / campos
Tipo PF/PJ · Nome* · Nome fantasia (PJ) · Documento (opcional) · Email · Telefone · Endereço opcional · Obs.  
Prioridade: Nome. Resto progressive.

## Componentes
Header · Form · Input/Select · Button Salvar · Cancel · Alert validation · Helper text

## Ações
| Ação | Impacto | Permissão | Confirmação | Pós |
|---|---|---|---|---|
| Salvar | cria Customer | customers.create | não | Detail |
| Cancelar | descarta | — | se dirty | Lista |

## Estados
Loading save · Error validation/unique · Empty N/A · Offline · No permission

## Permissões
customers.create / edit

## Navegação
Lista “Novo” · ⌘K · Onboarding checklist · volta Detail/Lista

## Eventos
CustomerCreated

## Regras
CustomerModel; doc único por org se presente; import incompleto ok.

## Casos extremos
Só nome · doc inválido · duplicata doc · permissão removida no submit

## Design QA
- [ ] ≤ campos essenciais
- [ ] Sem IE/fiscal denso MVP
- [ ] Erros por campo
