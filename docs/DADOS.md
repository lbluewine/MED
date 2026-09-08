# DADOS.md — schema, proveniência e atualização

## Princípio

O banco de dados é o repositório Git. Sem servidor de banco, sem CMS. Arquivos
JSON versionados, validados por Zod no build. Se não valida, o build quebra.

Vantagens: histórico de toda mudança de graça, revisão por pull request, custo
zero, e nada para cair de madrugada.

## Estrutura de pastas

```
data/
  municipios/
    sc-criciuma/
      municipio.json        # dados do município e configuração
      unidades.json         # farmácias e dispensários
      remume.json           # lista municipal de medicamentos
    sc-icara/
      ...
  estados/
    sc/
      ceaf.json             # lista estadual do CEAF
      unidades-ceaf.json    # onde protocolar e retirar
  nacional/
    medicamentos.json       # ficha por princípio ativo (conteúdo editorial)
    precos-cmed.json        # gerado, não editar à mão
    condicoes.json          # condições de saúde e os PCDT relacionados
    rename.json             # piso nacional (RENAME) — cidade sem REMUME própria
    municipios-ibge.json    # cadastro de nomes de cidade — não é dado de saúde
  fontes/
    sc-criciuma/
      remume-2024-11.pdf    # cópia do PDF de origem
      remume-2024-11.sha256
```

**Nada no código pode assumir que só existe Criciúma.** Rotas, buscas e
componentes recebem o município como parâmetro desde o primeiro dia.

### Município sem REMUME própria — o piso da RENAME

`data/nacional/rename.json` é a RENAME (Relação Nacional de Medicamentos
Essenciais): o que o SUS garante em qualquer município do Brasil, com ou sem
lista própria. `data/nacional/municipios-ibge.json` é só o cadastro de nomes
de cidade do IBGE — não é dado de saúde, é o universo válido para as rotas
`/[municipio]` e para o seletor de cidade.

`lib/dados.ts#resolveMunicipio(slug)` decide o modo: se existe pasta em
`data/municipios/`, a cidade responde com a REMUME dela, como sempre. Se não
existe mas o slug está no cadastro do IBGE, a cidade entra em modo genérico —
responde só pelo piso da RENAME, nunca por endereço de unidade, distrito ou
tipo de receita, porque isso é decisão de cada prefeitura e essa parte a gente
não tem. Ver `docs/ROADMAP.md`, v2.

## Bloco de proveniência

Todo registro que aparece na tela carrega este bloco. É obrigatório e validado.

```json
"proveniencia": {
  "fonte_nome": "REMUME Criciúma versão 11/2024",
  "fonte_url": "https://www.criciuma.sc.gov.br/assistenciafarmaceutica",
  "fonte_arquivo": "fontes/sc-criciuma/remume-2024-11.pdf",
  "fonte_data": "2024-11-01",
  "extraido_em": "2026-03-10",
  "verificado_em": "2026-03-10",
  "metodo": "ia-assistida"
}
```

- `fonte_data` — data da versão do documento de origem.
- `extraido_em` — quando o dado foi lido da fonte.
- `verificado_em` — quando alguém/algo conferiu pela última vez que a fonte não
  mudou. **Atualiza mesmo quando nada muda.**
- `metodo` — `manual`, `ia-assistida` ou `automatica`.

### Por que separar `verificado_em` de `fonte_data`

É o que dá confiança ao leitor e nenhum site de prefeitura faz. A interface
mostra "conferido hoje" mesmo que a lista seja de 2024 — porque conferido hoje
significa que hoje ainda é a lista válida.

Se `verificado_em` passar de **90 dias**, a interface mostra o aviso de dado
desatualizado (frase padrão em `docs/CONTEUDO.md`).

## Schemas

### `unidades.json`

