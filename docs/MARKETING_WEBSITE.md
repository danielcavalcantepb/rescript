# Marketing Website

Status: Active  
Owner: Product Architecture / Frontend  
Última revisão: 2026-07-26  
Versão: 1.1  
Tipo: Canonical  
Escopo: Camada pública institucional da Rescript  
Substitui: —  
Substituído por: —  
Módulos relacionados: Marketing, Public Website, SEO, Design System

## Objetivo

O Marketing Website é a camada pública oficial da Rescript. Ele apresenta a Rescript como uma plataforma que conecta relacionamento, vendas, caixa, lucro e métricas — não como “apenas um ERP”.

A narrativa pública deve responder à pergunta: “eu usaria esse sistema olhando esta página?”. Para isso, a comunicação precisa transmitir confiança, conexão com clientes, clareza operacional, velocidade e maturidade enterprise sem virar uma lista fria de módulos.

## Direção de produto e marca

- A Rescript deve parecer uma plataforma viva, conectada e confiável.
- O discurso deve aproximar empresa e cliente, não apenas listar funcionalidades administrativas.
- O tom deve mostrar continuidade: primeiro contato, venda, estoque, caixa, margem, indicadores e recorrência operacional.
- O branding deve preservar a identidade Rescript: escuro elegante, verde institucional, tons quentes de apoio, bordas suaves, tipografia ampla e microinterações leves.
- Referências externas podem orientar ritmo, storytelling e hierarquia, mas nunca devem ser copiadas em layout, texto, identidade, ilustrações, dados ou marca.
- A linguagem visual pública da Rescript não deve usar fundos circulares concêntricos, radares, órbitas ou composições que remetam a identidades de terceiros.
- Quando a página precisar comunicar conexão, utilizar trilhas, cartões, planos, linhas operacionais, composições em camadas e superfícies de produto.
- O hero não deve depender de wallpaper abstrato. A primeira dobra precisa mostrar produto, contexto de loja física, relacionamento com cliente final, sinais de venda, caixa, margem e uma razão clara para confiar na plataforma.
- A linguagem visual deve derivar da marca Rescript: três barras, linhas horizontais, ritmo de instrumento, superfícies de decisão e precisão calma. Evitar fundos genéricos, grades decorativas sem função e metáforas visuais que poderiam pertencer a qualquer SaaS.
- A comunicação pública deve conversar com consumidores reais do conteúdo: donos, gestores e operadores de lojas físicas que pensam em relacionamento, venda, financeiro, lucro e métricas.
- A estrutura do topo deve priorizar hero centralizado, CTA duplo, mockup dominante do sistema e cards de valor abaixo do painel. A referência é estrutural: impacto, hierarquia, prova visual e ritmo; nunca cópia de texto, marca, produto ou componentes.
- O mockup deve falar a língua da marca. Evitar dashboards genéricos com gráficos comuns, sidebars padrão e cards intercambiáveis. Preferir camadas, réguas, linhas horizontais, três barras, leitura de margem e sinais operacionais com precisão calma.

## Restrições comerciais

Esta fundação pública não implementa nem promete:

- billing;
- checkout;
- assinatura;
- pagamento;
- cadastro;
- tenant;
- funcionalidades do ERP;
- automações comerciais;
- integrações de status real;
- formulários persistidos;
- agenda comercial ou fluxo de reunião.

Os CTAs permitidos nesta etapa devem ser institucionais:

- `Começar Agora`;
- `Conhecer os planos`;
- `Explorar camadas`;
- contato institucional.

## Arquitetura

- A rota `/` pertence ao website público.
- A aplicação autenticada mantém o layout protegido em `_app` e a Central operacional em `/app`.
- As páginas públicas usam TanStack Start, rotas de arquivo, SSR e metadata por rota.
- Conteúdo institucional compartilhado fica em `src/modules/marketing/content.ts`.
- SEO compartilhado fica em `src/modules/marketing/seo.tsx`.
- Componentes reutilizáveis ficam em `src/modules/marketing/ui`.

## Páginas

