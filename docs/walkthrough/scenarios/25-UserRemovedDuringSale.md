# Cenário 25 — Usuário Removido Durante Operação

## Cenário

Vendedor abre Sale; owner remove membership; vendedor tenta confirmar depois.

### Objetivo
Autorização no commit; sessão antiga não bypassa RLS/membership.

### Atores
Owner; Vendedor

### Estado inicial
Sale em Pedido criada pelo vendedor; membership active.

### Pré-condições
Owner tem `members.remove`.

### Passos executados

#### 1. RemoveMember
1. **Comando:** `RemoveMember(user=V)`
2. **Autorização:** owner/admin
3. **Validações:** não remover último owner
5–6. Membership→inactive/removed; Audit
9–10. MembershipRevoked outbox

#### 2. ConfirmSale com sessão antiga
1. **Comando:** ConfirmSale
2. **Autorização:** **falha** — membership inativa no início da TX
3. **Validações:** JWT pode estar válido; **autorização de tenant falha**
5–6. Nenhuma alteração Sale/estoque
13. Erro 403 / membership_inactive
14. Recuperação: reinvitar; outro usuário confirma

### Estado final esperado
Sale permanece Pedido; reserva intacta até expirar/outro ator.

### Invariantes verificadas
Authz no ponto crítico; RLS org; sem efeito parcial.

### Inconsistências encontradas
- Sale.created_by aponta para usuário sem membership — OK historicamente.
- Quem “herda” Sales abertas do removido? Processo operacional não modelado.

### Ajustes recomendados
Job/insight “pedidos órfãos”; política de reassign opcional V1.

### Classificação
**aprovado com ressalvas**
