---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: architecture / Privacy
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Rescript — Privacidade e LGPD

> Orientação técnica de privacidade e proteção de dados pessoais. **Não é parecer jurídico** — deve ser validado por profissional quando necessário.
> Status: Design de arquitetura (pré-implementação).

---

## 1. Escopo e Postura

O Rescript trata dados pessoais de: usuários da plataforma (donos, operadores) e clientes finais das empresas (nome, contato, documento, histórico de compra). Postura: **minimização, finalidade, segurança e transparência** desde o design (privacy by design).

> Aviso: as afirmações aqui são **orientação técnica**. Termos, bases legais e prazos definitivos exigem validação jurídica.

---

## 2. Papéis na LGPD (a definir juridicamente)

- **Empresa cliente (tenant):** tipicamente **controladora** dos dados dos seus clientes finais.
- **Rescript:** tipicamente **operador**, tratando dados em nome da empresa cliente.
- Essa relação deve ser formalizada em contrato/DPA (validação jurídica). A arquitetura suporta ambos os papéis por meio do isolamento por tenant.

---

## 3. Princípios Aplicados

| Princípio LGPD | Como a arquitetura apoia |
|---|---|
| **Finalidade** | Dados coletados para operação comercial; sem uso incompatível |
| **Minimização** | Coletar/registrar só o necessário; logs sem PII excessiva (`Observability.md`) |
| **Segurança** | Defesa em profundidade (`Security.md`), criptografia, RLS |
| **Transparência** | Auditoria (`AuditArchitecture.md`); histórico rastreável |
| **Qualidade** | Confiança nos dados (`DataTrust.md`); correção auditável |
| **Responsabilização** | Trilhas de auditoria; controle de acesso |

---

## 4. Dados Pessoais e Sensíveis

- **Pessoais:** nome, contato, documento (CPF/CNPJ), endereço, histórico.
- **Financeiros:** valores, recebíveis (tratados com o mesmo rigor).
- Evitar coletar dados **sensíveis** (LGPD art. 5º II) salvo necessidade real e base legal.
- Dados de pagamento de cartão: **não armazenar** dados sensíveis de cartão; delegar a gateway (`Entitlements.md`/Billing).

---

## 5. Direitos dos Titulares (suporte arquitetural)

| Direito | Suporte técnico |
|---|---|
| **Acesso** | Consultar dados do titular por organização |
| **Correção** | Edição auditável (`DataTrust.md`) |
| **Portabilidade** | Exportação em formato estruturado (`ImportArchitecture.md` inverso) |
| **Eliminação** | Descarte respeitando obrigações legais (ver §7) |
| **Anonimização** | Quando aplicável, remover identificabilidade preservando histórico agregado |

> Atender a pedidos de titulares envolve fluxo operacional + jurídico; a arquitetura fornece as capacidades (consulta, exportação, anonimização por tenant).

---

## 6. Retenção

| Dado | Retenção (orientação, validar) |
|---|---|
| Dados operacionais (vendas, estoque, financeiro) | Enquanto a conta ativa + obrigações legais/fiscais |
| Documentos fiscais (XML/PDF) | Conforme prazo legal fiscal |
| Audit logs | Longo prazo (compliance) |
| Logs técnicos | Curto/médio prazo |
| Arquivos temporários de importação | Descarte após processamento (`ImportArchitecture.md`) |
| Backups | Janela definida, criptografados (`Security.md`) |
| Dados após cancelamento | Janela de retenção, depois descarte/anonimização (§7) |

---

## 7. Cancelamento, Descarte e o Conflito com "Não Destruir Histórico"

Há uma **tensão real** entre:
- **AP16/AP13** (não destruir histórico financeiro/operacional), e
- **Direito de eliminação** (LGPD).

**Resolução arquitetural:**
- Suspensão/cancelamento **não apagam** dados imediatamente — há **janela de retenção** (recuperação da conta + obrigações legais).
- Após a janela e cumpridas as obrigações legais (ex.: guarda fiscal), aplica-se **descarte** ou **anonimização**:
  - **Anonimização** preserva a integridade do histórico agregado (vendas, ledger) removendo a identificabilidade do titular (ex.: cliente vira "cliente removido"), atendendo a eliminação **sem** quebrar o ledger.
- Obrigações legais de guarda (fiscal) **prevalecem** sobre eliminação enquanto vigentes — decisão a validar juridicamente.

> Preferência técnica: **anonimizar** dados pessoais mantendo os lançamentos financeiros/estoque íntegros, conciliando LGPD e integridade contábil.

---

## 8. Transferência e Compartilhamento

- Dados podem ser processados por **suboperadores** (Supabase, Vercel, provedor fiscal, gateway, mensageria) — mapear e formalizar (DPA).
- Transferência internacional de dados (ex.: hospedagem) deve ser avaliada juridicamente; preferir regiões adequadas quando possível.

---

## 9. Consentimento (mensageria)

- Comunicações via WhatsApp/e-mail respeitam **consentimento e opt-out** por finalidade (`MessagingArchitecture.md`).
- Transacional × marketing tratados conforme lei e regras do canal.

---

## 10. Invariantes

1. **Minimização** em todo registro e log.
2. Isolamento por tenant garante segregação de dados pessoais entre empresas.
3. **Eliminação** conciliada com integridade via **anonimização** + respeito a obrigações legais.
4. Dados sensíveis de pagamento **não** são armazenados por nós.
5. Suboperadores mapeados; segredos e acessos mínimos.
6. Toda a documentação de privacidade é **orientação técnica** sujeita a validação jurídica.