- `/`: Home institucional completa.
- `/features`: Recursos e diferenciais.
- `/modules`: Módulos e mapa operacional.
- `/pricing`: Planos com entrada para checkout de criação da empresa; sem cobrança real.
- `/about`: Sobre a Rescript.
- `/customers`: Estrutura para clientes e depoimentos reais.
- `/faq`: Perguntas frequentes.
- `/contact`: Contato institucional.
- `/privacy`: Privacidade placeholder para revisão jurídica.
- `/terms`: Termos placeholder para revisão jurídica.
- `/status`: Status placeholder para observabilidade pública futura.
- `/login`: Entrada existente do app; não faz parte do escopo de marketing além do link de navegação.

## Componentes

- `MarketingLayout`: casca pública com navegação fixa, conteúdo e rodapé.
- `MarketingNavbar`: menu superior responsivo em formato flutuante, sem dropdowns.
- `HeroSection`: primeira dobra premium com headline centralizada, CTA principal para começar, CTA secundário para planos, mockup dominante do produto e cards de valor logo abaixo do painel.
- `RelationshipSection`: seção clara que posiciona a Rescript como base para relacionamento, venda, caixa, lucro e métricas.
- `ScaleSection`: seção escura com cards grandes sobre relacionamento, proteção de caixa e gestão por lucro.
- `SystemMockup`: composição visual baseada em controle interno da loja e na gramática da marca Rescript: operação em camadas, três barras, régua de margem, linha operacional, sinais de decisão e superfícies quietas; sem dashboard genérico.
- `EcosystemSection`: seção visual de conexão mostrando trilhas operacionais entre relacionamento, vendas, operação e decisão.
- `MarketingSection`: padrão reutilizável de seção.
- `ProblemSection`: cards de dores operacionais.
- `TransformationSection`: fluxos visuais de transformação operacional.
- `ModulesSection` / `ModuleGrid`: grade de camadas/módulos.
- `FeaturesSection`: ganhos e diferenciais.
- `HowItWorksSection`: fluxo de aquisição até criação da empresa e onboarding.
- `BenefitsSection`: painel de benefícios com contexto visual.
- `PricingSection`: cards de planos com links para `/checkout`.
- `TestimonialsSection`: placeholders elegantes sem dados falsos.
- `MarketingFaq`: accordion acessível com `<details>`.
- `FinalCtaSection`: CTA final direto para início ou exploração dos recursos.
- `MarketingFooter`: mapa público de navegação.

## Fluxo de conversão

O website segue uma narrativa simples:

1. Promessa memorável no hero: vender mais, controlar melhor e enxergar lucro.
2. CTAs claros: começar agora e conhecer planos.
3. Prova de plataforma por mockup grande construído em UI e alinhado à marca Rescript.
4. Cards de valor imediatamente abaixo do mockup: margem, caixa, estoque e cliente recorrente.
5. Seção clara explicando que a Rescript conecta relacionamento, venda, caixa e lucro.
6. Cards de escala: relacionamento, proteção de caixa e gestão por margem.
7. Fluxos conectados mostrando como áreas se relacionam sem perder contexto financeiro.
8. Trilhas conectadas e camadas operacionais.
9. Benefícios, planos futuros e prova social reservada para dados reais.
10. FAQ e CTA final.

## SEO

Cada rota pública deve declarar:

- title;
- description;
- canonical;
- Open Graph;
- Twitter Card;
- robots index/follow.

O site também possui:

- `public/robots.txt`;
- `public/sitemap.xml`;
- structured data `SoftwareApplication` na home.

## Performance

Diretrizes:

- manter componentes públicos sem dependências pesadas;
- evitar imagens genéricas externas;
- usar mockups em HTML/CSS sempre que possível;
- preservar SSR;
- manter CSS reutilizável e animações leves;
- respeitar `prefers-reduced-motion`;
- preparar rotas para code splitting pelo roteador.

Meta: Lighthouse acima de 95 e Core Web Vitals verdes após implantação real.

## Acessibilidade

- Contraste compatível com WCAG AA.
- Foco visível em links, botões e accordion.
- Menu móvel com `aria-expanded`.
- Landmark de navegação com `aria-label`.
- Mockup visual com rótulo acessível.
- Animações desativadas quando o usuário prefere redução de movimento.
