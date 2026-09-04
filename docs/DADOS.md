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
  fontes/
    sc-criciuma/
      remume-2024-11.pdf    # cópia do PDF de origem
      remume-2024-11.sha256
```

**Nada no código pode assumir que só existe Criciúma.** Rotas, buscas e
componentes recebem o município como parâmetro desde o primeiro dia.

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
| Farmácia Popular | Lista de medicamentos do programa |

Sempre linkar a bula, nunca copiar o texto dela.
