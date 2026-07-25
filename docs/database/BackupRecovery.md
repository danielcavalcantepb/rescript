# Backup e Recuperação (estratégia)

> Sem configuração de provedor. Não é escolha de vendor.

---

## 1. Objetivos

| Objetivo | Alvo lógico MVP |
|---|---|
| RPO | ≤ 24h (melhor: contínuo/PITR quando infra permitir) |
| RTO | horas, não dias |
| Integridade | restore testável periodicamente |

## 2. O que proteger

- DB primário (todas as FT)  
- Object storage (FileObject) **consistente** com metadados  
- Segredos **fora** do DB de domínio  

## 3. Recuperação

- Restore point-in-time preferível a dump diário só  
- Runbook: outbox pode reprocessar; **não** reexecutar Confirm sem idempotency  
- Tenant restore seletivo = complexo (FUT); MVP restore full  

## 4. Testes

Restore drill periódico em ambiente isolado — ver TestingStrategy.