```json
{
  "id": "criciuma-farmacia-central",
  "nome": "Farmácia Central",
  "tipo": "farmacia_municipal",
  "endereco": {
    "logradouro": "Rua João Pessoa, 187",
    "bairro": "Centro",
    "cep": "88801-530",
    "lat": -28.6775,
    "lng": -49.3697
  },
  "telefones": ["(48) 3445-8730"],
  "horarios": [
    { "dias": "seg-sex", "abre": "08:00", "fecha": "17:00" }
  ],
  "dispensa": ["basico", "controlado"],
  "restricao": null,
  "observacoes": "Medicamentos controlados só nesta unidade.",
  "proveniencia": { }
}
```

- `tipo`: `farmacia_municipal` | `dispensario_ubs` | `farmacia_ceaf` |
  `farmacia_caps` | `farmacia_popular`
- `dispensa`: quais componentes a unidade entrega.
- `restricao`: texto quando o atendimento é limitado a um público. Ex.: as
  farmácias dos CAPS atendem só quem é acompanhado no serviço. **Nunca mande
  alguém para uma unidade sem mostrar a restrição.**

### `remume.json` (item)

```json
{
  "principio_ativo": "losartana potássica",
  "concentracao": "50 mg",
  "forma": "comprimido",
  "componente": "basico",
  "onde_retirar": ["dispensario_ubs", "farmacia_municipal"],
  "exige": ["receita_sus_valida", "documento_com_foto", "cartao_sus"],
  "observacoes": null,
  "proveniencia": { }
}
```

`componente`: `basico` | `especializado` | `estrategico`.

### `medicamentos.json` — ficha editorial (nacional)

Separada da lista municipal de propósito: a ficha de conteúdo é a mesma no país
inteiro; o que muda por município é se tem e onde pegar.

```json
{
  "slug": "losartana",
  "principio_ativo": "losartana potássica",
  "nomes_populares": ["losartan", "remédio da pressão"],
  "para_que_serve_simples": "Baixa a pressão do sangue.",
  "como_tomar": "...",
  "se_esquecer": "...",
  "como_guardar": "...",
  "efeitos_comuns": ["..."],
  "quando_procurar_ajuda": ["..."],
  "bula_paciente_url": "https://consultas.anvisa.gov.br/...",
  "revisao": {
    "revisor_nome": "…",
    "revisor_crf": "CRF-SC 00000",
    "revisado_em": "2026-03-12",
    "escopo": "como tomar, armazenamento e efeitos comuns",
    "autorizacao_registrada": true
  },
  "proveniencia": { }
}
```

Sem `revisao` preenchida e com `autorizacao_registrada: true`, os campos
clínicos **não são renderizados**. O build não quebra — a página simplesmente
mostra só o que tem fonte e o link para a bula.

### `farmacia-popular.json` — elenco do PFPB (nacional)

O programa é federal: a lista é a mesma no país inteiro, e por isso mora em
`nacional/`. O arquivo sai de `scripts/extrai_farmacia_popular.py`.

```json
{
  "fonte_atualizada_em": "2026-08-31",
  "como_retirar": { "gratuito": true, "documentos": ["..."], "onde": "...",
                    "proveniencia": [] },
  "busca_enderecos": { "url": "https://infoms.saude.gov.br/...", "nome": "..." },
  "grupos": [
    {
      "indicacao": "HIPERTENSÃO",
      "slug": "hipertensao",
      "itens": [
        {
          "texto": "losartana potássica 50mg",
          "principios_ativos": ["losartana potássica"],
          "observacao": null,
          "insumo": false
        }
      ]
    }
  ],
  "proveniencia": []
}
```

Duas proveniências, porque são duas fontes: o elenco sai do PDF, e as regras de
retirada saem da página do programa.

`texto` é o item como o Ministério escreve, e é o que a tela mostra.
`principios_ativos` existe só para cruzar com a REMUME, em
`lib/farmacia-popular.ts`. O cruzamento exige **igualdade do conjunto de
princípios ativos**, depois de reduzir cada nome à base — "cloridrato de
metformina" e "Metformina, cloridrato de" são o mesmo. Na dúvida, não casa:
"carbidopa + levodopa" não casa com "levodopa + benserazida".

