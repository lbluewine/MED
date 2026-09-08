# LAYOUT.md — como as telas são montadas

O que decide a aparência do site. Para tokens de cor, tipografia e regras de
acessibilidade, ver `docs/STACK.md`; para o texto que vai dentro,
`docs/CONTEUDO.md`.

Base: o mockup `Tem Remedio.dc.html`, adotado em 05/09/2026.

## O esqueleto

Toda página passa por `components/Pagina.tsx`, que monta sempre a mesma coisa:

```
Banner          fixo no topo: marca, 4 caminhos, busca, cidade (troca)
Cabecalho       só abaixo de 1024px: botões grandes dos caminhos principais
+---------------------------------------------+
| topo (largura toda) — o banner da home       |
+---------------+-----------------------------+
| MenuLateral   | conteúdo                    |   >= 1024px
| 300px, sticky | max-w 1180 no total         |
+---------------+-----------------------------+
Rodape          aviso de projeto independente
```

O `topo` do `Pagina` ocupa a largura inteira, acima das colunas. É onde vai o
banner da home: dividir o espaço com o menu deixaria a busca estreita demais.

A cidade no `Banner` é um link, não um rótulo: leva a `/cidades`, onde se
escolhe o estado e depois a cidade. São duas telas e não uma lista aqui porque
mandar os 5.570 municípios em toda página do site pesaria centenas de KB.

As sugestões do `CampoBusca` saem flutuando (`absolute`) sobre o que vem
depois. No fluxo, cada letra digitada mudaria a altura do banner e empurraria a
página embaixo do dedo de quem está lendo.

O menu vem **antes** do conteúdo no HTML, não só na tela: quem usa leitor de
tela ouve a navegação primeiro, e quem quer pular tem o "Pular para o
conteúdo" do `layout.tsx`.

- **Uma coluna até 1024px.** O menu lateral some e quem navega é o `Cabecalho`,
  com botões de 48px. A árvore do menu numa tela de 360px empurraria o conteúdo
  para baixo da dobra.
- `semMenu` tira a coluna da direita quando a página quer a largura toda.
- O menu é `sticky top-6`: acompanha a rolagem sem sair da tela.

## O menu lateral

Dois cartões, tudo aberto, nada que dobre ou desdobre — quem chega vê de uma
vez tudo que o site tem.

Font-size de 14,5px nas linhas e 16px nos títulos — menor que o corpo do site,
porque é navegação de apoio e não conteúdo.

| Cartão | O que traz |
|---|---|
| **Acesso rápido** | Os caminhos principais, cada um com sigla colorida (`A-Z`, `TIP`, `ALT`, `FPO`) e a contagem real |
| **Unidades de saúde** | "Todos os lugares" e um item por tipo, com quantas existem; cada um leva à âncora daquela seção |

As contagens saem dos dados no build, nunca escritas à mão. A sigla é enfeite
e some para quem usa leitor de tela.

## O cartão

Quase todo bloco de conteúdo é um `components/Cartao.tsx`: fundo branco, borda
de 1px em `--borda-cartao`, canto de 14px, sobre o véu azul da página.

**O cartão separa, nunca esconde.** Não existe conteúdo atrás de clique: a
apresentação de um medicamento mostra onde retirar e qual receita levar com a
página aberta. Quem chega aqui está decidindo se pega um ônibus.

Peças que acompanham:

- `Rotulo` — o rótulo pequeno em caixa alta acima de um valor.
- `Pilula` — contagem em pílula azul.
- `Migalha` — o caminho de volta no topo de cada página interna.

## As telas

| Tela | Forma |
|---|---|
| **Home** | Hero com busca grande, 4 cartões de acesso rápido, 4 cartões de orientação |
| **Busca** | Um cartão por resultado com etiqueta "Tem na lista", aside explicando a busca |
| **Medicamento** | Faixa verde (tem) ou âmbar (só na unidade) com a resposta em 44px, um cartão por apresentação, aside "O que levar" |
| **A–Z** | Índice de letras, um cartão por letra com a letra fantasma à esquerda |
| **Por tipo** | Grade de cartões, cada um com a contagem e três exemplos |
| **Onde pegar** | Um cartão por tipo de unidade, linha por unidade, mapa fixo na lateral |
| **Unidade** | Cartão com tipo, nome, endereço, aviso de restrição, telefone e horário |
| **Alto custo** | Hero em gradiente com o bloco escuro do checklist, lista das doenças |
| **Farmácia Popular** | Guia: hero roxo (programa federal, não municipal), três cartões de "Como funciona" e dois caminhos para as telas abaixo |
| **O que tem** | A lista do programa em cartões por indicação; cada item leva à página da cidade ou à do programa |
| **Onde tem** | As farmácias credenciadas por bairro, com botão "Ver no mapa" em cada linha |
| **Item da Farmácia Popular** | Só para o que a cidade não tem: faixa verde "TEM, de graça", apresentações, onde retirar e o que levar |

## Regras que não se quebram no layout

1. **A resposta antes do detalhe.** "Tem" ou "não tem" aparece acima da dobra,
   em corpo grande, antes de qualquer outra coisa.
2. **Nada dobrado.** Sem accordion, sem carrossel, sem modal. Cartão separa,
   não esconde.
3. **Cor nunca é a única pista.** Verde, vermelho e âmbar sempre com texto e
   ícone junto.
4. **Enfeite é azul.** Verde, vermelho e âmbar só quando significam alguma
   coisa. Ver `docs/STACK.md`.
5. **Funciona sem JavaScript.** Só a busca instantânea, o mapa e a distância
   dependem de script, e os três têm caminho alternativo.
6. **Alvo de 48px** em tudo que se toca, com 8px de folga.
7. **Testado a 360px** antes de dar por pronto.
8. **Imprime.** O que é navegação leva `nao-imprime`; o conteúdo sai no papel.

## Imagens

- Nada de PNG grande em tela: converter para WebP e servir no tamanho de uso.
  O banner saiu de 1214 KB para 30 KB, e o site é para quem tem internet ruim.
- Ícone é SVG inline: escala, herda a cor e pesa ~200 bytes.
- `<img>` e não `next/image` para arquivo estático já otimizado — o site é
  estático de propósito.

## /dev — console de manutenção

Página para quem mantém o site, fora do menu e fora do índice dos buscadores
(`robots: noindex`). Reúne o que está esperando alguém fazer, com o comando de
cada pendência, e os números do que já está publicado. Sai de `lib/manutencao.ts`,
calculado no build.

**Ela não administra nada, e não dá para ser diferente sem mudar a arquitetura.**
O site é estático: não há servidor para receber uma ação. Publicar dado continua
sendo por comando e pull request, com revisão humana — regra 3 do `CLAUDE.md`.

Também não tem login: site estático não tem onde guardar sessão, e inventar uma
esbarraria na seção 6 do `CLAUDE.md`. A consequência precisa ficar clara para
quem for mexer: **quem tiver o endereço vê a página**. Nada de secreto entra
ali — o conteúdo é o mesmo dado público que já está no repositório, reunido num
lugar só.

As três gravidades querem dizer coisas diferentes, e misturá-las tira o sentido
da página:

| | |
|---|---|
| `erro` | dado que pode enganar alguém agora |
| `atencao` | trabalho pendente que ainda não engana ninguém |
| `nota` | o que já se sabe e se aceita, registrado para não virar esquecimento |
