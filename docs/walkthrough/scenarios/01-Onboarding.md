---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 01-Onboarding
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 01 — Onboarding

## Cenário

Nova empresa brasileira B2B cria conta no Rescript, conclui onboarding guiado, importa dados iniciais e registra a primeira venda confirmada — validando isolamento multi-tenant e estados incompletos.

### Objetivo
Validar o fluxo completo de ativação: identidade → organização → proprietário → configuração → local de estoque padrão → unidades → importação → primeira operação comercial.

### Atores
- Fundador (futuro Proprietário)
- Sistema (wizard, jobs de importação, serviços de domínio)

### Estado inicial
Plataforma sem registro do usuário; nenhuma Organization; nenhum dado de negócio.

### Pré-condições
- E-mail válido e único na plataforma
- Plano SaaS disponível (entitlement base)
- Serviço de autenticação operacional

### Passos executados

#### 1. Cadastro de conta e organização
1. **Comando:** `RegisterUser` + `CreateOrganization` (fluxo unificado de signup)
2. **Autorização:** público (signup); após criação, membership Proprietário implícita
3. **Validações:** e-mail único (G1); nome da org obrigatório; moeda padrão BRL (FD-07)
4. **Consultadas:** unicidade de e-mail; catálogo de planos
5. **Criadas:** User, Organization, Membership (role=Proprietário), Subscription inicial, OrganizationSettings
6. **Alteradas:** sessão autenticada vinculada ao tenant
7. **Locks:** unicidade de e-mail (constraint)
8. **Auditoria:** `OrganizationCreated`, `MemberJoined`
9. **Eventos:** `OrganizationCreated`, `SubscriptionStarted`
10. **Outbox:** eventos de onboarding para e-mail de boas-vindas (assíncrono)
11. **Derivados:** checklist de onboarding incompleto
12. **Insight:** "Complete seu cadastro" se onboarding pendente
13. **Falha:** e-mail duplicado → rejeição clara
14. **Recuperação:** usuário usa login ou recuperação de senha

#### 2. Configuração inicial e local de estoque padrão
1. **Comando:** `UpdateOrganizationSettings` + criação implícita de `StockLocation` padrão
2. **Autorização:** `settings.edit` (Proprietário)
3. **Validações:** políticas com defaults sensatos (RN-90); **HYPOTHESIS:** 1 local padrão "Principal" no MVP (multi-filial fora do escopo — MVP §4)
4. **Consultadas:** OrganizationSettings, entitlements
5. **Criadas:** StockLocation padrão; unidades base (un, cx, kg…) com precisão — **HYPOTHESIS:** qty precision default 3 decimais para fracionadas; inteiras precision=0 (FD-06)
6. **Alteradas:** OrganizationSettings (desconto, reserva TTL, estoque negativo — defaults)
7. **Locks:** nenhum crítico
8. **Auditoria:** alterações de configuração
9. **Eventos:** `SettingsUpdated`, `StockLocationCreated`
10. **Outbox:** nenhum crítico
11. **Derivados:** onboarding progress ~40%
12. **Insight:** lacunas de dados (sem clientes/produtos)
13. **Falha:** org inativa/billing bloqueado
14. **Recuperação:** retomar wizard

#### 3. Importação de clientes e produtos
1. **Comando:** `StartImport` → preview → `ConfirmImport`
2. **Autorização:** `import.execute`; entitlement de importação
3. **Validações:** IM1–IM4; SKU único (RN-21); produto sem variação → variante padrão (FD-08)
4. **Consultadas:** fingerprints, duplicatas de documento (RN-11)
5. **Criadas:** Customers, Products, ProductVariants (padrão), InventoryItems por variante estocável
6. **Alteradas:** ImportJob status
7. **Locks:** natural keys por org
8. **Auditoria:** origem import em cada registro (IM4)
9. **Eventos:** `ImportCompleted`
10. **Outbox:** reindexação de busca (assíncrono)
11. **Derivados:** saldos zerados até entrada manual
12. **Insight:** "Produtos sem movimentação" após período
13. **Falha:** linha inválida → preview com erros; não corrompe existentes (IM2)
14. **Recuperação:** corrigir planilha e reimportar idempotente

#### 4. Primeira venda confirmada (momento Aha)
1. **Comando:** `CreateSale` → itens → `ConfirmSale` (idempotency_key)
2. **Autorização:** `sales.create`, `sales.confirm`
3. **Validações:** S1–S3; estoque conforme política (RN-34); desconto FD-05
4. **Consultadas:** variants, InventoryItem balances, DiscountAuthorizationPolicy
5. **Criadas:** Sale, SaleItems, InventoryMovement (saída), Receivable, Payment? (à vista)
6. **Alteradas:** saldos físico/disponível; onboarding → concluído
7. **Locks:** pessimista por variant_id ordenado (ConcurrencyModel)
8. **Auditoria:** confirmação completa (RN-03)
9. **Eventos:** `SaleConfirmed`, `InventoryMoved`, `ReceivableCreated`
10. **Outbox:** insights e indicadores (assíncrono — ADR-0007)
11. **Derivados:** vendas do dia, ticket médio, caixa
12. **Insight:** "Primeira venda registrada" / resumo diário
13. **Falha:** sem estoque e política bloqueia
14. **Recuperação:** entrada de estoque ou ajuste de política

#### 5. Validações negativas (paralelo ao fluxo)
- **User sem org:** login ok, acesso a dados de negócio negado até membership
- **Membership revogada:** G1; operações falham imediatamente
- **Onboarding incompleto:** bloqueio soft em ações avançadas; checklist visível

### Estado final esperado
Organization ativa; Proprietário com membership; local padrão; unidades configuradas; clientes/produtos importados; primeira Sale Confirmada; indicadores populados; onboarding concluído.

### Invariantes verificadas
G1, G2, G4, S3, I2–I3, X1, IM1–IM4; exatamente um Proprietário por org.

### Inconsistências encontradas
- **HYPOTHESIS** de 1 local padrão alinha ao MVP (sem multi-filial), mas **HYPOTHESIS** de custo médio por org+location+variant extrapola FD-01 (oficial: por variante) — location_id preparatório, não decidido.
- Armazenamento físico de Money (centavos vs NUMERIC) permanece aberto (OQ-05) — **HYPOTHESIS** registrada, não decisão.
- Importação não executa entrada de estoque automaticamente — operador deve registrar movimentação separada (comportamento esperado, mas pode confundir onboarding).

### Ajustes recomendados
- Documentar explicitamente no wizard que import de produto não gera saldo físico.
- Fechar OQ-05 antes da implementação persistida de Money.
- Manter avg cost por variante no MVP; location_id nullable até multi-depósito.

### Classificação
**aprovado com ressalvas**
