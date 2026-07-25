# Rescript — Estratégia de Repositório

> Aplicação única organizada por módulos **vs.** monorepo. Escolha proporcional ao tamanho atual da equipe.
> Status: Design de arquitetura (pré-implementação). Decisão em `adr/0012-repository-structure.md`.

---

## 1. As Opções

- **A. Aplicação única organizada por módulos:** um projeto, pastas por domínio, fronteiras lógicas.
- **B. Monorepo:** múltiplos pacotes (`apps/`, `packages/`) num único repositório, com fronteiras físicas.

---

## 2. Recomendação

**Começar com um monorepo leve (B), mas mínimo** — ou, de forma equivalente e ainda mais simples, **aplicação única com módulos bem separados (A) preparada para virar monorepo**. A recomendação concreta:

> **Monorepo enxuto desde o início**, com um `apps/web` e poucos `packages` que representam as fronteiras que já sabemos serem estáveis e críticas (**domain, database, auth, permissions**), evitando criar pacotes especulativos.

**Por quê:** o Rescript tem fronteiras de domínio fortes e críticas (`ModuleBoundaries.md`) que queremos **impor mecanicamente** (um pacote não importa o interno de outro). Um monorepo leve dá isso com custo baixo hoje e evita uma migração dolorosa depois. Mas **não** criamos os 10 pacotes do exemplo agora — isso seria abstração especulativa (AP6).

---

## 3. Estrutura Proposta (referência, não criar agora)

Estrutura-alvo **quando/se necessário** — começamos com o subconjunto mínimo:

```
apps/
  web/                 # TanStack Start (UI + rotas + BFF fino)
packages/
  domain/              # regras de negócio puras (sem framework) — CRÍTICO
  database/            # acesso a dados, migrations, RLS, tipos — CRÍTICO
  auth/                # isolamento do Supabase Auth (anti lock-in) — CRÍTICO
  permissions/         # RBAC + entitlements (contrato fino) — CRÍTICO
  ui/                  # componentes shadcn/ui compartilhados (quando houver reuso)
  validation/          # schemas compartilhados (quando houver reuso)
  observability/       # wrapper do provedor (quando definido)
  config/              # config compartilhada
  testing/             # utilitários de teste (quando a suíte crescer)
```

- **Fase 1 (agora que iniciar):** `apps/web` + `packages/domain`, `database`, `auth`, `permissions`. Só o essencial.
- **Fase 2:** extrair `ui`, `validation` quando houver reuso real.
- **Fase 3:** `observability`, `config`, `testing` conforme a necessidade aparece.

> Regra: um pacote nasce quando a **terceira** duplicação ou uma **fronteira crítica** o justifica — nunca antes.

---

## 4. Análise Comparativa

| Critério | A. App única | B. Monorepo leve |
|---|---|---|
| **Simplicidade inicial** | ✅ Máxima | 🟡 Um pouco mais de setup |
| **Imposição de fronteiras** | 🟡 Só por disciplina/lint | ✅ Física (imports proibidos falham o build) |
| **Isolamento do domínio (anti lock-in)** | 🟡 Possível, exige rigor | ✅ Natural (`domain` sem framework) |
| **Compartilhar tipos/validação** | ✅ Trivial (mesmo projeto) | ✅ Via pacotes |
| **Complexidade de build/CI** | ✅ Baixa | 🟡 Média (ferramenta de monorepo) |
| **Onboarding de devs** | ✅ Fácil | 🟡 Requer entender pacotes |
| **Custo de migração futura** | 🔴 Alto (virar monorepo depois dói) | ✅ Já pronto |
| **Risco de overengineering** | ✅ Baixo | 🔴 Alto se criar pacotes demais |

---

## 5. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Monorepo vira zoológico de pacotes | Só criar pacote com justificativa (regra da 3ª repetição / fronteira crítica) |
| Complexidade de tooling para time pequeno | Ferramenta de monorepo simples; scripts padronizados |
| Fronteiras ignoradas | Regras de import no lint + revisão de código |
| App única sem disciplina apodrece | Se optar por A, lint de arquitetura obrigatório |

---

## 6. Decisão e Gatilho de Revisão

**Decisão (ADR-0012):** monorepo **mínimo** (`apps/web` + 4 pacotes críticos). Isso equilibra imposição de fronteiras (que o domínio exige) com proporcionalidade ao time (AP7).

**Gatilhos para expandir pacotes:** reuso real de UI/validação; segundo app (ex.: portal/admin); necessidade de publicar um SDK; extração futura de um serviço (`Scalability.md`).

**Gatilho para reconsiderar (voltar a app única):** se o overhead do monorepo atrapalhar mais que ajudar com o time atual — revisitar.

---

## 7. Invariantes

1. O **domínio** (`packages/domain`) é **puro** — sem framework, sem Supabase — para máxima testabilidade e anti lock-in.
2. Fronteiras entre módulos são **impostas mecanicamente** (build falha em import proibido).
3. Nenhum pacote é criado **especulativamente** (AP6).
4. A estrutura cresce por **necessidade comprovada**, não por antecipação.
