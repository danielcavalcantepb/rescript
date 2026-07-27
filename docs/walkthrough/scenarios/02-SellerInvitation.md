---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 02-SellerInvitation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 02 — Convite de Vendedor

## Cenário

Proprietário convida vendedor; convite expira ou é aceito; vendedor opera em multi-org; tentativa de acesso cross-tenant falha; remoção revoga acesso imediato.

### Objetivo
Validar ciclo de convite, membership, isolamento RN-01 e revogação instantânea.

### Atores
- Proprietário (Org A)
- Vendedor convidado (User B)
- Proprietário de Org C (multi-org opcional)
- Sistema (expiração de convite)

### Estado inicial
Org A ativa com Proprietário; User B existe ou será criado no accept; Org C opcional para teste multi-org.

### Pré-condições
- Org A com entitlement de usuários
- Limite de seats não atingido (RN-05)
- E-mail do convidado válido

### Passos executados

#### 1. Emitir convite
1. **Comando:** `InviteMember` (email, role=Vendedor, org=A)
2. **Autorização:** `members.invite` (Proprietário/Admin)
3. **Validações:** convite uso único; expiração configurável; e-mail não duplica membership ativa
4. **Consultadas:** Membership existente, Invite pendente, plan limits
5. **Criadas:** Invite (status=pending, expires_at, token hash)
6. **Alteradas:** nenhuma membership ainda
7. **Locks:** unique pending invite por (org, email) recomendado
8. **Auditoria:** quem convidou, quando, papel proposto
9. **Eventos:** `MemberInvited`
10. **Outbox:** e-mail de convite (assíncrono)
11. **Derivados:** contagem de convites pendentes
12. **Insight:** nenhum crítico
13. **Falha:** limite de plano → RN-05 mensagem + upgrade
14. **Recuperação:** upgrade ou revogar convite antigo

#### 2a. Aceitar convite (caminho feliz)
1. **Comando:** `AcceptInvite` (token)
2. **Autorização:** token válido; convidado autenticado ou signup inline
3. **Validações:** não expirado; não revogado; não consumido
4. **Consultadas:** Invite, User por e-mail
5. **Criadas:** Membership (org=A, role=Vendedor)
6. **Alteradas:** Invite → accepted/consumed
7. **Locks:** token single-use
8. **Auditoria:** `MemberJoined`
9. **Eventos:** `InviteAccepted`, `MemberJoined`
10. **Outbox:** notificação ao Proprietário
11. **Derivados:** lista de membros atualizada
12. **Insight:** nenhum
13. **Falha:** token inválido
14. **Recuperação:** reenviar convite (`InviteMember` novo)

#### 2b. Convite expirado (caminho alternativo)
1. **Comando:** job `ExpireInvites` ou validação no accept
2. **Autorização:** sistema
3. **Validações:** now > expires_at
4. **Consultadas:** Invite pending
5. **Criadas:** nenhuma membership
6. **Alteradas:** Invite → expired
7. **Locks:** idempotente por invite_id
8. **Auditoria:** expiração automática
9. **Eventos:** `InviteExpired`
10. **Outbox:** opcional lembrete ao admin
11. **Derivados:** convite removido da lista ativa
12. **Insight:** nenhum
13. **Falha:** accept após expiração → erro claro
14. **Recuperação:** novo convite

#### 3. Multi-org e switch de contexto
1. **Comando:** `SwitchOrganizationContext` (UI) / header tenant
2. **Autorização:** membership ativa na org alvo
3. **Validações:** RN-01 — dados filtrados por org_id
4. **Consultadas:** Memberships do User B
5. **Criadas:** nenhuma (sessão/contexto)
6. **Alteradas:** contexto ativo de tenant
7. **Locks:** nenhum
8. **Auditoria:** troca de contexto sensível (opcional)
9. **Eventos:** nenhum de domínio crítico
10. **Outbox:** nenhum
11. **Derivados:** queries escopadas
12. **Insight:** indicadores da org ativa apenas
13. **Falha:** org sem membership
14. **Recuperação:** convite na org correta

#### 4. Tentativa de acesso à org errada
1. **Comando:** API/query com org_id=B enquanto membership só em A
2. **Autorização:** falha RN-01 + RLS (implementação)
3. **Validações:** membership recheck no início da TX (ConcurrencyModel)
4. **Consultadas:** AuthorizationDataModel
5. **Criadas:** nenhuma
6. **Alteradas:** nenhuma
7. **Locks:** nenhum
8. **Auditoria:** tentativa negada (segurança)
9. **Eventos:** nenhum de negócio
10. **Outbox:** alerta de segurança opcional
11. **Derivados:** nenhum vazamento
12. **Insight:** nenhum
13. **Falha:** 403 consistente
14. **Recuperação:** n/a

#### 5. Remoção de membership
1. **Comando:** `RemoveMember` / `RevokeMembership`
2. **Autorização:** Proprietário; não remover último Proprietário
3. **Validações:** invariante "exatamente um proprietário"
4. **Consultadas:** Membership, papéis
5. **Criadas:** nenhuma
6. **Alteradas:** Membership → revoked/inactive (imediato)
7. **Locks:** nenhum
8. **Auditoria:** quem removeu, quando
9. **Eventos:** `MemberRemoved`
10. **Outbox:** invalidação de sessões (implementação)
11. **Derivados:** seat liberado
12. **Insight:** nenhum
13. **Falha:** remover único Proprietário
14. **Recuperação:** transferir propriedade antes

### Estado final esperado
Vendedor com acesso só às orgs autorizadas; convites expirados inativos; tentativa cross-tenant bloqueada; remoção efetiva imediata.

### Invariantes verificadas
G1, RN-01, RN-02; convite uso único; revogação imediata de membership.

### Inconsistências encontradas
- Comportamento de sessão JWT após remoção mid-op não especificado em domínio — ConcurrencyModel menciona recheck na TX, mas invalidação de token é lacuna de arquitetura.
- Papéis MVP simplificados vs. permissões granulares futuras — aceitável, mas UX de "Vendedor" deve mapear permissões explícitas.

### Ajustes recomendados
- ADR ou nota de segurança: invalidação de sessão vs. recheck por request.
- Teste E2E de operação longa com membership revogada no meio.

### Classificação
**aprovado com ressalvas**
