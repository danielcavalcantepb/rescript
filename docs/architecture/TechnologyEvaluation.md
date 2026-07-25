# Rescript — Avaliação de Tecnologia (Stack)

> Avaliação crítica da stack proposta. A stack **não é aceita automaticamente**.
> Status: Design de arquitetura (pré-implementação). Decisão formal em `adr/0001-stack.md`.

---

## 1. Stack Proposta

**Frontend/app:** TypeScript, React, TanStack Start, TanStack Router, TanStack Query, Vite, Tailwind CSS, Radix UI, padrão shadcn/ui.
**Backend/infra:** Supabase (PostgreSQL, Auth, RLS, Storage, Edge Functions), Vercel, GitHub (CI/CD).

---

## 2. Método de Avaliação

Cada tecnologia é avaliada quanto a: adequação ao produto, riscos, limitações, custo, escalabilidade, segurança, DX, dependência de fornecedor (lock-in), suporte a multi-tenancy, suporte a transações de estoque/financeiro, capacidade de gerar insights, observabilidade, testes e evolução.

**Veredito antecipado:** a stack é **adequada e recomendada** para o estágio atual, com **três ajustes/ressalvas importantes** (ver §9). A decisão mais consequente — PostgreSQL como núcleo transacional — está **correta** e é a que mais importa para a tese de confiança nos dados.

---

## 3. Camada de Aplicação (Frontend)

### TypeScript + React
- **Adequação:** alta. Ecossistema maduro, contratação fácil, tipagem forte protege regras de negócio.
- **Riscos:** baixos. React é padrão de mercado.
- **Recomendação:** ✅ manter. TypeScript **obrigatório** em todo o código (domínio tipado é defesa).

### TanStack Start + Router + Query + Vite
- **Adequação:** boa. Router type-safe e Query (cache/estado de servidor) casam muito bem com um app data-intensive como o Rescript. Vite dá excelente DX.
- **Riscos:** **TanStack Start é o componente mais jovem/imaturo da stack** (framework full-stack relativamente novo). Risco de breaking changes e ecossistema menor que Next.js.
- **Mitigação:** manter a lógica de domínio **fora** do framework (em `packages/domain`), de modo que trocar Start por Next.js no futuro seja um custo de borda, não de núcleo. TanStack Router/Query são sólidos e de baixo risco isoladamente.
- **Recomendação:** ✅ aceitável, com a **ressalva** de isolar o framework (ADR-0001). Alternativa de menor risco caso se prefira maturidade: Next.js — mas Start é aceitável dado o alinhamento com Router/Query e a preferência do time.

### Tailwind + Radix UI + shadcn/ui
- **Adequação:** excelente para a obsessão por simplicidade e consistência (P12/AP consistência). shadcn/ui dá componentes acessíveis e "donos do código" (sem lock-in de biblioteca).
- **Riscos:** baixos. Radix cobre acessibilidade (importante para P15).
- **Recomendação:** ✅ manter.

---

## 4. Núcleo Transacional (PostgreSQL)

**Esta é a decisão mais importante da stack.**

- **Adequação:** máxima. O Rescript é um sistema **transacional** (estoque, financeiro, venda atômica). PostgreSQL oferece: transações ACID, constraints/checks, unicidade, chaves estrangeiras, `SELECT ... FOR UPDATE` (concorrência), funções e triggers, RLS nativa, materialized views (insights), `advisory locks`, e forte integridade referencial.
- **Suporte a estoque/financeiro:** ideal — atomicidade e constraints são exatamente o que os princípios AP12/AP13/AP20 exigem.
- **Suporte a multi-tenancy:** RLS nativa por linha (`organization_id`).
- **Suporte a insights:** views, materialized views, agregações e funções determinísticas — perfeito para inteligência determinística sem IA (`InsightArchitecture.md`).
- **Escalabilidade:** vertical + réplicas de leitura cobrem folgadamente até dezenas de milhares de tenants; particionamento disponível quando necessário (`Scalability.md`).
- **Recomendação:** ✅✅ **PostgreSQL é o alicerce correto.** É a escolha de menor arrependimento possível.

---

## 5. Supabase (Auth, RLS, Storage, Edge Functions)

### Supabase Auth
- **Adequação:** boa. Resolve identidade, e-mail/senha, recuperação, e integra RLS via claims JWT. Poupa construir autenticação (respeita "não reinventar").
- **Riscos:** custom claims e contexto de organização ativa exigem cuidado (ver `MultiTenancy.md` §claims). MFA e políticas avançadas precisam de validação.
- **Recomendação:** ✅ usar, mantendo a **autorização** (papéis/permissões) no nosso domínio, não só nos claims.

### Row Level Security (RLS)
- **Adequação:** essencial para isolamento. É a **última linha** de defesa (AP10), não a única.
- **Riscos:** políticas RLS mal escritas são uma fonte clássica de vazamento; performance de políticas complexas precisa de atenção; testes de RLS são **obrigatórios** (`TestingStrategy.md`).
- **Recomendação:** ✅ obrigatória + defesa em profundidade na aplicação + suíte de testes de isolamento.

### Supabase Storage
- **Adequação:** boa para XML/PDF fiscais, arquivos de importação, anexos. Suporta políticas de acesso por tenant.
- **Riscos:** **vazamento por storage** é um vetor real — políticas de bucket e caminhos por `organization_id` são críticos (`Security.md`).
- **Recomendação:** ✅ usar com políticas estritas e URLs assinadas de curta duração.

