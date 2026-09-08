# prospeccao/

**Nada aqui é dado de saúde e nada aqui vai à tela.** É a fila de trabalho da
expansão para outros municípios: onde parece existir um ato publicando a lista
municipal de medicamentos, em que diário oficial ele saiu e qual o link.

Gerado por `scripts/prospecta_remume.py`, que consulta a API do
[Querido Diário](https://queridodiario.ok.org.br) (Open Knowledge Brasil).

| Arquivo | O que é |
|---|---|
| `candidatos.json` | A fila, legível por máquina: um registro por município, com os diários que citam a REMUME, o trecho e a classificação de triagem. |
| `RELATORIO.md` | A mesma fila, para ler. Ordenada por ato provável e depois por população. |

## A classificação é aposta, não conclusão

`scripts/prospecta_remume.py` marca cada diário como:

- `ato` — o trecho aprova, institui ou atualiza a relação municipal;
- `atribuicao` — portaria que cria a Comissão de Farmácia e Terapêutica e lista
  "atualizar a REMUME" entre as atribuições dela;
- `licitacao` — cita a REMUME como objeto de compra (pregão, ata de preços);
- `mencao` — cita o termo sem que dê para dizer o quê.

`atribuicao` existe porque a primeira versão não a separava, e 22 dos 24 "atos"
da primeira varredura eram portaria de comissão. Não é o ato que publica a
lista, mas prova que a lista existe e costuma nomear quem responde por ela na
prefeitura — o que já é um bom começo para pedir o documento.

A marcação sai de expressão regular sobre um trecho de 500 caracteres. Erra nos
dois sentidos, e serve para ordenar a fila de leitura, e só. Quando mudar,
`python3 scripts/testa_prospeccao.py` confere contra 13 trechos reais de diário
oficial — inclusive os que já enganaram a versão anterior.

## O que acontece depois

Quem lê o documento, decide se é a REMUME **vigente** e extrai a lista é gente.
O caminho está em `docs/DADOS.md`: guardar o documento em
`data/fontes/<uf>-<cidade>/` com o SHA-256, extrair para o schema com
proveniência preenchida, abrir PR. É a regra 3 do `CLAUDE.md`.

## Limites conhecidos

- O Querido Diário raspa o diário de cerca de 950 dos 5.570 municípios. Fora
  dessa lista, esta busca não enxerga nada.
- **Nem todo acervo raspado tem texto para pesquisar**, e o nível de abertura
  do Querido Diário não separa os casos: São Paulo é nível 1 e responde
  normalmente; Blumenau, São José e Itajaí são nível 1 e devolvem zero até para
  a palavra "prefeitura". Por isso o script sonda com essa palavra todo
  município que não devolveu nada, e o relatório separa "não cita a REMUME" de
  "não dá para pesquisar". Confundir os dois é publicar conclusão errada sobre
  a cidade.
- A busca vem do diário mais novo para o mais velho, e o decreto que aprovou a
  lista costuma ser antigo. Onde a primeira página não acha ato, o script desce
  mais fundo (`--fundo`, padrão 100 diários). A coluna *Lidos* do relatório diz
  até onde se leu.
- O acervo de cada município começa numa data diferente. Município com acervo
  curto pode ter a REMUME publicada antes do que o robô alcança.
- A lista quase nunca está no corpo do diário: vem em anexo, às vezes só
  referenciado por link que já morreu.
- A API cai com frequência (503 `no available server`). O script espera e tenta
  de novo; município que ficou sem resposta aparece em
  `cobertura.sem_resposta_da_api`.
