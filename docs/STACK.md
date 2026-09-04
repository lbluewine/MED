# STACK.md — tecnologia e interface

## Decisões

| Escolha | O quê | Por quê |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Rota de servidor pronta para o chat futuro, ecossistema grande, deploy gratuito |
| Estilos | Tailwind CSS | Sem CSS global brigando entre si |
| Dados | JSON no repositório, validado com Zod | Sem banco, sem custo, histórico no Git |
| Busca | Índice pré-computado no build + MiniSearch no cliente | Funciona offline, sem servidor, resposta instantânea |
| Mapa | Leaflet + OpenStreetMap | Sem chave de API, sem custo, sem rastreamento do Google |
| Hospedagem | Vercel (plano gratuito) | Zero configuração |
| Analytics | Nenhum no v0 | Ver LGPD abaixo |

### A regra que justifica o Next.js

Next.js só compensa aqui **se o site for quase todo estático**. Para 95% de
conteúdo fixo, um framework pesado com tudo no cliente é o pior dos mundos:
paga-se o peso sem usar o benefício.

Portanto:

- **Componentes de servidor por padrão.** `"use client"` só quando houver
  interação real (busca, mapa, formulário da lista).
- Páginas de medicamento e de unidade são **geradas estaticamente**
  (`generateStaticParams`). Elas mudam quando o dado muda, não a cada acesso.
- Sem biblioteca de estado global. Não há estado global neste site.
- Meta de peso: **menos de 100 KB de JavaScript** na primeira carga da home.
  Se passar, algo virou cliente sem precisar.

Se em algum momento o projeto ficar 100% estático e o chat for descartado, migrar
para Astro passa a ser a escolha certa. Não é o caso hoje.

## Estrutura

```
app/
  layout.tsx
  page.tsx                          # busca "Tem no SUS?"
  [municipio]/
    remedio/[slug]/page.tsx
    onde-pegar/page.tsx
    unidade/[id]/page.tsx
  alto-custo/
    page.tsx
    [condicao]/page.tsx             # checklist do CEAF
  minha-lista/page.tsx
  sobre/page.tsx

components/
lib/
  schema.ts                         # Zod
  dados.ts                          # leitura e validação
  busca.ts                          # índice
scripts/
  atualiza-cmed.ts
  verifica-fontes.ts
data/                               # ver docs/DADOS.md
```

## Busca — requisitos não óbvios

A busca é a funcionalidade principal. Ela precisa perdoar o usuário:

- **Ignorar acento.** "acido folico" acha "ácido fólico".
- **Tolerar erro de digitação.** "lozartana" acha "losartana".
- **Aceitar nome comercial e nome popular.** Quem chega digita o nome da caixa,
  não o princípio ativo. O campo `nomes_populares` existe para isso.
- **Sugerir enquanto digita**, com no máximo 5 sugestões.
- **Nunca retornar tela em branco.** Sem resultado tem caminho de saída (ver
  frase padrão em `docs/CONTEUDO.md`).

## Interface

Público: pessoa idosa, celular barato, luz do sol, mão trêmula.

### Tokens

```
--fundo         #FFFFFF   fundo branco puro, contraste máximo no sol
--texto         #1A1A1A
--texto-suave   #4A4A4A
--linha         #D9D9D9
--tem           #0B6E4F   verde: o SUS entrega
--nao-tem       #A4231E   vermelho: não está na lista
--processo      #B45309   âmbar: precisa de processo (CEAF)
```

Verde, vermelho e âmbar carregam significado, então **nunca são a única pista**:
sempre acompanhados de texto e ícone. Daltonismo é comum na faixa etária.

### Tipografia

Uma família só: **Atkinson Hyperlegible**. Foi desenhada pelo Braille Institute
para baixa visão, com letras que não se confundem entre si — a escolha existe
por causa do público, não por estética.

- Corpo de texto: **18px**, altura de linha 1.6.
- Título de página: 30px, peso bold.
- **Nada abaixo de 16px em nenhum lugar**, incluindo rodapé e nota de fonte.
- Largura de linha máxima de 65 caracteres.

### Regras de layout

- **Mobile primeiro**, testado a 360px.
- Área de toque mínima de **48×48px**, com 8px de folga entre alvos.
- A resposta principal ("tem" / "não tem") aparece **acima da dobra**, em texto
  grande, antes de qualquer detalhe.
- Sem carrossel, sem accordion escondendo informação crítica, sem modal.
- Sem animação de entrada. Movimento só como resposta a uma ação do usuário, e
  respeitando `prefers-reduced-motion`.
- Toda página imprime bem. Muita gente vai imprimir o checklist do CEAF e levar
  no papel.

### Acessibilidade — piso obrigatório

- Contraste mínimo AA (4.5:1) em todo texto.
- Foco de teclado visível e nítido.
- HTML semântico; `<button>` é botão e `<a>` é link.
- Rótulo real em todo campo, não só `placeholder`.
- Funciona com JavaScript desligado nas páginas de conteúdo. Só a busca e o mapa
  dependem de JS, e ambos têm alternativa navegável (lista A–Z, lista de
  endereços).

## LGPD e privacidade

Dado de saúde é dado pessoal sensível. A arquitetura mais segura é não ter o
dado:

- Sem login, sem conta, sem cadastro.
- "Minha lista" fica só no `localStorage` do aparelho. Nunca sobe para servidor.
- Sem cookie de identificação, sem pixel, sem script de terceiro.
- Sem Google Fonts via CDN — fonte servida junto com o site, para não vazar IP.
- Se um dia houver métrica, tem que ser agregada e sem identificação
  (Plausible ou Umami próprios). Requer autorização, ver `CLAUDE.md`.

## Qualidade

- `npm run build` limpo antes de qualquer merge.
- Zod valida todo o `data/` no build. Dado inválido derruba o build.
- Lighthouse: Acessibilidade 100, Performance ≥ 90 em 4G simulado.
- Testes só onde erro machuca: parsers de dados, busca e cálculo de preço.
  Não escrever teste de componente visual no v0.
