# Cobertura de Invariantes

| Invariante / regra | Cenários que exercitam | Status |
|---|---|---|
| Tenant ownership / C-TENANT-01 | 02,34,43,54 | coberto |
| Sale máquina de estados G6 | 05–14,41,42 | coberto; gap Pedido+TTL (11) |
| Reserva ≠ movimento FD-02 | 06,07,08,11,12 | coberto |
| Confirm atômico RN-32/44 | 08,09,32 | coberto |
| Cancel compensação RN-33 | 13,14 | coberto; 14 aberto |
| Custo médio FD-01 | 03,18,19,50 | coberto; OQ-09 |
| Custo saída imutável | 08,13,18 | coberto |
| Quantity sem float FD-06 | 38 | coberto; OQ-01 |
| Desconto FD-05 | 05,39 | coberto |
| Payment não booleano | 15–17,47 | coberto |
| Idempotência ops críticas | 09,16,32,49 | coberto; hash (49) |
| Append-only ledger | 08,13,18–21 | coberto |
| Insights sem inventar | 28,29,53 | coberto |
| ≥1 owner | 40 | coberto com ressalva |
| RN-34 negativo | 10 vs H-02 | **conflito** |
| RN-92 config não reescreve | 45 | coberto |
| Anti-caos variantes FD-08 | 04 | coberto |
| Snapshots comerciais | 08,36,37 | coberto; 37 aberto |
| Outbox na TX | 08,33 | coberto |
| Membership no commit | 25,26 | coberto |
