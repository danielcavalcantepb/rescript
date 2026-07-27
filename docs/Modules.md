---
Status: Archived
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: Modules
Supersedes: None
Superseded-By: MODULE_STATUS.md
Related-Modules: All
---

# Rescript — Módulos da Plataforma

> Documento oficial de arquitetura funcional (modularização).
> Define os módulos, o que faz parte do núcleo, como dividir e como a plataforma cresce por módulos.
> Status: Product Discovery (pré-implementação).

---

## 1. Filosofia de Modularização

O Rescript é composto por um **Núcleo (Core)** simples e obrigatório, e por **Módulos opcionais** que são ativados conforme a empresa cresce. Essa separação é o coração da estratégia "crescer sem reescrever".

Princípios:

1. **Núcleo enxuto e coeso.** O Core resolve 80% das necessidades de qualquer PME comercial.
2. **Módulos plugáveis.** Cada módulo é uma capacidade opcional, ativável por plano/assinatura, sem alterar o núcleo.
3. **Baixo acoplamento, alta integração.** Módulos conversam por contratos claros (eventos/entidades compartilhadas), nunca por dependência rígida.
4. **Ativação por plano.** Módulos são também alavancas comerciais (upsell), controlados por assinatura/feature flags.
5. **Cada módulo tem dono, escopo e valor claros.** Nada entra sem justificar sua própria existência.

---

## 2. Camadas da Plataforma

```
┌─────────────────────────────────────────────────────────┐
│                    MÓDULOS OPCIONAIS                      │
│  Produção · Compras · Assistência · Projetos · RH ·      │
│  API Pública · Marketplace de Integrações · Fiscal       │
├─────────────────────────────────────────────────────────┤
│                     NÚCLEO (CORE)                        │
│  Clientes · Produtos · Estoque · Vendas ·                │
│  Financeiro básico · Indicadores · Relatórios            │
├─────────────────────────────────────────────────────────┤
│                    FUNDAÇÃO (PLATFORM)                    │
│  Autenticação · Multi-tenant · Usuários & Permissões ·   │
│  Configurações · Notificações · Auditoria · Billing      │
└─────────────────────────────────────────────────────────┘
```

- **Fundação (Platform):** serviços transversais que todo módulo usa. Não é vendida separadamente; é o alicerce.
- **Núcleo (Core):** o produto mínimo viável e o coração do valor. Presente em todos os planos pagos.
- **Módulos Opcionais:** expansão por necessidade e por plano.

### As três camadas funcionais (transversais ao núcleo)

Independente da divisão em módulos, o Rescript opera em três camadas — e a inteligência só existe sobre dados confiáveis:

1. **Registrar** — dados corretos e íntegros.
2. **Automatizar** — uma ação dispara todas as suas consequências.
3. **Interpretar** — o sistema gera conclusões (riscos, anomalias, pendências, tendências, oportunidades, próxima ação).

A camada **Interpretar** é uma **capacidade transversal do núcleo** (não um módulo vendido à parte no MVP), alimentada pelos dados de Clientes, Produtos, Estoque, Vendas e Financeiro. Ela se manifesta na **Central de Decisão** (`DecisionCenter.md`) e é governada por `IntelligencePrinciples.md`, `InsightCatalog.md` e `DataTrust.md`.

---

## 3. Fundação (Platform Services)

Serviços transversais, presentes desde o dia 1 (parte no MVP, parte evolutiva):

| Serviço | Descrição | MVP? |
|---|---|---|
| **Autenticação** | Login/cadastro seguro de usuários | Sim (via serviço gerenciado) |
| **Multi-tenant** | Isolamento de dados por empresa | Sim (fundacional) |
| **Empresas & Usuários** | Conta da empresa, convite de usuários | Sim |
| **Permissões / Papéis** | Perfis de acesso (dono, gerente, vendedor...) | Básico no MVP, avançado depois |
| **Configurações** | Preferências da empresa (dados, moeda, etc.) | Básico no MVP |
| **Notificações** | Alertas (estoque baixo, contas a vencer) | Básico no MVP |
| **Auditoria / Logs** | Rastreio de quem fez o quê | Parcial no MVP, completo depois |
| **Billing / Assinaturas** | Planos, cobrança, limites | Sim (para operar como SaaS) |

---

## 4. Núcleo (Core) — Módulos do MVP

### 4.1. Clientes (CRM leve)

- Cadastro de clientes (pessoa física e jurídica).
- Dados de contato, endereço, observações.
- Histórico de compras e situação (ativo/inativo).
- Busca rápida.
- **Valor:** saber com quem a empresa se relaciona e o histórico de cada um.

### 4.2. Produtos

- Cadastro de produtos com preço de venda e custo.
- Categorias/organização.
- Código/SKU, unidade de medida.
- Vínculo com estoque.
- **Valor:** catálogo organizado, base para vender e controlar margem.

### 4.3. Estoque

- Quantidade em estoque por produto.
- Saldos físico / reservado / disponível por variante.
- Ledger: entrada, saída, ajuste, devolução, estorno; **reserva** separada (MVP).
- Custeio por custo médio ponderado.
- Alerta de estoque mínimo/baixo.
- Baixa na **confirmação** da venda (consome reserva).
- **Valor:** saber o que tem, o que está comprometido, o que está acabando.

### 4.4. Vendas

- Ciclo comercial (rascunho, orçamento, pedido, confirmada, cancelada) no agregado Sale.
- Itens, quantidades (inteiras/fracionadas), preços, desconto com autorização.
- Confirmar Venda: estoque + recebível atômicos.
- **Valor:** o evento central do negócio, do orçamento à confirmação.

### 4.5. Financeiro Básico

