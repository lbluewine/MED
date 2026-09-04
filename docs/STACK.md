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

--marca         #1E3A8A   azul de identidade: banner, títulos de seção
--marca-link    #1E40AF   link, botão de ação, item ativo do menu
--marca-fundo   #EFF4FF   topo de cartão, estado hover
--marca-linha   #C7D7FE   borda de cartão

--superficie        #F7F7F7   fundo de cartão
--superficie-forte  #EDEDED   contador, estado hover
--linha-suave       #E6E6E6

--radius-cartao  10px
--radius-botao   6px
```

O fundo da **página** continua branco puro, para contraste máximo no sol. Os
cinzas acima só separam bloco de bloco; o texto sobre eles segue `--texto`, que
dá 16:1 mesmo no mais escuro.

Verde, vermelho e âmbar carregam significado, então **nunca são a única pista**:
sempre acompanhados de texto e ícone. Daltonismo é comum na faixa etária.

Pela mesma razão o azul é a cor de identidade e os três semânticos não são.
Se o verde virar enfeite — banner, botão, cabeçalho — ele para de querer dizer
"o SUS entrega", que é a informação mais importante do site. O azul fica longe
dos três no círculo cromático e não compete com nenhum. Regra prática: **cor de
enfeite é azul; verde, vermelho e âmbar só quando significam alguma coisa.**

O botão de ação principal é azul pela mesma razão — era verde, e "ligar para a
unidade" não é "tem no SUS".

Todo par foi conferido contra AA (4,5:1): branco sobre `--marca` 10,4:1;
`--marca-link` sobre branco 8,7:1; texto sobre `--marca-fundo` 15,8:1.
Link continua **sublinhado**: a cor nunca é a única pista.

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
  Cartão é permitido e preferido para separar blocos irmãos — apresentações de
  um medicamento, unidades de saúde —, desde que **nada dentro dele comece
  dobrado**. O cartão serve para a pessoa achar o bloco dela, não para esconder
  o conteúdo atrás de um clique.
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
- **Localização.** A distância até cada unidade só aparece se a pessoa clicar e
  liberar. Nunca é pedida ao abrir a página. A coordenada é usada dentro do
  navegador, para o cálculo, e não é enviada, gravada nem registrada em lugar
  nenhum. Sem a permissão, a lista aparece inteira, só sem os quilômetros.
  Nunca mostrar distância a partir de um ponto que não seja o da pessoa: um
  número que parece ser dela e não é engana pior que a ausência do número.
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