Nenhuma tela afirma que a apresentação do PFPB é igual à da REMUME. Muitas
vezes não é — o programa tem metoprolol 25 mg e a cidade tem 50 mg.

### `farmacias-populares.json` — rede credenciada (por município)

As drogarias privadas credenciadas no PFPB nesta cidade. Não entram em
`unidades.json`: não são unidade do SUS, não têm componente nem exigência
municipal, e não é a prefeitura que responde por elas.

```json
{
  "municipio_id": "sc-criciuma",
  "farmacias": [
    {
      "cnpj": "09077244000147",
      "razao_social": "DROGARIA E FARMACIA MARANATA LTDA",
      "nome_fantasia": "REDE PRECO BARATO",
      "logradouro": "RUA SAO FRANCISCO DO SUL, 135",
      "complemento": "SALA 01",
      "bairro_painel": "BOA VISTA",
      "bairro": "SAO FRANCISCO",
      "cep": "88805-700",
      "divergencias": ["O painel informa o bairro BOA VISTA, e a Receita SAO FRANCISCO."]
    }
  ],
  "proveniencia": []
}
```

Duas fontes, dois scripts, nesta ordem:

1. `node scripts/extrai-farmacias-pfpb.mjs` lê o painel do Ministério num
   navegador e traz CNPJ, razão social, rua e bairro.
2. `node scripts/completa-cnpj-farmacias.mjs` usa o CNPJ para buscar no
   cadastro da Receita o nome de fachada, o número, o complemento e o CEP.
3. `node scripts/geocodifica-farmacias.mjs` casa rua e número com o CNEFE do
   IBGE e preenche `geo`, com `precisao` dizendo se é o número exato ou um
   ponto interpolado entre os vizinhos.

Arquivo opcional: sem ele a página do programa mostra só o link do painel, e
`npm run valida-dados` avisa — e avisa de novo se alguma farmácia ficar sem
endereço completo.

`nome_fantasia` é o nome da placa, e é o que a tela mostra; nulo, vale a razão
social. `bairro_painel` guarda o que o Ministério informa, separado do `bairro`
que vai à tela, para o cruzamento poder ser refeito sem se comparar com o
próprio resultado.

`geo` é do tipo `GeoDoCadastro`, **separado** do `Geo` das unidades do SUS:
aquele é pino conferido por uma pessoa, este é endereço casado com o cadastro
do IBGE. Quem não casa fica fora do mapa e continua na lista. Ver
`data/fontes/FONTES.md`.

A rede muda com o tempo, então a data da versão fica ao lado da lista, não só
no rodapé. Quando nenhuma farmácia entra nem sai, o extrator mantém
`fonte_data` e `extraido_em` e avança só `verificado_em` — a versão do dado é
a mesma, o que mudou é que hoje ela foi conferida.

### `precos-cmed.json` — gerado

Baixado da tabela CMED/Anvisa. Nunca editar à mão. Guardar a coluna de PMC
referente ao ICMS de Santa Catarina e registrar qual coluna foi usada:

```json
{
  "ean": "7891234567890",
  "descricao": "LOSARTANA POTASSICA 50 MG COM REV CT BL AL PLAS INC X 30",
  "pmc": 48.90,
  "coluna_icms": "17%",
  "tabela_referencia": "2026-03",
  "proveniencia": { }
}
```

## Pipeline de atualização

A IA resolve **extração**. Não resolve atualização. Atualização tem quatro
etapas e a IA só serve para uma:

| Etapa | Como | Quem |
|---|---|---|
| 1. Detectar mudança | Agendador baixa a fonte, compara SHA-256 com o snapshot guardado | Robô |
| 2. Extrair | Converter o PDF/planilha novo em JSON no schema | IA |
| 3. Comparar | Diff item a item contra o publicado: entrou, saiu, mudou | Robô |
| 4. Aprovar e publicar | Revisar o diff e dar merge | **Humano** |

