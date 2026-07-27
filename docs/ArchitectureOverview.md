---
Status: Archived
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Archive
Scope: ArchitectureOverview
Supersedes: None
Superseded-By: 01_PROJECT_ARCHITECTURE.md
Related-Modules: All
---

# Rescript — Visão Geral de Arquitetura

> Documento oficial de princípios e decisões arquiteturais de alto nível.
> Foco: como a plataforma cresce sem ser reescrita e como suportar milhares de empresas.
> Status: Product Discovery (pré-implementação). **Este documento define princípios e diretrizes, não implementação, stack final ou schema.**

---

## 1. Objetivo deste Documento

Estabelecer as **decisões arquiteturais fundamentais** que precisam estar certas desde o início — não porque vamos implementá-las agora, mas porque **decisões erradas na fundação custam uma reescrita depois**.

Duas perguntas guiam tudo aqui:

1. Como o Rescript **cresce sem precisar ser reescrito**?
2. Quais decisões desde o dia 1 permitem **suportar milhares de empresas (tenants)**?

> As escolhas concretas de tecnologia (linguagens, frameworks, banco, provedor de auth, infra) serão definidas na etapa de arquitetura de execução. Aqui fixamos os **princípios inegociáveis**.

---

## 2. Princípios Arquiteturais Fundamentais

1. **Multi-tenant desde o dia 1.** A plataforma serve muitas empresas sobre a mesma base de código, com isolamento de dados rigoroso. Nunca haverá "uma instância por cliente" como padrão.
2. **Modularidade por domínio.** O sistema é organizado em módulos de negócio coesos (Clientes, Produtos, Estoque, Vendas, Financeiro...), com fronteiras claras. Módulos futuros plugam sem tocar no núcleo.
3. **Baixo acoplamento, integração por contratos.** Módulos se comunicam por interfaces e eventos de negócio bem definidos, não por dependências internas.
4. **Núcleo estável, bordas flexíveis.** Regras de negócio centrais são protegidas; integrações e detalhes externos (fiscal, pagamentos, marketplaces) ficam nas bordas, substituíveis.
5. **Consistência dos dados críticos.** Estoque e financeiro exigem operações confiáveis e atômicas (ver RN-80 em `BusinessRules.md`).
6. **Escalabilidade horizontal como premissa.** A arquitetura assume crescer adicionando capacidade, não trocando de fundação.
7. **Segurança e privacidade por design.** Isolamento, controle de acesso e proteção de dados são requisitos fundacionais, não recursos posteriores.
8. **Observabilidade desde cedo.** Logs, métricas e auditoria são parte da fundação para operar com confiança em escala.
9. **Evolução sem migração forçada.** Nenhuma decisão pode obrigar o cliente a migrar de plataforma para crescer. Ativar módulo ou plano é incremental.

---

## 3. Multi-Tenancy (a decisão mais importante)

Suportar milhares de empresas começa por acertar o modelo de tenancy.

### 3.1. Diretrizes

- **Identidade de tenant em tudo.** Todo dado de negócio pertence a uma empresa (tenant). O contexto de tenant acompanha cada operação, da autenticação à leitura/escrita.
- **Isolamento lógico rigoroso.** Uma empresa jamais acessa dados de outra. O isolamento é garantido em camada de dados e de aplicação (defesa em profundidade).
- **Modelo pragmático no início, evoluível depois.** Começar com um modelo de tenancy simples e eficiente (base compartilhada com isolamento lógico por tenant) que atende milhares de empresas, deixando aberto o caminho para particionamento/isolamento físico de grandes contas no futuro.
- **Sem vazamento por engano.** O padrão de acesso a dados deve tornar difícil (idealmente impossível) esquecer o filtro de tenant.

### 3.2. Por que isso desde o dia 1

Adicionar multi-tenancy depois é uma das reescritas mais caras que existem. Nascer multi-tenant é barato; virar multi-tenant é doloroso.

---

## 4. Modularização Técnica (crescer sem reescrever)

### 4.1. Fronteiras de módulo

- Cada módulo de negócio tem uma **fronteira clara**: seus próprios conceitos, regras e responsabilidades.
- Um módulo expõe **contratos** (o que oferece a outros) e consome contratos de outros — nunca alcança as "entranhas" de outro módulo.
- O **núcleo** (Clientes, Produtos, Estoque, Vendas, Financeiro, Indicadores, Relatórios) é construído com essas fronteiras mesmo estando junto no início.

### 4.2. Comunicação entre módulos

- **Entidades compartilhadas** (ex.: Produto, Cliente) têm dono claro no núcleo; outros módulos as referenciam.
- **Eventos de negócio** propagam efeitos (ex.: "venda confirmada" → estoque + financeiro), permitindo que módulos futuros reajam sem alterar o emissor.
- Esse desenho permite extrair um módulo para um serviço separado no futuro, **se e quando** a escala exigir, sem reescrever o produto.

### 4.3. Monolito modular primeiro

- Começar como um **monolito modular** bem organizado (mais simples de construir e operar) com fronteiras internas fortes.
- Evoluir para serviços separados **apenas onde a escala justificar** — as fronteiras já preparadas tornam essa evolução incremental, não uma reescrita.

