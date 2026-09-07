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

## Fontes por tipo de dado

| Dado | Fonte |
|---|---|
| Lista municipal | REMUME publicada pela Prefeitura de Criciúma |
| Unidades e horários | REMUME + CNES/DataSUS |
| Lista estadual de alto custo | Relação estadual do CEAF — SES/SC |
| Regras por doença | PCDT do Ministério da Saúde |
| Mudanças no CEAF de SC | Notas técnicas da DIAF/SPS/SES/SC |
| Bula | Bulário Eletrônico da Anvisa (link, não cópia) |
| Preço | Tabela CMED/Anvisa |
| Farmácia Popular | Elenco de medicamentos e insumos do PFPB (PDF do Ministério da Saúde) |
| Farmácias credenciadas do PFPB | Painel de endereços do Ministério — consultado pelo usuário, nunca copiado |

Sempre linkar a bula, nunca copiar o texto dela.
