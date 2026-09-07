# FUNCIONALIDADES.md — o que o site faz hoje

Resumo do que está no ar. Para o que ainda não foi construído, ver
`docs/ROADMAP.md`; para como as telas são montadas, `docs/LAYOUT.md`.
Números conferidos em 04/09/2026.

Hoje o site cobre **Criciúma/SC**: 181 medicamentos (250 apresentações),
62 unidades de saúde e as 110 doenças do alto custo em Santa Catarina. Cobre
também o Programa Farmácia Popular, que é federal: 41 itens.

## Buscar um medicamento

- Busca tolerante: ignora acento (`acido folico` acha "ácido fólico") e perdoa
  erro de digitação (`lozartana` acha "losartana").
- Acha também pelo **nome da caixa**: quem digita "Cozaar" chega na losartana
  potássica.
- Sugestões enquanto digita, no máximo 5.
- Funciona **sem JavaScript**: o formulário cai numa página de resultado feita
  no servidor.
- Nunca devolve tela em branco — sem resultado, mostra o que fazer em seguida.

## Página do medicamento

- Resposta grande no topo: **tem** ou **não é para levar para casa**.
- Uma apresentação por cartão ("Losartana potássica 50 mg Comprimido"), com
  onde retirar e qual receita levar. Nada dobrado atrás de clique.
- O local de retirada é link direto para aquele tipo de unidade.
- "O que levar": documentos exigidos, sem repetir o que o município já pede.
- Etiqueta do grupo da lista (ex. "Antihipertensivo"), com link.
- Avisa quando a apresentação tem regra a mais, e quando a lista não diz qual
  receita é preciso.

## Navegar sem saber o nome

- **Lista A a Z** dos 181 medicamentos, com índice por letra.
- **Por tipo**: 92 grupos, do jeito que a própria lista classifica.
- Menu lateral no desktop com a árvore inteira aberta e a contagem de cada
  item; no celular, os mesmos caminhos em botões grandes.

## Onde pegar

- As 62 unidades, agrupadas nos 7 tipos, na ordem da chance de precisar.
- Endereço, telefone que disca, horário e o que cada uma entrega.
- Mapa Leaflet (OpenStreetMap, sem chave e sem Google), com a lista de
  endereços como alternativa sem JavaScript.
- **Distância até você**, só depois de clicar e liberar a localização. A
  coordenada não sai do navegador. Sem permissão, a lista aparece inteira, sem
  os quilômetros.
- Página por unidade, com aviso de atendimento restrito quando existe.

## Alto custo (CEAF)

- O que é, quem entrega e como abrir o pedido.
- As 110 doenças atendidas em SC, cada uma com os papéis que o médico preenche
  e os exames que o pedido exige.
- **Checklist imprimível** para levar no papel.

## Farmácia Popular

- Um **guia do programa**: quem pode usar, quanto custa e o que levar, com dois
  caminhos — a lista do que o programa tem e as farmácias que o atendem.
- Os **41 itens do elenco federal**, agrupados nas 12 indicações como a fonte
  agrupa, cada um levando à sua página.
- Na página do medicamento, um cartão da Farmácia Popular quando o princípio
  ativo está no elenco. Ele mostra o item como o Ministério escreve, com a
  dose, para a pessoa comparar com a receita.
- Quando a cidade só aplica o medicamento dentro da unidade, esse cartão vem
  **no topo da página**: sem isso, quem lê "NA UNIDADE, você não retira" vai
  embora sem saber que pode pegar de graça na farmácia da rua.
- **Página própria para os 11 itens** que o programa tem e a cidade não —
  dapagliflozina, budesonida, beclometasona, absorvente, fralda e os demais.
  Ninguém mais ouve "não tem" para algo que o SUS fornece.
- Na busca, quando a lista da cidade não tem o medicamento, o site avisa se o
  programa federal tem. É a diferença entre "não tem" e "não tem aqui".
- 30 dos 41 itens também estão na lista de Criciúma. Quem procura por um deles
  vê os dois caminhos: o posto, na página do medicamento, e a drogaria.
- As **34 farmácias credenciadas em Criciúma**, agrupadas por bairro, com a
  data da versão ao lado da lista e o link para o painel oficial. O job
  semanal atualiza sozinho e abre pull request quando alguma entra ou sai.
- Cada uma com o **nome da placa, rua, número e CEP**: o painel federal dá só
  a razão social e o nome da rua, e o endereço completo vem do cadastro de
  CNPJ da Receita Federal, cruzado automaticamente.
- Quando as duas fontes discordam sobre o bairro, a tela mostra as duas. São
  3 casos em Criciúma.
- **Mapa** com 33 das 34, e um botão "Ver no mapa" em cada linha da lista. 22
  são o endereço exato no cadastro do IBGE; 11 são interpoladas entre os
  números vizinhos e aparecem com pino vazado e aviso de que o ponto é
  aproximado.

## Qualquer cidade do Brasil

- A home, com mais de uma cidade publicada, ganha um **campo de busca com
  autocompletar** sobre os 5.570 municípios do IBGE — não só a lista das
  cidades com REMUME própria.
- Cidade sem REMUME própria cadastrada aqui ainda tem resposta: `/[cidade]`
  mostra o piso que o SUS garante em qualquer lugar do Brasil, pela RENAME
  (Relação Nacional de Medicamentos Essenciais), com busca própria.
- Esse modo nunca inventa onde retirar nem qual receita a prefeitura pede —
  isso é decisão de cada município, e sem a lista dela o site não sabe. A tela
  diz isso e encaminha para a UBS mais próxima ou a Secretaria de Saúde.
- Menu e navegação se ajustam sozinhos: uma cidade genérica não mostra links
  para lista de medicamentos ou unidades, que não existem para ela.
