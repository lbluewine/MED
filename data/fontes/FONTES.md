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

## Conferir se as fontes mudaram

```
sha256sum -c $(find data/fontes -name '*.sha256')
```

O job semanal faz isso automaticamente e abre um pull request quando o hash
muda. Ele nunca faz merge sozinho.
