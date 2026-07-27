---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / Settings
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Settings (hub)

## Objetivo
Índice de configurações essenciais — sem “parâmetros infinitos”.

## Usuário
Owner/admin.

## Frequência
Baixa.

## Dados exibidos
Lista de seções: Empresa · Membros · Permissões · Assinatura · Políticas (desconto, estoque, reserva) · Auditoria (se permitido).  
Prioridade: 5–7 links. Avançado recolhido.

## Componentes
Header · Nav list / cards quiet · Badge “recomendado” raro · Empty N/A

## Ações
Navegar para subtelas. Sem saves nesta hub.

## Estados
Loading · No permission (operador vê só Profile) · Offline

## Permissões
org.settings para maioria; audit.view separado

## Navegação
Sidebar Config · ⌘K · User menu

## Eventos
nenhum

## Regras
RN-90 defaults; SettingsModel policies tipadas

## Casos extremos
Org suspensa → Assinatura em destaque

## Design QA
- [ ] Não ERP settings dump
- [ ] Poucos itens
- [ ] Parece Rescript?
