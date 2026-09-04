# FUNCIONALIDADES.md — o que o site faz hoje

Resumo do que está no ar. Para o que ainda não foi construído, ver
`docs/ROADMAP.md`. Números conferidos em 04/09/2026.

Hoje o site cobre **Criciúma/SC**: 181 medicamentos (250 apresentações),
62 unidades de saúde e as 110 doenças do alto custo em Santa Catarina.

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