Implementação: GitHub Actions semanal que, ao detectar mudança, abre um **pull
request** com o novo JSON, o novo PDF de origem e o diff no corpo do PR.
Ninguém precisa acordar; o PR espera.

### O estado fica em público

`scripts/verifica_fontes.py` escreve `data/fontes/estado.json` a cada execução,
e o build gera a página `/fontes` a partir dele: o que foi conferido, quando,
o que mudou e o que não respondeu.

É a única parte de `data/` que fala do site em vez de falar de saúde, e é
pública de propósito. Nenhum site de prefeitura mostra isso, e é justamente o
que dá confiança — dizer na cara quando um link morreu vale mais que uma página
que parece sempre em ordem. Também é como um estranho descobre que a prefeitura
mudou o endereço de um documento e avisa onde ele está agora.

A página é estática, sem login e sem servidor: não há nada para administrar
ali, só o que já aconteceu para ler. Painel com autenticação briga com o
`CLAUDE.md`, seção 6.

Dois campos merecem atenção, porque respondem perguntas diferentes:

- `conferida_em` — quando o robô conseguiu **olhar** a fonte. Fica nulo quando
  ela nunca respondeu: carimbar a data de hoje numa fonte que não respondeu
  seria mentir exatamente no campo que existe para dar confiança.
- `mudou_em` — quando o documento mudou pela última vez. É o que responde "de
  quando é a versão que está no ar", e por isso sobrevive às execuções em que
  nada muda.

### Regras inegociáveis

- **Nunca fazer merge automático de dado.** O erro perigoso não é a IA errar —
  é errar em silêncio num item e ninguém notar por oito meses. Diff pequeno se
  revisa em cinco minutos.
- **Sempre guardar o arquivo de origem** junto com o JSON gerado. Quando alguém
  disser "isso está errado", você precisa saber se o erro foi seu ou da fonte.
- **Rodar a verificação mesmo sem mudança**, atualizando `verificado_em`.
- Se a fonte sair do ar ou mudar de URL, o job falha ruidosamente. Falha
  silenciosa é pior que erro.

## Cruzar a lista de um município com a nacional

O site precisa saber, para cada medicamento da lista de uma prefeitura, se ele
é o mesmo que a RENAME chama de outro jeito. Sem isso a lista A–Z mostra o
mesmo remédio duas vezes — uma como da prefeitura, outra como do piso nacional
— e diz que a cidade não tem algo que ela entrega.

Só que **cruzar por nome não é confiável**, porque nenhuma fonte escreve igual:

| A RENAME escreve | A REMUME de Criciúma escreve |
|---|---|
| `cloridrato de metformina` | `Metformina, cloridrato de` |
| `acetato de betametasona + fosfato dissódico de betametasona` | `Dipropionato de Betametasona + ... Suspensão Injetável` |
| `ácido folínico` | `Folinato de cálcio (ácido folínico)` |
| `algestona acetofenida + enantato de estradiol` | `Algestona acetofenida + estradiol enantato (injetável mensal)` |

São dois mecanismos, nesta ordem:

**1. Regras automáticas** (`lib/nomes-medicamentos.ts`). Inverter o sal, cortar
a forma farmacêutica colada no fim, ler o sinônimo entre parênteses. Cobrem os
padrões que já apareceram e resolvem a maior parte sozinhas.

**2. Dicionário revisado** (`data/nacional/nomes-equivalentes.json`). O que a
regra não resolve. Cada entrada diz uma grafia, o nome canônico na RENAME (ou
`null` quando a conclusão é que **não** está nela) e quem conferiu.

### Por que dicionário, e não mais regras

Aumentar as regras não escala. Cada prefeitura tem suas convenções, e com
Criciúma sozinha já são **52 grafias sem par (29% da lista dela)**. Com as 295
cidades de Santa Catarina, seria editar código a cada importação — e código não
guarda quem aprovou o quê.

