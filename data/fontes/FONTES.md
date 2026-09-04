# Fontes

Cópia de cada documento de origem, com o SHA-256 do arquivo baixado. Quando
alguém disser "isso está errado", é aqui que se descobre se o erro foi nosso ou
da fonte. Ver `docs/DADOS.md`.

| Arquivo | O que é | Baixado de | Data da versão |
|---|---|---|---|
| `sc-criciuma/remume-2024-11.pdf` | Relação Municipal de Medicamentos Essenciais de Criciúma, versão 11/2024. Lista, locais de acesso, regras de receita e endereços das farmácias. | https://cigtes.criciuma.sc.gov.br/redes-de-atencao-saude/material-apoio/20 | 2024-11 |
| `sc-criciuma/ubs-lista-telefonica.pdf` | Nomes das 47 UBS de Criciúma, por distrito sanitário. Sem endereço e sem telefone. | https://cigtes.criciuma.sc.gov.br/redes-de-atencao-saude/material-apoio/21 | sem data no documento |
| `sc-criciuma/pregao-038-fms-2024-guia-farmacia.pdf` | Edital de pregão para compra de medicamentos **fora** da REMUME (mandado judicial e vulnerabilidade social). **Não é lista de dispensação.** Guardado só porque nomeia as farmácias distritais. | fornecido pelo mantenedor | 2024-11-25 |
| `sc/resme-2026-07-07.pdf` | Relação Estadual de Medicamentos Ambulatorial (RESME) da SES/SC: CEAF, CESAF e CBAF estaduais. | https://www.saude.sc.gov.br/index.php/pt/component/edocman/relacao-estadual-de-medicamentos-resme-ambulatorial/download | 2026-07-07 |

| `sc-criciuma/transparencia-unidades-2026-09-04.json` | Endereço, telefone, e-mail, expediente e coordenada das unidades de saúde, lidos do Portal da Transparência de Criciúma. | https://transparencia.criciuma.sc.gov.br/unidades | 2026-09-04 |
| `sc/ceaf-condicoes-2026-09-04.json` | As doenças atendidas pelo CEAF em SC, os papéis de cada uma e os exames que o pedido exige. | https://www.saude.sc.gov.br/index.php/pt/assistencia-farmaceutica/componente-especializado-da-assistencia-farmaceutica-ceaf | 2026-09-04 |

## Dado que ainda não tem fonte oficial

`nacional/nomes-comerciais.json` guarda o nome de caixa de cada princípio
ativo, e é o único arquivo de `data/` cuja origem não é um documento público.

Foi informado pelo mantenedor e **ainda não foi conferido contra o cadastro de
medicamentos registrados da Anvisa**. Por isso:

- Serve só para a busca encontrar o princípio ativo por um nome de marca.
  Nenhuma tela afirma que o medicamento é vendido com esses nomes.
- `npm run valida-dados` avisa em toda execução enquanto
  `conferido_na_anvisa` for `false`.
- O pior caso de um nome errado é uma busca que não acha. Se a lista aparecesse
  na tela, um nome errado viraria afirmação do site — que é o que a regra 1 do
  `CLAUDE.md` proíbe.

Substituir por extração da Anvisa quando a base estiver acessível: as tentativas
por `dados.anvisa.gov.br` e pela API de `consultas.anvisa.gov.br` foram
bloqueadas (DNS e HTTP 403) em 04/09/2026.

## Conferir se as fontes mudaram

`fontes.json` declara o que é conferido e como. Para rodar à mão:

```bash
npm run verifica-fontes
```

O script sai com código 1 se alguma fonte mudou e 2 se alguma saiu do ar.
Fonte fora do ar falha alto de propósito: falha silenciosa é pior que erro.

Duas fontes não são um arquivo, e sim uma página que muda de marcação sem o
conteúdo mudar. Para essas, o que se compara é o snapshot que o extrator
produz, e por isso o snapshot precisa sair sempre na mesma ordem.

## O job semanal

`.github/workflows/verifica-fontes.yml` roda isso toda segunda de manhã:

- **Nada mudou** — só a data de conferência é regravada, e vai direto para o
  `main`. Nenhum dado de conteúdo é tocado, e o workflow confere isso linha a
  linha antes de commitar.
- **Alguma fonte mudou** — o arquivo de origem novo é guardado, os extratores
  rodam, e um pull request espera revisão humana. Nunca há merge automático de
  dado.
- **Alguma fonte saiu do ar** — o job falha e ninguém mexe em nada.
