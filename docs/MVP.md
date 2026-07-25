# Rescript — Escopo do MVP

> Documento oficial de escopo do Produto Mínimo Viável.
> Define o que entra, o que fica de fora, as telas da primeira versão e os critérios de sucesso.
> Status: Product Discovery (pré-implementação).

---

## 1. Objetivo do MVP

Provar que uma PME comercial consegue **centralizar sua operação (clientes, produtos, estoque, vendas e financeiro) em um sistema tão simples que a equipe adota sem treinamento** — e enxergar valor (indicadores) já na primeira semana.

O MVP **não** busca ser completo. Busca ser **usável, confiável e encantador** no núcleo.

### Hipóteses que o MVP valida

1. PMEs adotam um sistema de gestão se ele for realmente simples.
2. A integração nativa Venda → Estoque → Financeiro gera valor percebido imediato.
3. Indicadores na primeira tela aumentam retenção.
4. Donos pagam por clareza operacional mesmo sem módulo fiscal.

---

## 2. Princípio de Escopo

> **"Faça o núcleo perfeito antes de fazer qualquer módulo."**

Tudo que não for essencial para registrar e enxergar a operação comercial básica fica fora do MVP. Preferimos um núcleo redondo a um produto largo e raso.

### As três camadas no MVP

O MVP entrega as três camadas do produto — mas a Camada 3 (Interpretar) de forma **limitada e confiável**:

1. **Registrar** — completo e íntegro (base da confiança — `DataTrust.md`).
2. **Automatizar** — venda dispara todas as consequências.
3. **Interpretar** — um conjunto pequeno de insights determinísticos e de baixo falso positivo, na Central de Decisão (`DecisionCenter.md`, `InsightCatalog.md`).

> A inteligência entra desde o MVP, mas só o que é confiável. Interpretar sobre dados frágeis destruiria a credibilidade (`IntelligencePrinciples.md`).

---

## 3. O que ENTRA no MVP

### 3.1. Fundação (Platform)

- Cadastro de empresa (tenant) e conta do dono.
- Autenticação (login/cadastro seguro, via serviço gerenciado).
- Convite de usuários (poucos papéis: Dono/Admin e Operador).
- Isolamento de dados por empresa (multi-tenant).
- Configurações essenciais da empresa (nome, dados básicos, moeda/BR).
- Billing básico (planos e assinatura) — necessário para operar como SaaS.
- Onboarding guiado (checklist de primeiros passos).

### 3.2. Núcleo (Core)

**Clientes**
- Cadastrar, editar, listar e buscar clientes (PF e PJ).
- Ver histórico de compras do cliente.

**Produtos**
- Cadastrar, editar, listar e buscar produtos.
- Preço de venda, custo, categoria, SKU, unidade.

**Estoque**
- Saldo por **variante** (físico, reservado, disponível).
- Movimentações do ledger: entrada, saída, ajuste, devolução, estorno.
- **Reserva** no MVP (compromisso ≠ saída); conversão em saída na confirmação.
- Custeio: **custo médio ponderado**; custo aplicado gravado na saída.
- Alerta de estoque baixo.

**Vendas**
- Ciclo em um único agregado Sale: rascunho → orçamento → pedido → **confirmada** → cancelada (sem Order separado).
- Itens por variante; quantidade inteira ou fracionada; desconto sob política de autorização.
- **Confirmar Venda:** consome reserva + baixa estoque + gera recebível (atômico, idempotente).
- Listagem e busca de vendas.

**Financeiro básico**
- Recebível, parcela, pagamento (situações derivadas — não booleano).
- Pagamento parcial, vencimento, atraso, estorno, cancelamento.
- **Sem juros/multa no MVP** (V1).
- Saldo e fluxo de caixa simples. Moeda operacional BRL.

**Central de Decisão / Indicadores (Home Inteligente)**
- Blocos "Hoje", "Requer atenção", "Próximos dias", "Oportunidades", "Visão geral" (`DecisionCenter.md`).
- Vendas do dia e do mês, ticket médio, top produtos e top clientes.
- Saldo financeiro e contas a vencer.
- Conclusões acionáveis com título, impacto, origem e ação sugerida.

**Inteligência no MVP (limitada e confiável)** — insights determinísticos de baixo falso positivo:
- estoque baixo e risco de ruptura (dias até acabar);
- produtos sem movimentação;
- recebimentos vencidos e a vencer;
- pedidos parados;
- variação de vendas e de ticket médio;
- concentração de receita;
- clientes inativos (versão simples) e clientes em atraso;
- margem reduzida (quando há custo cadastrado);
- resumo diário e prioridades do dia;
- "tudo sob controle" e lacunas de dados.
- *Catálogo completo e versões em `InsightCatalog.md`.*

**Relatórios**
- Vendas por período.
- Estoque atual / movimentações.
- Financeiro (recebimentos/pagamentos por período).
- Exportação simples (PDF/planilha).

---

## 4. O que NÃO entra no MVP

Explicitamente fora (vira módulo futuro ou integração — ver `Roadmap.md`):