### Edge Functions
- **Adequação:** boa para webhooks (fiscal, billing, futuro WhatsApp), tarefas server-side e processamento fora do request do usuário.
- **Riscos:** limites de execução (tempo/memória) tornam-nas inadequadas para jobs longos/pesados (importações grandes, recomputações massivas). Ver §7.
- **Recomendação:** ✅ para webhooks e tarefas curtas; **não** para processamento longo sem uma estratégia de fila/worker (`MessagingArchitecture.md`, `ImportArchitecture.md`).

---

## 6. Hospedagem e CI/CD

### Vercel
- **Adequação:** boa para a aplicação web (SSR/edge, previews por PR — ótimo para `DeploymentStrategy.md`).
- **Riscos:** custo pode crescer com tráfego/serverless; funções serverless têm limites; acoplamento a features específicas deve ser evitado.
- **Recomendação:** ✅ para o app web; manter a lógica portável para não depender de recursos exclusivos.

### GitHub (versionamento + CI/CD)
- **Adequação:** padrão de mercado, integra com Vercel e Supabase.
- **Recomendação:** ✅ manter. Actions para CI (lint, testes, type-check, testes de RLS).

---

## 7. Lacuna Crítica Identificada: Processamento Assíncrono / Jobs

A stack proposta **não define claramente um mecanismo para trabalho assíncrono confiável e de longa duração**: importações grandes, processamento de outbox, recomputação de insights, retries de webhooks, envio agendado (resumo diário WhatsApp).

Edge Functions cobrem tarefas curtas, mas não substituem um **worker com fila e retries**.

**Opções (a decidir na modelagem, não agora):**
1. **Supabase-native:** `pg_cron` (agendamento) + tabela de fila no PostgreSQL (padrão "queue as table" com `SELECT ... FOR UPDATE SKIP LOCKED`) + Edge Functions/worker leve. **Vantagem:** sem novo fornecedor; transacional junto ao banco (bom para outbox). **Preferida para o início.**
2. **Fila gerenciada externa** (ex.: serviço de filas) + worker dedicado. **Vantagem:** robustez/escala. **Custo:** mais um fornecedor e complexidade — adiar até haver necessidade.

**Recomendação:** começar com **fila baseada em PostgreSQL + agendamento (`pg_cron`)** — proporcional ao estágio (AP7) e consistente com a outbox (`DomainEvents.md`). Documentado em ADR-0009.

---

## 8. Análise de Lock-in (dependência de fornecedor)

| Componente | Grau de lock-in | Mitigação |
|---|---|---|
| PostgreSQL | Baixo | SQL padrão; portável para qualquer Postgres gerenciado |
| Supabase Auth | **Médio-alto** | Isolar acesso a auth atrás de uma camada `packages/auth`; manter mapa usuário↔membership no nosso schema |
| RLS | Baixo | É recurso do Postgres, não do Supabase |
| Storage | Médio | Abstrair acesso a arquivos atrás de `packages/files` |
| Edge Functions | Médio | Manter lógica de domínio fora; funções são cascas finas |
| Vercel | Médio | Evitar features exclusivas; app portável |
| TanStack Start | Médio | Isolar framework; domínio em package próprio |

> **Conclusão de lock-in:** o maior risco é **Supabase Auth**. Mitigamos mantendo **autorização e o modelo de membership no nosso schema PostgreSQL** — assim, trocar o provedor de autenticação no futuro afeta apenas a borda de identidade, não o núcleo. O dado (Postgres) é sempre nosso e exportável.

---

## 9. Ajustes e Ressalvas Recomendados (resumo)

1. **Definir a estratégia de jobs assíncronos** (lacuna do §7) — começar com fila em PostgreSQL + `pg_cron`. **Sem isso, outbox, importação e insights ficam frágeis.**
2. **Isolar fornecedores atrás de camadas próprias** (`auth`, `files`, framework) para conter o lock-in, especialmente Supabase Auth.
3. **Tratar TanStack Start como a peça de maior risco de maturidade** — manter o domínio fora do framework para permitir troca futura de baixo custo.

---

## 10. Avaliação por Critério (consolidado)

| Critério | Veredito |
|---|---|
| Adequação ao produto | ✅ Alta |
| Riscos | 🟡 Concentrados em Start (maturidade) e jobs assíncronos (lacuna) |
| Limitações | 🟡 Edge Functions para tarefas longas |
| Custo | ✅ Baixo no início; monitorar Vercel/Supabase com escala |
| Escalabilidade | ✅ Suficiente até dezenas de milhares de tenants |
| Segurança | ✅ Forte (RLS + defesa em profundidade), exige disciplina |
| Multi-tenancy | ✅ Excelente (RLS nativa) |
| Transações estoque/financeiro | ✅✅ Excelente (PostgreSQL) |
| Geração de insights | ✅ Excelente (views/funções determinísticas) |
| Observabilidade | 🟡 Precisa de provedor externo definido (`Observability.md`) |
| Testes | ✅ Viável; RLS/concorrência exigem testes dedicados |
| DX | ✅ Boa |
| Lock-in | 🟡 Médio (mitigável), maior em Auth |
| Evolução futura | ✅ Boa (Postgres + monólito modular) |

---

## 11. Recomendação Final

**Adotar a stack proposta**, com os três ajustes do §9. A escolha central (TypeScript + React + PostgreSQL/Supabase + Vercel) é **coerente com os princípios**, proporcional ao time, forte onde mais importa (consistência transacional e multi-tenancy) e não cria arrependimento estrutural. Formalizado em **ADR-0001**.

**Não recomendo** trocar tecnologias por preferência: a stack atende. As mudanças são de **complemento** (jobs assíncronos) e **disciplina** (isolamento de fornecedores), não de substituição.