- Contas a receber e a pagar.
- Entradas e saídas de caixa.
- Situação (pago, pendente, vencido).
- Saldo e fluxo simples.
- **Valor:** clareza sobre o dinheiro que entra e sai.

### 4.6. Central de Decisão + Indicadores (Home Inteligente)

- Conclusões acionáveis em linguagem clara ("requer atenção", "próximos dias", "oportunidades").
- Vendas do dia/mês, ticket médio, top produtos, top clientes.
- Saldo financeiro, contas a vencer, projeção de caixa (V1).
- Alertas de estoque e riscos antecipados.
- **Valor:** não é só a saúde do negócio num relance — é o sistema **dizendo o que precisa da atenção do dono e qual a próxima ação**. É a porta de entrada e o motor de hábito do produto. Ver `DecisionCenter.md`.

### 4.7. Relatórios

- Relatórios de vendas, estoque e financeiro.
- Filtros por período.
- Exportação (ex.: PDF/planilha).
- **Valor:** aprofundar a análise e compartilhar com contador/sócios.

---

## 5. Módulos Opcionais — Futuros

Estes **não fazem parte do MVP**. Estão aqui para garantir que a arquitetura os comporte sem reescrita.

### 5.1. Fiscal / Emissão de Documentos

- Emissão de NF-e/NFC-e/NFS-e (provavelmente via integração especializada).
- Gestão de obrigações fiscais básicas.
- **Por que futuro:** complexidade regulatória alta; melhor via integração.

### 5.2. Compras

- Pedidos de compra a fornecedores.
- Cadastro de fornecedores.
- Entrada de estoque a partir de compras.
- Sugestão de reposição baseada em estoque mínimo.
- **Sinergia:** alimenta Estoque e Financeiro (contas a pagar).

### 5.3. Produção

- Ordens de produção simples.
- Composição de produtos (ficha técnica / insumos).
- Consumo de insumos e geração de produto acabado.
- **Público:** pequenas indústrias e fabricação sob encomenda.

### 5.4. Assistência Técnica

- Ordens de serviço.
- Controle de equipamentos/aparelhos.
- Status de reparo, peças utilizadas.
- **Público:** oficinas, assistências, prestadores.

### 5.5. Projetos

- Gestão de projetos/serviços por etapas.
- Apontamento de tempo/custos.
- Faturamento por projeto.
- **Público:** agências, prestadores de serviço por projeto.

### 5.6. RH

- Cadastro de colaboradores.
- Controle simples de ponto/escala.
- Comissões de vendedores.
- **Sinergia:** comissões conectam Vendas + RH.

### 5.7. API Pública

- Endpoints para integração externa.
- Chaves de API, webhooks.
- **Valor:** permite terceiros e o próprio cliente integrarem o Rescript.

### 5.8. Marketplace de Integrações

- Catálogo de integrações (marketplaces, meios de pagamento, logística, contabilidade).
- Instalação/ativação self-service.
- **Valor:** efeito de rede; o Rescript vira hub do ecossistema da PME.

---

## 6. Como Dividir os Módulos (critérios)

Um novo módulo se justifica quando **todos** os critérios abaixo são atendidos:

1. **Coesão de domínio:** resolve um conjunto de problemas relacionados e distinto do núcleo.
2. **Público identificável:** atende um segmento ou necessidade que nem toda empresa tem.
3. **Valor comercial:** pode ser precificado / usado como alavanca de upsell.
4. **Independência:** pode ser ativado/desativado sem quebrar o núcleo.
5. **Integração por contrato:** conecta-se ao núcleo por eventos/entidades compartilhadas bem definidas, não por acoplamento interno.

Se um recurso não passa nesses critérios, ele é: (a) parte do núcleo, ou (b) uma configuração, ou (c) não deve existir agora.

---

## 7. Como os Módulos se Comunicam (visão funcional)

- **Entidades compartilhadas** vivem no núcleo (ex.: Produto, Cliente). Módulos as referenciam, não as duplicam.
- **Eventos de negócio** propagam efeitos entre módulos:
  - *Venda confirmada* → consome reserva + baixa Estoque + cria recebível/lançamento no Financeiro (+ comissão no RH, quando ativo).
  - *Compra recebida* → entrada no Estoque + conta a pagar no Financeiro.
  - *Ordem de produção concluída* → consumo de insumos + entrada de produto acabado no Estoque.
- **Fundação** provê identidade, permissões e tenant para todos.

> Detalhes técnicos de implementação desses contratos estão em `ArchitectureOverview.md`. Aqui tratamos apenas do desenho funcional.

---

## 8. Mapa de Ativação por Plano (referência)

| Módulo | Free | Essencial | Profissional | Empresarial |
|---|---|---|---|---|
| Clientes | Limitado | ✓ | ✓ | ✓ |
| Produtos | Limitado | ✓ | ✓ | ✓ |
| Estoque | Básico | ✓ | ✓ | ✓ |
| Vendas | Limitado | ✓ | ✓ | ✓ |
| Financeiro básico | — | ✓ | ✓ | ✓ |
| Indicadores | Básico | ✓ | ✓ | ✓ |
| Relatórios | Básico | ✓ | ✓ | ✓ |
| Compras | — | — | Opcional | ✓ |
| Produção | — | — | Opcional | Opcional |
| Assistência Técnica | — | — | Opcional | Opcional |
| Projetos | — | — | Opcional | Opcional |
| RH | — | — | — | Opcional |
| API Pública | — | — | Limitada | ✓ |
| Marketplace de Integrações | — | — | ✓ | ✓ |

> Tabela é referência estratégica; a matriz final será calibrada com dados de mercado.