O dicionário é dado: revisável, versionado, com autoria, e **vale para todas as
cidades de uma vez**. Como as REMUMEs municipais copiam da RENAME e umas das
outras, os nomes se repetem: o dicionário melhora a cada cidade que entra, em
vez de piorar.

Um `"canonico": null` também é resposta. A cidade pode ter mais que o piso
nacional — acetilcisteína, adenosina e ácido ascórbico estão na lista de
Criciúma e não na RENAME —, e registrar isso tira o nome do relatório para
sempre.

### Como revisar

```
npm run revisa-equivalencias            # todas as cidades
npm run revisa-equivalencias sc-criciuma
```

O relatório lista o que não casou e sugere nomes parecidos da RENAME. **Ele só
imprime.** Casar por semelhança automaticamente levaria alguém ao medicamento
errado; quem decide que dois nomes são o mesmo medicamento é gente, e a decisão
vai à mão para o JSON com `revisado_por` preenchido. É a regra 3 do
`CLAUDE.md`.

### O código ATC

A RENAME publica o código ATC de 456 dos 513 medicamentos (Apêndice A), e ele
vai no `rename.json`. É o único identificador estável que a lista traz — nome é
convenção, código não. As listas municipais não trazem código, então ele ainda
não serve de chave para o cruzamento; serve de conferência quando alguém revisa
uma equivalência, e é a base se um dia uma fonte municipal publicar código.

## Unidades de saúde: o cadastro federal resolve

Endereço de posto de saúde **não precisa de catálogo de sites de prefeitura.**
O CNES (Cadastro Nacional de Estabelecimentos de Saúde) publica, por município,
no Brasil inteiro e com o mesmo formato em todo lugar: nome, endereço, bairro,
CEP, telefone, coordenada, turno de atendimento e tipo de estabelecimento.

```
npm run baixa-cnes -- sc-criciuma --tipos    # baixa o cru para data/fontes/
npm run extrai-cnes -- sc-criciuma           # traduz para o schema
```

### Por que é um arquivo separado de `unidades.json`

São duas perguntas diferentes, e juntá-las faria o site inventar:

| Arquivo | Responde | Fonte |
|---|---|---|
| `unidades.json` | onde retirar este medicamento | a prefeitura |
| `unidades-cnes.json` | que unidades de saúde existem aqui | cadastro federal |

O CNES não sabe o que cada unidade entrega, qual receita ela exige, nem que a
farmácia do CAPS só atende quem é acompanhado lá. Isso é decisão de cada
município. Se os dois arquivos virassem um, o site passaria a dizer que uma UBS
entrega um medicamento porque ela existe — a invenção que a regra 1 do
`CLAUDE.md` proíbe.

É o mesmo motivo pelo qual as farmácias credenciadas do PFPB moram em
`farmacias-populares.json` e não em `unidades.json`.

### O que se filtra e o que se guarda

O cadastro traz **tudo**: em Criciúma são 1.247 estabelecimentos, dos quais
1.046 não atendem pelo SUS — consultório particular, laboratório privado.
Mandar alguém a uma clínica particular seria pior que não mostrar nada, então
**o snapshot guarda só quem atende pelo SUS**, com o total do cadastro
registrado no cabeçalho do arquivo.

Isso contraria em parte a regra de "sempre guardar o arquivo de origem", e é
proposital. A cópia de origem existe para auditar o que o site afirma, e o site
não afirma nada sobre consultório particular. Guardar os outros 1.046 custaria
6x mais bytes por município sem servir de prova para nada: 2,3 MB viram 368 KB,
e o arquivo publicado cai de 912 KB para 152 KB. A 300 municípios, é a
diferença entre 270 MB e 45 MB no repositório.

Os 39 tipos do CNES viram nove categorias (`ubs`, `caps`, `farmacia`,
`pronto_atendimento`, `hospital`, `especializado`, `apoio_diagnostico`,
`gestao`, `outro`), derivadas da descrição oficial e não de uma tabela de
códigos decorada — o CNES acrescenta tipo novo, e código decorado envelhece
calado. O tipo original fica no registro, em `tipo_cnes`.

