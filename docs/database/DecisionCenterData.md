# Dados da Central de Decisão

> Não criar tabela `dashboard` sem necessidade. Composição por leituras + insights.

---

## 1. Blocos → fontes

| Bloco | Fonte lógica |
|---|---|
| Hoje | agregações Sale confirmadas hoje; payments today |
| Requer atenção | Insights active severity≥attention; overdue installments; low stock |
| Próximos dias | installments due soon; reservations expiring; quote_valid_until |
| Oportunidades | Insights recommendation |
| Visão geral | summaries período |
| Tudo sob controle | zero insights críticos + dados suficientes |
| Lacunas de dados | checks: sem produtos, sem custo, sem movimentação |

---

## 2. Estratégia de materialização

| Abordagem | Quando |
|---|---|
| Query tempo real | volumes baixos (início) |
| View | agregações simples |
| Snapshot / cache por org | Home quente |
| Materialized view futura | escala (Scalability) |

**Nunca** tratar cache da Home como FT.

---

## 3. Permissões
Composição filtra por permission (financeiro oculto para quem não tem).

---

## 4. O que não persistir como primário
- Totais do dashboard
- “Saúde da empresa” score genérico sem regra
- Duplicar ledgers na Home
