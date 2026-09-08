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
| `ms-campo-grande/diario-6466-remume-2021.pdf` | DIOGRANDE n. 6.466, com a Resolução SESAU 628/2021, que aprova a REMUME 2021 de Campo Grande. O Anexo I é a lista de dispensação (334 itens); os anexos II e III **não** são — são de uso interno na unidade. | https://queridodiario.ok.org.br (diário oficial do município) | 2021-11-17 |
| `sc-criciuma/cnes-estabelecimentos.json` | Os estabelecimentos de Criciúma que atendem pelo SUS (201 de 1.247), com endereço, telefone, coordenada e turno. Gerado por `scripts/baixa_cnes.py`. | https://apidadosabertos.saude.gov.br/cnes/estabelecimentos | atualização contínua |
| `nacional/cnes-tipos-unidade.json` | A tabela oficial de tipos de estabelecimento do CNES, usada para categorizar as unidades. | https://apidadosabertos.saude.gov.br/cnes/tipounidades | atualização contínua |
| `nacional/populacao-censo-2022.json` | População residente de cada município no Censo 2022. Não é dado de saúde: ordena a fila de importação de REMUMEs. Gerado por `scripts/baixa_populacao_ibge.py`. | https://servicodados.ibge.gov.br/api/v3/agregados/4709 | 2022 |

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

## Programa Farmácia Popular

Duas fontes, com destinos diferentes.

**O elenco** (`nacional/pfpb-elenco-2026-08-31.pdf`) é um PDF de uma página,
com a tabela de indicações e princípios ativos. Entra no `fontes.json` como
arquivo: o job semanal compara o SHA-256 e abre PR quando muda.

A tabela tem duas colunas, e o rótulo da indicação vem **centralizado** na
altura do grupo dele. O texto corrido perde essa ligação, então
`scripts/extrai_farmacia_popular.py` lê as coordenadas de cada linha e resolve
o agrupamento por programação dinâmica, minimizando a distância entre o centro
de cada bloco e o rótulo. O script imprime o agrupamento inteiro ao rodar —
é isso que precisa de olho humano antes do merge, porque é o que a máquina
pode errar sem avisar.

**Os endereços das farmácias credenciadas** saem do painel oficial, por
`scripts/extrai-farmacias-pfpb.mjs`, e viram
`data/municipios/<id>/farmacias-populares.json`.

O painel é um Qlik Sense: o dado só sai pela Engine API, por WebSocket. Três
caminhos foram testados em 06/09/2026:

| Caminho | Resultado |
|---|---|
| WebSocket direto no `infoms.saude.gov.br` | **403** em todos os caminhos de proxy (`/app`, `/anon/app`, `/sense/app`), com e sem cookie de sessão, por curl e por Node |
| Planilha `farmacias_credenciadas_pfpb_atualizada.xlsx` no gov.br | **"Conteúdo Restrito"**. Não é WAF: o mesmo `curl` simples baixa o PDF do elenco do mesmo host. O Ministério despublicou o arquivo, e a pasta `/publicacoes` inteira está restrita. O Internet Archive só guardou as páginas HTML, nunca o binário |
| API do `dados.gov.br` | **401**: exige chave pessoal |

O que funciona é carregar o painel num Chromium e falar com o Qlik de dentro
da própria página, onde a sessão é válida. É o mesmo caminho de quem abre o
painel e clica em baixar, feito sem a pessoa. O `playwright` está como
`devDependency`: não vai para o navegador de quem usa o site.

```bash
node scripts/extrai-farmacias-pfpb.mjs --campos            # confere os nomes dos campos
node scripts/extrai-farmacias-pfpb.mjs --municipio sc-criciuma
```

O job semanal roda isso sozinho. Quando nenhuma farmácia entra nem sai, só
`verificado_em` avança e o commit vai direto para o `main`; quando a lista
muda, abre pull request com quem entrou e quem saiu.

### O que o painel não dá, e como o CNPJ resolve

