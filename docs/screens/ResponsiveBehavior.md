# Comportamento Responsivo (por superfície)

> Não assumir a mesma UX em todos os breakpoints. Ver também `docs/design/Responsive.md`.

| Breakpoint | Largura | Shell |
|---|---|---|
| Mobile | < 768 | Bottom nav ou menu hamburger; sem sidebar fixa |
| Tablet | 768–1024 | Sidebar colapsada (ícones) |
| Notebook | 1024–1440 | Shell completo |
| Desktop wide | > 1440 | Limitar measure da Central; tabelas com max useful width |

---

## Matriz tela × prioridade

| Tela | Desktop | Tablet | Mobile | Nota |
|---|---|---|---|---|
| CentralDecision | ★★★ | ★★★ | ★★★ | Mobile: atenção primeiro |
| SalesList / SaleDetail | ★★★ | ★★ | ★★ | Mobile: consulta + confirmar simples |
| SaleWizard | ★★★ | ★★ | ★ | **Desktop-first** se muitos itens/variantes |
| ProductCreate (variantes) | ★★★ | ★ | ○ | **Desktop-first** explícito |
| ImportWizard | ★★★ | ★ | ○ | **Desktop-first** |
| InventoryOverview | ★★★ | ★★ | ★★ | Mobile: busca + saldo |
| Receivables / Payment | ★★★ | ★★ | ★★ | Pagamento em sheet |
| Customers* | ★★★ | ★★ | ★★ | Create ok no mobile |
| Settings / Users / Audit | ★★★ | ★★ | ★ | Raro no mobile |
| Insights lista | ★★★ | ★★ | ★★ | |

★★★ completo · ★★ essencial · ★ limitado · ○ redirecionar “Melhor no computador”

---

## Padrões mobile

- Tabelas → lista de cards  
- Drawer → full-screen sheet  
- Modal → sheet bottom  
- Primary action → sticky bottom  
- Command palette → full screen search  

---

## Offline

MVP: toast “Sem conexão” + disable submits; não app offline-first. Estado `Offline` documentado por tela como mensagem global.
