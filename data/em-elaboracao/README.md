# em-elaboracao/

Trabalho em andamento. **Nada aqui vai para o site.** O carregador só lê
`data/municipios`, `data/estados` e `data/nacional`.

## ubs-criciuma-a-conferir.csv

As 48 unidades básicas de Criciúma (46 UBS e 2 extensões), com o distrito
sanitário e o telefone que a REMUME informa.

**Falta o endereço de todas.** Nenhuma fonte pública que encontramos traz o
endereço das UBS de Criciúma:

- A REMUME (seção 8.7) traz só nome e telefone.
- A lista de apoio do CIGTES traz só nome e distrito.
- A API de dados abertos do CNES tem 2 das 48. Só retorna 260 estabelecimentos
  de Criciúma, quase todos clínicas privadas.
- O serviço do portal CNES recusa conexão automatizada.

Sem endereço, a UBS não entra no site. Mandar alguém para uma unidade sem
saber onde ela fica é pior que não listar a unidade.

### Como preencher

Uma linha por vez, conferindo no mapa que o ponto cai na porta da unidade:

| Coluna | O que pôr |
|---|---|
| `logradouro` | Rua e número, como aparece na placa |
| `bairro`, `cep` | Deixe vazio se não tiver certeza. Vazio é melhor que errado |
| `lat`, `lng` | Só depois de ver o ponto no mapa e reconhecer o prédio |
| `conferido_por` | Seu nome. Quem conferiu responde pelo dado |
| `conferido_em` | Data no formato AAAA-MM-DD |

A coluna `nota` marca os casos em que o telefone da REMUME **não** pôde ser
ligado ao nome com segurança. Confira esses no PDF antes de usar.

Linha preenchida e conferida vira registro em `unidades.json`, com
proveniência própria. Linha pela metade fica aqui.
