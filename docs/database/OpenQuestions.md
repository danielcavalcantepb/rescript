# Questões Abertas do Fundador

> Recomendações técnicas **não** são decisões aprovadas.

| ID | Questão | Recomendação | Impacto se adiar |
|---|---|---|---|
| **OQ-01** | Precisão decimal exata por unidade | un/cx/pct=0; kg/L=3; g=0 ou 1; m=3 | Bloqueia validação Quantity |
| **OQ-02** | Expiração padrão de reservas | 72h para Pedido; configurável | Precisa default na policy |
| **OQ-03** | Orçamento reserva por padrão? | **Não** por padrão; Pedido sim | Afeta ReservationPolicy |
| **OQ-04** | % desconto sem autorização | 5% default; configurável | DiscountPolicy seed |
| **OQ-05** | Money: centavos int vs NUMERIC | **NUMERIC(19,6)** store / scale 2 BRL display **ou** cents — preferir NUMERIC | Schema físico |
| **OQ-06** | Momento extrair Order | Só com gatilhos FD-03 | Nenhum no MVP |
| **OQ-07** | Provedores externos | Fora desta fase | Integrações |
| **OQ-08** | Estoque negativo | Seguir RN-34: allow_with_alert default | Policy seed — **conflito potencial** com lista “aberto”: ver ConsistencyReview |
| **OQ-09** | Custo médio global variant vs por local | **Por (org, location, variant)** | AverageCost keys |
| **OQ-10** | Múltiplos locais no MVP | **1 local padrão**, modelo multi-local ready, UI single | StockLocation |

### Próximo passo sugerido
Fundador decide OQ-01, OQ-02, OQ-03, OQ-04, OQ-05, OQ-08, OQ-09, OQ-10 antes do schema físico. OQ-06/07 podem permanecer abertas.