### O que o CNES não dá

- **Horário.** Só o turno, na palavra dele: "ATENDIMENTOS NOS TURNOS DA MANHA E
  A TARDE". Não é hora de abrir e fechar, e o site não inventa uma.
- **Restrição de público.** Continua vindo da prefeitura.
- **O que a unidade dispensa.** Idem.
- **Coordenada conferida.** O que vem é o ponto que o próprio estabelecimento
  declarou. Por isso `GeoDoCnes` é um tipo separado de `Geo` (pino conferido
  por pessoa) e de `GeoDoCadastro` (endereço casado com o IBGE). O site não
  pode dizer "conferimos" sobre o que ninguém conferiu.

## Achar a REMUME de outros municípios

Não existe base nacional de listas municipais. Cada prefeitura publica a sua
onde quer, no formato que quer, e muitas não publicam. A coleta é, por isso,
descentralizada, e tem duas portas.

**A porta boa é o Querido Diário**, da Open Knowledge Brasil, que raspa e
publica o diário oficial de cerca de 950 dos 5.570 municípios. Como a REMUME é
aprovada por decreto ou portaria publicada no diário, dá para procurar o ato:

```
npm run baixa-populacao                      # uma vez: Censo 2022, ordena a fila
npm run prospecta-remume                     # todos os municípios raspados
npm run prospecta-remume -- --uf SC
npm run prospecta-remume -- --limite 40      # os 40 mais populosos
```

A saída é `data/fontes/prospeccao/RELATORIO.md`: a fila de leitura, com o
município, o diário, a data e o link. **Não é dado de saúde** — é indicação de
onde procurar. Ver `data/fontes/prospeccao/README.md`.

### O catálogo de prefeituras e a cascata

A segunda porta é o site da própria prefeitura, e ela precisa de um catálogo —
`data/fontes/prefeituras.json` — porque não existe fonte nacional de REMUME.

```
npm run catalogo-prefeituras -- --da-prospeccao   # descobre o site
npm run acha-remume                               # confere onde está a lista
```

O domínio é adivinhado pelo padrão `cidade.uf.gov.br` e **confirmado pelo
título da página**: só vale quando o título diz "prefeitura" e o nome da
cidade. Medido em 08/09/2026 nos 60 maiores municípios, o padrão acerta 82%. O
resto é abreviação que só uma pessoa resolve — `pmf.sc.gov.br` para
Florianópolis, `campos.rj.gov.br` para Campos dos Goytacazes.

`scripts/acha_remume.py` roda a cascata e para no primeiro degrau que responder:

1. link direto guardado
2. página de listagem + regra de casamento
3. Querido Diário, a fila que a prospecção já levantou
4. pedido pela LAI — não automatizável; o relatório só diz que chegou aqui

O que uma pessoa escreve no catálogo **nunca é sobrescrito**. É o ponto dele: o
trabalho humano de achar onde a lista mora fica guardado, e a rodada seguinte
parte daí em vez de recomeçar.

### Ancorar na listagem é melhor — quando ela existe

Domínio de prefeitura é estável; caminho até o PDF não é. A REMUME de Criciúma
mora em `/redes-de-atencao-saude/material-apoio/20`: ID sequencial dentro de um
sistema interno, que não sobrevive a uma troca de CMS. Ancorar na página que
lista os documentos sobreviveria à republicação anual, que é justamente quando
mais se precisa achar o arquivo novo.

Só que essa página nem sempre dá para ler. O site do CIGTES, que publica a
REMUME de Criciúma, é uma aplicação JavaScript: baixar o HTML devolve 7,8 MB de
casca sem um único link. Por isso o campo `ancora` registra o que dá para fazer
naquele site — `direta`, `listagem` ou `listagem_js` —, e `listagem_js` é
registro honesto de "precisaria de um navegador", não promessa de que funciona.

