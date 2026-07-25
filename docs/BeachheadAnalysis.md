# Rescript — Análise de Beachhead (Wedge Inicial)

> Documento oficial de análise dos segmentos de entrada (cabeça de ponte).
> Objetivo: identificar até 3 segmentos comerciais para dominar primeiro — não construir um ERP genérico para todos.
> Status: Estratégia (pré-arquitetura técnica). **Recomendação fundamentada, sem escolha definitiva.**

---

## 0. Por que Beachhead

Vencer o mercado inteiro de uma vez é impossível para uma startup. A estratégia é **dominar um nicho estreito** onde a dor é aguda e a indicação corre rápido, provar o modelo, e só então expandir para segmentos adjacentes. Um segmento dominado gera densidade, referência e aprendizado — a base para crescer sem queimar capital (ver `GoToMarket.md`).

A tese central ("mostrar ao dono o que precisa de atenção antes do problema") é mais poderosa em segmentos com **estoque relevante + vendas recorrentes + operação fragmentada** — onde há muito o que interpretar e muito risco de erro invisível.

---

## 1. Critérios de Avaliação

Cada segmento é avaliado (nota 1–5, maior = melhor para nós) em:

1. **Intensidade da dor** — o quanto sofrem hoje.
2. **Facilidade de aquisição** — quão fácil alcançá-los e convertê-los.
3. **Ticket possível** — disposição/capacidade de pagar.
4. **Frequência de uso** — quão diário é o uso (liga com North Star).
5. **Retenção provável** — quão "grudento" o produto fica.
6. **Complexidade fiscal** — quão compatível com integrações disponíveis (menor complexidade = nota maior).
7. **Complexidade operacional** — quão dentro do nosso núcleo simples (menor = nota maior).
8. **Domínio do nicho** — potencial de virarmos padrão e a indicação correr.
9. **Velocidade até o "aha"** — quão rápido chegam à primeira operação completa + primeira conclusão útil.

---

## 2. Perfil comum exigido (filtro de entrada)

Todo segmento candidato precisa ter:
- vendas recorrentes;
- controle de estoque relevante;
- equipe pequena;
- operação hoje fragmentada (planilha/caderno/WhatsApp);
- uso intenso de WhatsApp;
- baixa maturidade tecnológica;
- dor clara de falta de controle;
- potencial de indicação dentro do segmento;
- necessidade fiscal compatível com integrações disponíveis.

---

## 3. Segmento A — Distribuidoras / Atacado de pequeno porte

*(bebidas, alimentos, descartáveis, cosméticos para revenda, produtos de limpeza)*

**Por que é forte:** vendem **B2B recorrente** (o mesmo comércio recompra toda semana), estoque é o coração do negócio, e a operação vive no WhatsApp (pedidos chegam por mensagem). A dor de "não saber o que tenho, o que vendi e quem me deve" é aguda e cara.

| Critério | Nota | Comentário |
|---|---|---|
| Intensidade da dor | 5 | Estoque + prazo + inadimplência doem muito |
| Facilidade de aquisição | 4 | Nichos organizados, muita indicação entre pares |
| Ticket possível | 4 | Faturamento e margem sustentam assinatura |
| Frequência de uso | 5 | Uso diário intenso (pedidos o dia todo) |
| Retenção provável | 5 | Vira infraestrutura; sair é doloroso |
| Complexidade fiscal | 3 | Emite nota; exige integração fiscal cedo |
| Complexidade operacional | 3 | Prazo, tabelas de preço, recorrência (dentro do núcleo, mas puxa V1/V2) |
| Domínio do nicho | 5 | Boca a boca fortíssimo dentro do setor |
| Velocidade até o "aha" | 4 | Muitos dados → insights aparecem rápido |
| **Média** | **4,2** | **Candidato mais forte** |

**Riscos:** exige fiscal e vendas a prazo relativamente cedo (V1). Operação B2B recorrente pode puxar recursos (tabelas de preço, condições) que precisam ser contidos para não inflar o núcleo.

---

## 4. Segmento B — Varejo especializado com estoque técnico

*(autopeças, material de construção, elétrica/hidráulica, ferragens)*

**Por que é forte:** estoque grande, com muitos SKUs e giro desigual — exatamente onde a inteligência de ruptura/parado/margem brilha. Dor clara de capital empatado e de perder venda por falta de item.

| Critério | Nota | Comentário |
|---|---|---|
| Intensidade da dor | 5 | Muitos SKUs, ruptura e encalhe frequentes |
| Facilidade de aquisição | 3 | Mais disperso; indicação existe mas menos viral |
| Ticket possível | 4 | Boa capacidade de pagar |
| Frequência de uso | 5 | Balcão o dia todo |
| Retenção provável | 5 | Catálogo grande gruda muito |
| Complexidade fiscal | 3 | Emite nota; integração fiscal necessária |
| Complexidade operacional | 3 | Muitos SKUs, códigos, variações — exige bom cadastro/importação |
| Domínio do nicho | 4 | Nichos com associações e grupos |
| Velocidade até o "aha" | 3 | Cadastro inicial grande pode atrasar o aha (mitigar com importação) |
| **Média** | **3,9** | **Forte segundo lugar** |

