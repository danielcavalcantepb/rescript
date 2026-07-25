# Design QA e Revisão Crítica

---

## 1. Checklist de marca (obrigatório)

Antes de aprovar qualquer tela:

- [ ] A tela parece **Rescript**?
- [ ] Transmite **calma**?
- [ ] Transmite **precisão**?
- [ ] Transmite **organização**?
- [ ] Excesso de informação?
- [ ] Excesso de cor?
- [ ] Excesso de bordas?
- [ ] Excesso de sombras?
- [ ] Excesso de animações?
- [ ] O **degradê** está só em momento institucional?
- [ ] A **tipografia** conversa com a logo (Geist, clara, sem grito)?
- [ ] O símbolo de **três barras** está correto (não genérico)?
- [ ] Verde comunica clareza/ordem — não “dinheiro”?

Autoridade: `BrandIdentity.md` §12.

---

## 2. Uma tela só pode ser aprovada se:

1. Responde a um job claro do usuário  
2. Tem **no máximo uma** ação primária óbvia  
3. Usa termos do domínio (Confirmada, disponível…)  
4. Não introduz regra que contradiz FounderDecisions / invariantes  
5. Funciona sem gráfico  
6. Empty / loading / erro / sem permissão definidos  
7. Contraste e foco pensados  
8. Passa nos 10 mandamentos  
9. Não parece ERP denso nem AI-glow  
10. Carga cognitiva declarada e justificada  
11. Passa no checklist de marca (§1)

---

## 3. Uma interação só pode existir se:

- Reduz tempo ou erro  
- Tem feedback  
- É reversível **ou** confirma com consequência clara  
- Não depende de hover-only  

---

## 4. Um modal só pode existir se:

- Confirmação destrutiva/irreversível, **ou**  
- Formulário ≤ ~5 campos que não merece rota, **ou**  
- Autorização pontual (desconto)  

Caso contrário → página ou drawer.

---

## 5. Revisão crítica da experiência

| Achado | Tipo | Mitigação |
|---|---|---|
| Venda com muitos estados | Confusão | Chip + CTAs só válidos |
| Três saldos de estoque | Carga | Default **disponível** |
| Cancelamento pós-pagamento | Ansiedade | Bloquear com caminho claro |
| Importação | Complexidade | Preview + partial commit |
| Central com muitos insights | Ruído | Teto 3–5 |
| Inteligência demais na cara | Protagonismo | Insights quietos; sem mascote |
| Degradê em CTA | Marca | Remover; usar primary sólido |
| Spinner genérico | Marca | BrandLoader (3 barras) |

---

## 6. Checklist pré-handoff

- [ ] Domínio OK?  
- [ ] Copy OK (voz de especialista)?  
- [ ] Empty/error/loading OK?  
- [ ] A11y mínima OK?  
- [ ] Parece Rescript (Quiet Instrument + logo oficial)?  
