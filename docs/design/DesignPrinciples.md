# Princípios de Design

---

## 1. Filosofia visual

O Rescript transmite a sensação de um **instrumento preciso** — como um cockpit limpo, não um balcão de papéis.

Identidade oficial: nasce da logo (`BrandIdentity.md`) — traço fino, ritmo das três barras, verde de clareza (não dinheiro), degradê só institucional.

| Qualidade | Como o design entrega |
|---|---|
| **Calma** | Superfícies claras, poucos acentos, ritmo generoso, sem alertas vermelhos em massa |
| **Menos ansiedade** | “Requer atenção” curado (poucos itens certos); severidade tipada; nunca gritar tudo |
| **Menos carga cognitiva** | Progressive disclosure; defaults sensatos; um job por tela; números com contexto |
| **Confiança** | Tipografia estável; estados explícitos; origem dos dados nos insights; confirmações claras |
| **Velocidade** | Command palette; atalhos; ações primárias óbvias; listas densas mas legíveis |
| **Inteligência** | Conclusão + ação; inteligência quieta; sem mascote de IA nem glow “mágico” |
| **Simplicidade** | Remover antes de adicionar; se precisa de tooltip para existir, questionar o campo |
| **Não infantil** | Zero confete/emoji como sistema; humor seco e raro; sem ilustrações cartoon |
| **Não burocrático** | Formulários curtos; labels humanas; sem jargão fiscal no núcleo |
| **Não ERP antigo** | Sem grids infinitos de campos; sem abas de configuração densas; sem “módulos” gritados |

---

## 2. Os 10 mandamentos de UX

1. Menos cliques  
2. Menos leitura  
3. Menos campos  
4. Menos configuração  
5. Menos telas  
6. Mais contexto  
7. Mais clareza  
8. Mais confiança  
9. Mais previsibilidade  
10. Mais velocidade  

---

## 3. Regras de ouro

1. **Nenhuma tela existe porque “todo ERP tem”.**  
2. **Conclusão > gráfico.** (Central de Decisão)  
3. **Uma ação primária por vista.**  
4. **Configuração é exceção; padrão é o caminho feliz.**  
5. **Feedback em < 100ms percebido** para ações locais; skeleton para rede.  
6. **Erro = o que aconteceu + o que fazer.** Nunca stack trace.  
7. **Domínio vence UX** em conflito de regra de negócio.  
8. **Inteligência nunca compete com a tarefa** — aparece ao lado, não no centro do fluxo operacional.

---

## 4. Como o sistema “pensa” a interface

```
Registrar com mínimo fricção
        ↓
Automatizar consequências (invisível)
        ↓
Interpretar só o confiável
        ↓
Mostrar conclusão + próxima ação
```

---

## 5. Anti-padrões proibidos

- Dashboard mural de KPIs sem ação  
- Wizard de 8 passos para cadastro simples  
- Modal sobre modal  
- Cores semânticas decorativas (verde em tudo “porque sucesso”)  
- Densidade de planilha como default  
- Dark mode forçado como identidade  
- Purple gradient / glow AI / cream+terracotta clichê  
- Labels “Salvar dados do formulário”  
- Status “Pago: Sim/Não” (domínio: situações financeiras ricas)