> Princípio: **"Fronteiras rígidas, implantação flexível."** As divisões lógicas existem desde o início; a divisão física acontece quando necessário.

---

## 5. Camadas da Arquitetura (lógicas)

```
┌───────────────────────────────────────────────┐
│  Apresentação (Web responsivo)                │  UX consistente, multi-dispositivo
├───────────────────────────────────────────────┤
│  Aplicação / Casos de uso                     │  orquestra regras, valida permissões e tenant
├───────────────────────────────────────────────┤
│  Domínio (regras de negócio por módulo)       │  o coração; independente de infra
├───────────────────────────────────────────────┤
│  Dados / Integrações                          │  persistência, serviços externos, fiscal, pagamentos
├───────────────────────────────────────────────┤
│  Plataforma (auth, tenant, billing, logs)     │  serviços transversais
└───────────────────────────────────────────────┘
```

- **Regras de negócio no centro, isoladas de detalhes de infraestrutura.** Trocar banco, provedor ou UI não deve reescrever regras.
- **Integrações nas bordas** (fiscal, pagamentos, marketplaces) atrás de contratos, para serem adicionadas/trocadas sem impacto no núcleo.

---

## 6. Decisões-Chave para Suportar Milhares de Empresas

Checklist das decisões que **precisam** estar corretas desde o início:

1. **Multi-tenancy com isolamento rigoroso** (Seção 3).
2. **Contexto de tenant propagado e obrigatório** em toda operação.
3. **Identidade e permissões centralizadas** (autenticação via serviço robusto; papéis desde o MVP; permissões granulares evoluíveis).
4. **Modelo de dados com chaves de tenant e índices pensados para consultas por empresa**, evitando reprojeto quando o volume crescer.
5. **Operações críticas atômicas e consistentes** (estoque/financeiro) — correção acima de tudo.
6. **Escalabilidade horizontal**: componentes sem estado onde possível, para escalar por réplicas.
7. **Assíncrono onde faz sentido**: efeitos secundários e tarefas pesadas (relatórios, notificações) preparados para processamento em segundo plano, evitando travar a operação.
8. **Billing e limites por plano** como parte da plataforma (feature flags / ativação de módulos por assinatura).
9. **Observabilidade e auditoria** (logs, métricas, trilha de auditoria) desde cedo para operar em escala com segurança.
10. **Backups, recuperação e continuidade** como requisitos fundacionais dos dados do cliente.
11. **Versionamento de contratos/integrações** para evoluir sem quebrar consumidores (importante para a futura API pública).
12. **Preparação para performance de leitura** (indicadores/relatórios): separar leitura pesada da operação transacional quando o volume exigir, sem reescrever o núcleo.

---

## 7. Segurança e Privacidade (fundacional)

- **Isolamento de dados por tenant** verificável e testado.
- **Controle de acesso** por papéis (e futuramente permissões finas).
- **Proteção de dados sensíveis** e conformidade com a LGPD como diretriz desde o início.
- **Autenticação robusta** delegada a solução especializada/confiável.
- **Trilha de auditoria** para ações críticas.
- **Princípio do menor privilégio** em acessos internos e integrações.

---

## 8. Escalabilidade e Evolução (o caminho de crescimento)

| Estágio | Realidade | Estratégia arquitetural |
|---|---|---|
| **Início (MVP)** | Dezenas/centenas de empresas | Monolito modular, base compartilhada com isolamento lógico, escalar verticalmente + réplicas |
| **Crescimento** | Milhares de empresas | Escala horizontal, processamento assíncrono, otimização de leitura (relatórios/indicadores) |
| **Escala** | Dezenas de milhares | Extrair módulos de alta carga em serviços, particionamento/segmentação de dados, cache, isolamento de grandes contas |
| **Maturidade** | Plataforma/ecossistema | API pública versionada, marketplace, possivelmente multi-região |

> Cada estágio **se apoia** no anterior. Nenhuma transição exige jogar fora a fundação — esse é o teste de sucesso da arquitetura.

---

## 9. O que NÃO decidimos agora (deliberadamente)

Para respeitar a fase de Discovery, estas decisões ficam para a etapa de arquitetura de execução:

- Stack específica (linguagens, frameworks, banco, provedor de auth/infra).
- Esquema de dados detalhado e modelagem física.
- Estratégia exata de deploy, CI/CD e ambientes.
- Detalhes de particionamento/sharding.
- Escolha de ferramentas de observabilidade e billing.

O compromisso deste documento é garantir que, **qualquer que seja a stack escolhida**, os princípios acima sejam respeitados — para que o Rescript possa crescer por 10 anos sem uma reescrita fundamental.

---

## 10. Testes de Sanidade da Arquitetura (perguntas de verificação)

Antes de qualquer decisão técnica futura, ela deve passar por:

1. **Isola tenants?** A mudança preserva o isolamento entre empresas?
2. **Cresce sem reescrever?** Precisaremos refazer isso quando dobrarmos/decuplicarmos a escala?
3. **Mantém o núcleo simples?** Isso complica a operação diária do usuário ou o núcleo do sistema?
4. **É reversível/substituível?** Está nas bordas (trocável) ou está contaminando o centro?
5. **Preserva a consistência dos números?** Estoque e financeiro continuam sempre corretos?

Se qualquer resposta for desfavorável, a decisão deve ser repensada.