O objeto do painel — "Farmácias Ativas" — tem quatro colunas, e só:
**CNPJ, Farmácia, Endereço, Bairro**. Sem número na rua, sem CEP, sem
coordenada, e "Farmácia" é a razão social, não o nome da placa.

Razão social e nome de rua não levam ninguém à porta. O CNPJ resolve os dois,
e é o que faz `scripts/completa-cnpj-farmacias.mjs`, consultando o cadastro
público da Receita Federal pela BrasilAPI:

```bash
node scripts/completa-cnpj-farmacias.mjs             # só o que entrou novo
node scripts/completa-cnpj-farmacias.mjs --refazer   # tudo de novo
```

De lá vêm nome de fachada, tipo do logradouro, número, complemento e CEP. Em
Criciúma, 34 de 34 resolveram, todos com número; 30 têm nome de fachada, e as
4 sem nome declarado aparecem na tela pela razão social.

Duas travas, porque endereço errado manda gente ao lugar errado:

1. O cadastro tem de ser do mesmo município e estar **ATIVO**.
2. A rua da Receita precisa ter **alguma palavra significativa em comum** com a
   do painel. Títulos e tipos de logradouro não contam ("doutor", "general",
   "rua"), senão "PRACA DR. NEREU RAMOS" e "DOUTOR NEREU RAMOS" pareceriam
   ruas diferentes. Um CNPJ trocado cairia numa rua sem nenhuma palavra em
   comum; aí o registro fica como está e o script avisa.

Onde as fontes discordam só na escrita — "GAL." e "GENERAL", "NSA. SRA." e
"NOSSA SENHORA" —, vale a Receita, que é o endereço de registro e combina com
o CEP. Onde discordam de verdade, a diferença vira `divergencias` e aparece na
tela. São 3 em Criciúma, todas de bairro.

Por isso o bairro do painel fica guardado em `bairro_painel`, separado do que
vai à tela: refazer o cruzamento precisa comparar com o dado do painel, não
com o resultado da execução anterior — senão a divergência some na segunda
passada. Esse erro aconteceu e foi corrigido em 06/09/2026.

### A coordenada: CNEFE do IBGE

Nem o painel nem a Receita dão coordenada por farmácia. Quem dá é o **CNEFE**,
o Cadastro Nacional de Endereços do Censo 2022: uma linha por endereço da
cidade, com CEP, logradouro, número e o ponto que o recenseador registrou na
porta. Um arquivo por município, 2,2 MB para Criciúma, guardado em
`data/fontes/nacional/cnefe-4204608-criciuma.zip`.

```bash
node scripts/geocodifica-farmacias.mjs
```

Duas qualidades de resultado, e a tela distingue as duas:

- **`numero`** — o cadastro tem aquele número naquela rua. É a porta. São 22.
- **`aproximada`** — o cadastro não tem aquele número, e o ponto sai
  interpolado entre os dois vizinhos que ele tem. A farmácia está naquele
  trecho da rua. São 11, com pino vazado no mapa e aviso na lista.

Interpolar é bem melhor que pegar o vizinho mais próximo: na Avenida
Universitária, o vizinho mais perto do 2210 é o 1711 — meio quilômetro antes.
Entre 1711 e 2380, o ponto cai quase no lugar.

Sobra **1 sem ponto**: o cadastro não conhece a Praça Dr. Nereu Ramos.

### Como o casamento de rua evita o vizinho errado

O CNEFE escreve o logradouro à sua maneira, então a comparação é por palavras,
ignorando tipo e título ("rua", "avenida", "doutor", "general"). Mas **uma
palavra em comum não basta**, e este erro aconteceu aqui: "Praça Dr. Nereu
Ramos" casou com "Rua Nereu Alfredo Villain", noutro bairro, a dois
quilômetros. Daí as duas portas de entrada:

- **Mesmo CEP**: o CEP já prova que é a rua certa, então uma palavra em comum
  resolve diferença de grafia ("VALENTIM" e "VALENTIN", "OSVALDO" e "OSWALDO").