**Riscos:** o volume de SKUs eleva o atrito de ativação (importação vira essencial já na entrada). Cadastro técnico pode assustar — precisa de onboarding com importação e dados de exemplo.

---

## 5. Segmento C — Pet shops / Agropet

**Por que é forte:** consumo recorrente (ração, medicamentos), clientes fiéis, estoque relevante e uso intenso de WhatsApp para pedidos e lembretes. Dor de controle clara e ticket recorrente saudável.

| Critério | Nota | Comentário |
|---|---|---|
| Intensidade da dor | 4 | Estoque + validade + recorrência |
| Facilidade de aquisição | 4 | Segmento coeso, comunidades ativas |
| Ticket possível | 3 | Menor que distribuidoras |
| Frequência de uso | 5 | Uso diário |
| Retenção provável | 4 | Recorrência ajuda a reter |
| Complexidade fiscal | 3 | Emite nota; integração necessária |
| Complexidade operacional | 4 | Relativamente simples; cabe bem no núcleo |
| Domínio do nicho | 4 | Boa indicação entre lojistas |
| Velocidade até o "aha" | 4 | Catálogo gerenciável; aha rápido |
| **Média** | **3,9** | **Forte terceiro** |

**Riscos:** ticket menor pressiona a economia; validade/lote pode puxar recursos específicos (conter no núcleo, tratar como futuro se necessário).

---

## 6. Comparativo consolidado

| Critério | A. Distribuidoras | B. Varejo técnico | C. Pet/Agro |
|---|---|---|---|
| Intensidade da dor | 5 | 5 | 4 |
| Facilidade de aquisição | 4 | 3 | 4 |
| Ticket possível | 4 | 4 | 3 |
| Frequência de uso | 5 | 5 | 5 |
| Retenção provável | 5 | 5 | 4 |
| Complexidade fiscal | 3 | 3 | 3 |
| Complexidade operacional | 3 | 3 | 4 |
| Domínio do nicho | 5 | 4 | 4 |
| Velocidade até o "aha" | 4 | 3 | 4 |
| **Média** | **4,2** | **3,9** | **3,9** |

---

## 7. Recomendação Fundamentada

**Recomendação primária: começar pelo Segmento A — Distribuidoras / Atacado de pequeno porte.**

Razões:
1. **Maior intensidade de dor + maior retenção + maior viralidade de indicação** — o combo ideal para um beachhead.
2. **Frequência de uso altíssima** alimenta diretamente a North Star (operações por empresa/semana).
3. **Terreno fértil para a tese de inteligência:** muito estoque, prazo e inadimplência = muitas conclusões úteis e de alto impacto (ruptura, caixa projetado, inadimplência, concentração).
4. **WhatsApp já é o canal de vendas** do segmento — o wedge de WhatsApp (V2) cai como uma luva.

**Ressalva crítica (honesta):** distribuidoras exigem **fiscal e vendas a prazo mais cedo**, o que pressiona o roadmap (fiscal já em V1). Se a prioridade for o caminho de menor complexidade inicial e "aha" mais rápido, **Pet/Agro (C)** é a alternativa mais leve para validar o núcleo antes de encarar a complexidade B2B.

**Sequência sugerida (não definitiva):**
- **Beachhead primário:** Distribuidoras (A) — maior prêmio, maior aprendizado.
- **Expansão adjacente natural:** Varejo técnico (B) — compartilha a dor de estoque/SKU.
- **Alternativa de validação leve:** Pet/Agro (C) — se quisermos provar o núcleo com menos atrito fiscal/operacional primeiro.

> **Não estamos escolhendo definitivamente agora.** A decisão final deve considerar acesso real a esses clientes (rede dos fundadores), custo de aquisição observado e disponibilidade da integração fiscal. Recomenda-se validar com **entrevistas e um piloto** em 1–2 desses segmentos antes de comprometer o roadmap.

---

## 8. Como o Beachhead afeta o produto

- **Núcleo permanece genérico o suficiente** para os três — não construímos features exclusivas de um segmento no MVP (protege a simplicidade e a expansão futura).
- **Onboarding e conteúdo são específicos do segmento** (linguagem, exemplos, dados de demonstração do nicho) — a especialização mora no GTM, não no código do núcleo.
- **A ordem do roadmap (fiscal, prazo, WhatsApp) é sensível ao segmento escolhido** — ver `Roadmap.md`.

---

## 9. Relação com os Demais Documentos

- **ICP e personas:** `IdealCustomerProfile.md`, `Personas.md`.
- **Como adquirir e dominar:** `GoToMarket.md`.
- **Wedge de WhatsApp:** `Product.md` (seção WhatsApp) e `Roadmap.md` (V2).
- **Métricas de validação:** `Activation.md`, `NorthStarMetric.md`.