- ❌ Emissão de nota fiscal (NF-e/NFC-e/NFS-e).
- ❌ Módulo de Compras (fornecedores, pedidos de compra).
- ❌ Módulo de Produção.
- ❌ Assistência Técnica.
- ❌ Projetos.
- ❌ RH / comissões.
- ❌ API pública e webhooks.
- ❌ Marketplace de integrações.
- ❌ Integrações com marketplaces, meios de pagamento e logística.
- ❌ Permissões avançadas / granulares (apenas papéis básicos no MVP).
- ❌ Multi-filial / multi-depósito.
- ❌ Relatórios avançados / BI customizável.
- ❌ App mobile nativo (o MVP é web responsivo).
- ❌ Contabilidade completa, conciliação bancária automática, SPED.
- ❌ Multi-moeda / internacionalização (foco Brasil primeiro).

**Inteligência que NÃO entra no MVP:**
- ❌ Chatbot aberto / linguagem natural sobre qualquer área.
- ❌ "Copiloto" genérico.
- ❌ Previsões complexas sem histórico suficiente.
- ❌ Recomendações financeiras de alto risco.
- ❌ Decisões automáticas irreversíveis / agentes agindo sem confirmação.
- ❌ Modelos generativos caros sem prova de valor.

*(A base é determinística e auditável — ver `IntelligencePrinciples.md`.)*

> Registrar o "não" evita que o MVP inche. Cada item acima já tem lugar planejado no roadmap.

---

## 5. Telas da Primeira Versão

Lista canônica das telas do MVP (detalhes de navegação em `Navigation.md`):

### 5.1. Autenticação & Onboarding
1. **Cadastro** (criar conta + empresa).
2. **Login**.
3. **Recuperação de senha**.
4. **Onboarding guiado** (wizard/checklist de primeiros passos).

### 5.2. Núcleo
5. **Central de Decisão / Início** (conclusões + indicadores — `DecisionCenter.md`).
6. **Clientes — Lista**.
7. **Cliente — Cadastro/Edição**.
8. **Cliente — Detalhe** (com histórico).
9. **Produtos — Lista**.
10. **Produto — Cadastro/Edição**.
11. **Produto — Detalhe**.
12. **Estoque — Visão geral / saldos**.
13. **Estoque — Movimentação** (entrada/saída/ajuste).
14. **Vendas — Lista**.
15. **Venda — Nova / Registro**.
16. **Venda — Detalhe**.
17. **Financeiro — Contas a receber**.
18. **Financeiro — Contas a pagar**.
19. **Financeiro — Fluxo de caixa / lançamento**.
20. **Relatórios** (vendas, estoque, financeiro).

### 5.3. Configuração & Conta
21. **Configurações da empresa**.
22. **Usuários & Convites**.
23. **Plano & Assinatura (Billing)**.
24. **Perfil do usuário**.

> ~24 telas — um MVP focado, sem dispersão.

---

## 6. Critérios de Aceite do MVP (Definition of Done)

O MVP está pronto quando uma empresa nova consegue, sem ajuda externa:

1. Criar conta e configurar a empresa em minutos.
2. Cadastrar clientes e produtos.
3. Registrar uma venda e ver o estoque baixar e o financeiro atualizar **automaticamente**.
4. Ver, na Central de Decisão, seus indicadores **e ao menos uma conclusão útil** sobre o negócio.
5. Gerar e exportar um relatório.
6. Convidar outro usuário e operar juntos.
7. Assinar um plano.

E quando os números (estoque, vendas, financeiro) forem **consistentes e confiáveis** em todos esses fluxos — condição inegociável para a inteligência existir (`DataTrust.md`).

### O Momento "Aha" do MVP

> O usuário registra sua primeira venda e percebe que o Rescript **atualizou o estoque, organizou o financeiro, atualizou os indicadores, registrou o histórico e apresentou uma conclusão útil** — sem cadastros duplicados nem trabalho adicional.

Meta: primeira **operação completa em até 24h**; idealmente, no onboarding, em poucos minutos com dados próprios ou dados de demonstração claramente identificados (ver `Activation.md`).

---

## 7. Métricas de Validação do MVP

- **Ativação:** % de empresas com primeira venda em ≤ 24h.
- **Adoção:** vendas registradas por empresa/semana.
- **Confiança:** % de empresas que usam o financeiro além das vendas.
- **Retenção D30/D60/D90.**
- **Tempo até primeiro insight** no dashboard.
- **NPS inicial** (dono e operador).

---

## 8. Fora de escopo técnico do MVP (decisões adiadas)

Estas decisões **não** precisam ser resolvidas para lançar o MVP, mas a arquitetura deve deixá-las possíveis (ver `ArchitectureOverview.md`):

- Escalonamento para milhões de registros por tenant.
- Sharding/particionamento avançado de banco.
- Data warehouse / BI dedicado.
- Múltiplas regiões geográficas.

No MVP, priorizamos **simplicidade operacional** com fundamentos corretos (multi-tenant, isolamento, contratos entre módulos) que permitam escalar depois sem reescrever.
