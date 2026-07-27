---
Status: Active
Owner: Product Design
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: screens / README
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — UX Blueprint (Telas)

> Especificação funcional completa de cada tela **antes da implementação**.
> Não é React, Tailwind, Figma, código nem mockup visual.
> Status: UX Blueprint (pré-implementação).

---

## 1. Missão

Um desenvolvedor deve implementar qualquer tela **somente** com estes documentos + domínio + design system.

## 2. Diretrizes obrigatórias

- Identidade oficial: `docs/design/BrandIdentity.md`
- Quiet Instrument (`docs/design/`)
- Simplicidade / baixa carga cognitiva
- Central de Decisão ≠ dashboard BI
- Registrar → Automatizar → Interpretar
- Inteligência discreta
- Zero aparência de ERP tradicional
- Degradê só em momentos institucionais (login/onboarding/splash)
- **Domínio vence UX** em conflito
- **Brand Identity vence** conflito de token/visual

## 3. Documentos de infraestrutura

| Doc | Conteúdo |
|---|---|
| `NavigationMap.md` | Mapa e Mermaid de fluxos |
| `Flows.md` | Fluxos transversais (venda, import, onboarding) |
| `Permissions.md` | Matriz de permissões × ações |
| `SearchBehavior.md` | Busca global + Command Palette |
| `ResponsiveBehavior.md` | Desktop / tablet / mobile por superfície |
| `ScreenIndex.md` | Índice + revisão final |

## 4. Telas

Cada arquivo em `docs/screens/` (exceto infra) segue o template obrigatório: Objetivo, Usuário, Frequência, Dados, Componentes, Ações, Estados, Permissões, Navegação, Eventos, Regras, Casos extremos, Design QA.

| Arquivo | Rota conceitual |
|---|---|
| `Login.md` | `/login` |
| `Onboarding.md` | `/onboarding` |
| `CentralDecision.md` | `/` |
| `CustomersList.md` | `/clientes` |
| `CustomerDetail.md` | `/clientes/:id` |
| `CustomerCreate.md` | `/clientes/novo` (+ edit) |
| `ProductsList.md` | `/produtos` |
| `ProductDetail.md` | `/produtos/:id` |
| `ProductCreate.md` | `/produtos/novo` (+ variantes) |
| `InventoryOverview.md` | `/estoque` |
| `InventoryMovement.md` | `/estoque/movimentos` (+ entrada/ajuste) |
| `InventoryReservation.md` | `/estoque/reservas` |
| `SalesList.md` | `/vendas` |
| `SaleWizard.md` | `/vendas/nova` · edição pré-confirmação |
| `SaleDetail.md` | `/vendas/:id` |
| `FinanceOverview.md` | `/financeiro` |
| `Receivables.md` | `/financeiro/receber` |
| `PaymentRegister.md` | modal/drawer a partir de recebível |
| `Insights.md` | `/insights` (lista completa) |
| `ImportWizard.md` | `/importacoes` · `/importacoes/:id` |
| `Settings.md` | `/config` |
| `Profile.md` | `/perfil` |
| `Organization.md` | `/config/empresa` |
| `Users.md` | `/config/membros` |
| `RolesPermissions.md` | `/config/permissoes` |
| `Subscription.md` | `/config/assinatura` |
| `Audit.md` | `/config/auditoria` |

> A matriz global de permissões vive em `Permissions.md`. A **tela** de papéis/permissões é `RolesPermissions.md`.

## 5. Fontes

`docs/design/` · `docs/domain/` · `docs/database/` · `docs/walkthrough/` · ADRs · estratégia.
