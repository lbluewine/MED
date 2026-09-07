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

- O nome da cidade no topo de toda página é um **botão "Trocar"**. Ele leva a
  `/cidades`, que lista as cidades com REMUME publicada e os 27 estados.
- `/cidades/[uf]` traz as cidades daquele estado: **campo de busca com
  autocompletar** (aceita sem acento e sem caixa) e a lista completa em links,
  com a marca "lista completa" onde há REMUME publicada.
- A escolha é por estado, e não num campo único sobre os 5.570 municípios,
  porque o país inteiro numa página só pesaria demais para quem tem internet
  ruim. Minas Gerais, o maior, dá 48 KB comprimidos.
- As duas telas trazem o aviso de residência: cada cidade entrega para quem
  mora nela.
- Cidade sem REMUME própria cadastrada aqui ainda tem resposta: `/[cidade]`
  mostra o piso que o SUS garante em qualquer lugar do Brasil, pela RENAME
  (Relação Nacional de Medicamentos Essenciais), com busca própria. São **966
  apresentações de 534 medicamentos** da RENAME 2024, nos três componentes —
  básico, estratégico e especializado.
- O alto custo tem **dois caminhos**: pelo medicamento
  (`/[cidade]/alto-custo/medicamentos`, 172 em ordem alfabética) e pela doença
  (as 110 do CEAF/SC). O primeiro é o principal, porque quem chega tem o nome
  na receita e não o nome do protocolo. A página de cada medicamento lista as
  doenças que abrem o pedido, com link para os papéis de cada uma.
- A ligação medicamento → doença vem da RENAME, da coluna "Documento
  norteador" do Anexo III (o PCDT de cada um) — 311 ligações, das quais 238
  casam com uma condição publicada pelo estado. Quando o estado escreve a
  doença com outro nome, a tela mostra o nome sem link em vez de mandar a
  pessoa aos papéis de outra doença.
- O alto custo (CEAF) só é oferecido onde existe a lista do estado publicada.
  Fora de Santa Catarina o site não mostra esse caminho, em vez de mandar
  alguém buscar papel de outro estado.
- O alto custo e a Farmácia Popular têm rota por cidade
  (`/[cidade]/alto-custo`, `/[cidade]/farmacia-popular`). O que é do estado ou
  do país aparece igual em todas; o **lugar de retirar é da cidade** — o ponto
  de entrega do pedido e as drogarias credenciadas só aparecem para a cidade
  aberta. Onde não temos, o site diz que não sabe e manda ao painel oficial,
  em vez de mostrar endereço de outro município.
- Esse modo nunca inventa onde retirar nem qual receita a prefeitura pede —
  isso é decisão de cada município, e sem a lista dela o site não sabe. A tela
  diz isso e encaminha para a UBS mais próxima ou a Secretaria de Saúde.
- A home de uma cidade sem lista própria tem a **mesma estrutura** da home de
  Criciúma: banner com busca, "Acesso rápido" e "Informações importantes". O
  que falta para aquela cidade não aparece — sem as unidades cadastradas não
  há cartão de "onde retirar", e sem a lista municipal não há "por tipo".
- A lista **A–Z** existe em qualquer cidade. Numa cidade com REMUME ela traz a
  lista da prefeitura **e** o piso nacional na mesma lista. Em Criciúma são 181
  da prefeitura mais 391 só do piso nacional.
- O que não está na lista da prefeitura é marcado pelo **balcão onde sai** —
  "unidades de saúde", "farmácia estratégica" e "farmácia de alto custo" —, os
  mesmos nomes da página "onde pegar". Antes era uma marca só para todos, que
  mandava perguntar na UBS por um medicamento de alto custo: caminho errado
  para 80% deles. 22 medicamentos saem por mais de um balcão e recebem duas
  marcas.
- Cada um desses nomes leva a `/[cidade]/piso-nacional/[slug]`, com por onde o
  medicamento sai, as apresentações e — no alto custo — as doenças que abrem o
  pedido. Antes eram nomes sem clique: a busca da cidade também não os acha,
  porque procura só na lista municipal.
- O cruzamento entre a lista municipal e a RENAME lê as grafias que a fonte
  declara: o sinônimo entre parênteses ("Folinato de cálcio (ácido folínico)")
  e o nome sem a forma farmacêutica que a REMUME às vezes gruda no fim
  ("... Suspensão Injetável"). Sem isso o site mostrava como ausente um
  medicamento que a cidade entrega. Ver `lib/nomes-medicamentos.ts`.
- O "Acesso rápido" é organizado por **onde se retira** — todos os
  medicamentos, os das UBS, os da farmácia do distrito, os da farmácia
  estratégica, os de alto custo e os da Farmácia Popular. É a pergunta que a
  pessoa traz ("onde eu pego?"). Cada grupo tem lista própria em
  `/[cidade]/remedios/onde/[tipo]`, e só aparece quando tem medicamento.
- "Por tipo de medicamento" continua, no cartão "Outro jeito de procurar", para
  quem procura sem saber o nome.
- "Início" no topo volta para a home da **cidade escolhida**, não para a raiz.