### Quando o link morre

`situacao` separa coisas que pedem ações diferentes, e um 404 não é um servidor
mudo: `mudou_de_lugar` é a prefeitura ter trocado o caminho do arquivo,
`fora_do_ar` é não haver resposta nenhuma, `nao_achado` é a listagem responder
sem nenhum link casar, `so_no_diario` é a lista existir só no diário oficial, e
`sem_pista` é o fim da linha automática — resta a LAI.

Tudo o que não está `no_lugar` aparece na página `/fontes`, em português. Link
de prefeitura quebra calado, e quem costuma descobrir primeiro é alguém de fora.

Por isso o catálogo **não** entra em `fontes.json`: ele não é documento de
origem, é arquivo nosso, e carimba a data a cada execução — comparar o hash
acusaria mudança toda semana. O job semanal roda `acha_remume.py` num passo
próprio, que não derruba a execução quando um site cai.

### Por que a triagem é humana

A busca por palavra encontra o termo, não o ato. Na prática, a maior parte das
citações à REMUME em diário oficial é edital de compra, e a segunda maior é
portaria que cria a Comissão de Farmácia e Terapêutica e lista "atualizar a
REMUME" entre as atribuições dela — na varredura dos 60 maiores municípios, 22
dos 24 primeiros "atos" eram isso. O script separa as três coisas, mas é aposta
de ordenação: quem decide que aquele documento é a lista vigente daquela cidade
é gente, antes de qualquer extração.

Zero resultado também não é resposta. Parte dos acervos raspados não tem texto
para pesquisar, e devolve vazio para qualquer palavra — inclusive "prefeitura".
O script sonda com essa palavra e o relatório separa a cidade que não cita a
REMUME daquela sobre a qual não dá para dizer nada. O nível de abertura do
Querido Diário não serve para essa separação: São Paulo é nível 1 e responde,
Blumenau é nível 1 e não.

E vigente é a palavra difícil. Decreto de 2019 revogado por um de 2023 continua
no acervo, e publicar a lista errada é pior que não publicar nenhuma — a pessoa
vai à farmácia atrás de um medicamento que a cidade tirou da lista.

### Priorizar por população

`data/fontes/nacional/populacao-censo-2022.json` guarda a população de cada
município e existe só para ordenar essa fila. Uns 300 municípios respondem por
metade da população do país; os 5.270 restantes dão o mesmo trabalho cada um e
atendem alguns milhares de pessoas. A ordem é essa, e o relatório já sai
ordenado.

Município que não entrar continua respondendo pelo piso da RENAME, que é o que
o SUS garante em qualquer lugar do Brasil. Ninguém fica sem resposta.

## Fontes por tipo de dado

| Dado | Fonte |
|---|---|
| Lista municipal | REMUME publicada pela Prefeitura de Criciúma |
| Unidades e horários de dispensação | REMUME publicada pela prefeitura |
| Rede de unidades de saúde do município | CNES — API de dados abertos do Ministério da Saúde |
| Lista estadual de alto custo | Relação estadual do CEAF — SES/SC |
| Regras por doença | PCDT do Ministério da Saúde |
| Mudanças no CEAF de SC | Notas técnicas da DIAF/SPS/SES/SC |
| Bula | Bulário Eletrônico da Anvisa (link, não cópia) |
| Preço | Tabela CMED/Anvisa |
| Farmácia Popular | Elenco de medicamentos e insumos do PFPB (PDF do Ministério da Saúde) |
| Farmácias credenciadas do PFPB | Painel de endereços do Ministério — consultado pelo usuário, nunca copiado |
| Onde procurar a REMUME de um município | Querido Diário (Open Knowledge Brasil) — indicação de fonte, não dado |
| População, para priorizar a fila | Censo 2022 do IBGE — não é dado de saúde |

Sempre linkar a bula, nunca copiar o texto dela.