- **CEP que o cadastro não conhece**: só entra quem tem **todas** as palavras
  do endereço procurado. É o que separa "Nereu Ramos" de "Nereu Alfredo
  Villain".

Rodar com `--refazer` limpa o ponto antigo antes de recalcular — senão um
casamento que hoje é recusado continuaria no arquivo por ter passado ontem.

Esta coordenada mora em `GeoDoCadastro`, um tipo **separado** do `Geo` das
unidades do SUS. Aquele é pino que uma pessoa abriu no mapa e confirmou; este
ninguém abriu. A diferença entre "conferimos" e "casamos o endereço" não se
apaga.

### O que não funcionou, para ninguém repetir

Antes do CNEFE, geocodificar por serviço de endereço deu **1 acerto em 34**:

| Tentativa | Por que falhou |
|---|---|
| Nominatim / OpenStreetMap | O OSM **não tem numeração de casas** em Criciúma. Ele devolve um trecho da rua, e o trecho que escolhe não é o do número procurado |
| Coordenada de CEP da BrasilAPI | Cai no **centro do município** em metade dos casos: Rua São Francisco do Sul e Avenida Centenário devolvem o mesmo ponto |
| Cruzar as duas, aceitando só onde concordam | 1 em 34. Pior: onde concordavam ao metro, era porque uma copia da outra — concordância exata entre serviços "independentes" é cópia, não confirmação |

O `boundingbox` do Nominatim também não serve de margem de erro: ele é de um
trecho da rua, não da rua toda.

### Se um dos extratores quebrar

O painel pode mudar os nomes dos campos: `--campos` lista os que o app declara,
e basta corrigir a constante `CAMPOS` no script. Se o painel mudar de
tecnologia, a saída manual continua sendo filtrar UF e município, aba
"Informações", botão de download da tabela.

Sem o arquivo a página do programa não fica quebrada: mostra o link do painel,
e o `npm run valida-dados` avisa que a lista não existe.

### Como tirar a chave do dados.gov.br

A própria especificação da API (`https://dados.gov.br/v3/api-docs`) descreve o
esquema de autenticação:

- É uma chave de API em **cabeçalho HTTP**, de nome `chave-api-dados-abertos`.
- **Perfil Consumidor** (o nosso caso): entrar no `dados.gov.br` com a conta
  gov.br e abrir **"Minha Conta"** — a chave fica na área do lado direito da
  página. Não precisa de organização nem de aprovação.
- O perfil **Administrador da Organização** tira a chave em "Tokens de
  organização", na dashboard. Esse caminho é para quem *publica* dado, não
  para quem consome; não é o que precisamos.

Com a chave, o conjunto dos estabelecimentos credenciados fica em:

```bash
curl -H "chave-api-dados-abertos: $CHAVE" \
  "https://dados.gov.br/dados/api/publico/conjuntos-dados/farmacia_popular_estabelecimento"
```

A chave é pessoal: ela identifica quem consulta. Se um dia entrar no projeto,
vai como secret do GitHub Actions, nunca no repositório.

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

## Prospecção

`prospeccao/` não é fonte: é fila de trabalho. Guarda o resultado da busca por
atos que publicam REMUME no acervo do Querido Diário, para alguém ler e triar.
Nada dali vai à tela. Ver `data/fontes/prospeccao/README.md` e `docs/DADOS.md`.

## CNES

O arquivo do CNES não leva data no nome, ao contrário das outras fontes. Ele
muda todo mês e vale para 5.570 municípios: nome datado viraria um arquivo novo
por mês por cidade. A data que importa vem dentro, em `data_atualizacao` de cada
estabelecimento.

E ele é **podado**: guarda só quem atende pelo SUS, com `total_no_cnes`
registrando quantos vieram do cadastro. É a única fonte guardada pela metade, e
o motivo está em `docs/DADOS.md` — a cópia de origem serve para auditar o que o
site afirma, e o site não afirma nada sobre consultório particular.
