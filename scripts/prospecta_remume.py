"""
Procura, no Querido Diário, o ato que publica a REMUME de cada município.

    python3 scripts/prospecta_remume.py                 # todos os que o QD raspa
    python3 scripts/prospecta_remume.py --uf SC
    python3 scripts/prospecta_remume.py --limite 40     # os 40 mais populosos
    python3 scripts/prospecta_remume.py --refaz         # ignora o cache

Este script **não produz dado de saúde**. Ele produz uma fila de trabalho: em
que municípios existe um ato publicando a lista municipal, em que diário ele
saiu e qual o link. Quem lê o documento, decide se é a REMUME vigente e
extrai a lista é gente — regra 3 do CLAUDE.md.

A classificação de cada diário é uma aposta de triagem, nada mais:

    ato        o texto aprova, institui ou atualiza a relação municipal
    licitacao  cita a REMUME como objeto de compra (pregão, ata de preços)
    mencao     cita o termo sem que dê para dizer o quê

Ruído é o normal aqui: a maior parte das citações à REMUME em diário oficial é
edital de compra, não a lista. Ver docs/DADOS.md.

Saída:
    data/fontes/prospeccao/candidatos.json   # a fila, legível por máquina
    data/fontes/prospeccao/RELATORIO.md      # a mesma fila, para ler
"""
import argparse
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
IBGE = RAIZ / "data/nacional/municipios-ibge.json"
POPULACAO = RAIZ / "data/fontes/nacional/populacao-censo-2022.json"
DESTINO = RAIZ / "data/fontes/prospeccao"
CACHE = RAIZ / ".cache/prospeccao"

API = "https://api.queridodiario.org.br"
UA = (
    "tem-no-sus/0.0 (projeto voluntario de informacao publica de saude; "
    "+https://github.com/lbluewine/MED)"
)
HOJE = date.today().isoformat()

# Sintaxe "simple query string" do OpenSearch. Só o OU entre frases exatas:
# parênteses e o + de obrigatoriedade fazem a API responder 500.
TERMOS = '"REMUME" | "Relação Municipal de Medicamentos"'

# O texto do diário chega com OCR sujo e acentuação quebrada, então toda
# classificação roda sobre o texto sem acento e em minúsculas.
RELACAO = r"(?:remume|relacao municipal de medicamentos)"

ATO = [
    # "Aprova a Relação Municipal de Medicamentos", "atualiza a REMUME"
    re.compile(
        r"\b(?:aprov|institu|atualiz|revis|reformul|republic)\w*\s+"
        r"(?:[ao]s?\s+)?(?:nov[ao]\s+)?(?:versao\s+d[ao]\s+)?(?:relacao\s+)?" + RELACAO
    ),
    # "a REMUME fica aprovada", "fica instituída a Relação Municipal"
    re.compile(RELACAO + r"[^.]{0,90}\bfica\w*\s+(?:aprovad|institu|atualizad)"),
    re.compile(r"\bfica\w*\s+(?:aprovad\w+|institu\w+|atualizad\w+)[^.]{0,60}" + RELACAO),
]

# O ato que publica a lista costuma nomear a versão: "REMUME 2026/2028",
# "REMUME – 2018/2019". Portaria de comissão nunca faz isso.
ATO_COM_VERSAO = re.compile(
    r"\b(?:aprov|institu|atualiz|homolog)\w*\s+(?:[ao]s?\s+)?(?:nov[ao]\s+)?"
    r"(?:relacao\s+)?" + RELACAO + r"[^.]{0,60}\b(?:19|20)\d{2}\b"
)

# Portaria que cria a Comissão de Farmácia e Terapêutica lista "atualizar a
# REMUME" entre as atribuições dela. Isso prova que a cidade tem uma REMUME,
# mas não é o ato que publica a lista, e enche a fila por cima do que importa.
VERBOS_DE_LISTA = (
    r"(?:atualizar|elaborar|revisar|reavaliar|avaliar|propor|assessorar|manter|"
    r"selecionar|padronizar|promover|emitir|validar|implementar|garantir|rever)"
)
ATRIBUICAO = re.compile(
    r"(?:\bcompete\s+[àa]|\batribuicoes\s+(?:d[ao]|desta|deste|seguintes)|"
    r"comissao\s+de\s+farmacia\s+e\s+terapeutica|\bcftp?\b|"
    r"regimento\s+interno|fica\s+criada\s+a\s+comissao|designacao\s+nominal|"
    # A lista de atribuições tem forma própria: item marcado seguido de verbo
    # no infinitivo. "; Atualizar a REMUME", "3.1.3. Elaborar e atualizar…",
    # "a) Atualizar…", "I – Elaborar…".
    r"[;•·]\s*" + VERBOS_DE_LISTA + r"\b|"
    r"\d\.\d(?:\.\d)?\.?\s*" + VERBOS_DE_LISTA + r"\b|"
    r"\b[a-z]\)\s*" + VERBOS_DE_LISTA + r"\b|"
    r"\b[ivx]+\s*[.–-]\s*" + VERBOS_DE_LISTA + r"\b|"
    r"\b\d{1,2}\s*[.–-]\s*" + VERBOS_DE_LISTA + r"\b)"
)

# "No uso de suas atribuições legais" é fórmula de abertura de qualquer ato, e
# não pode contar como lista de atribuições de comissão.
FORMULA = re.compile(r"no\s+uso\s+d[ae]s?\s+(?:suas\s+)?atribuicoes\s+\w*")

LICITACAO = re.compile(
    r"\b(?:pregao|licitat\w+|licitacao|ata\s+de\s+registro\s+de\s+preco|"
    r"registro\s+de\s+precos|dispensa\s+de\s+licitacao|chamamento\s+publico|"
    r"termo\s+de\s+referencia|inexigibilidade|edital\s+n)"
)


def sem_acento(texto: str) -> str:
    plano = unicodedata.normalize("NFKD", texto)
    plano = "".join(c for c in plano if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", plano).lower()


def classifica(trechos: list[str]) -> str:
    junto = FORMULA.sub(" ", sem_acento(" ".join(trechos)))
    if ATO_COM_VERSAO.search(junto):
        return "ato"
    if any(p.search(junto) for p in ATO):
        return "atribuicao" if ATRIBUICAO.search(junto) else "ato"
    if LICITACAO.search(junto):
        return "licitacao"
    return "mencao"


def trecho_que_casou(trechos: list[str]) -> str:
    """
    Qual dos trechos do diário fez a classificação dar "ato".

    O relatório mostrava o primeiro trecho, que quase nunca é o que casou —
    quem for triar acabava lendo o parágrafo errado e descartando candidato bom.
    """
    for trecho in trechos:
        plano = FORMULA.sub(" ", sem_acento(trecho))
        if ATO_COM_VERSAO.search(plano) or any(p.search(plano) for p in ATO):
            return trecho
    return trechos[0] if trechos else ""


def pede(caminho: str, parametros: list[tuple[str, str]], tentativas: int = 6) -> dict:
    """
    A API cai com frequência e responde 503 "no available server". Isso não é
    motivo para abortar uma varredura de horas: espera e tenta de novo.
    """
    url = f"{API}{caminho}?{urllib.parse.urlencode(parametros)}"
    espera = 3.0
    for tentativa in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read())
        except (urllib.error.URLError, urllib.error.HTTPError, OSError,
                json.JSONDecodeError) as e:
            if tentativa == tentativas:
                raise RuntimeError(f"{caminho}: desistiu depois de {tentativas} tentativas ({e})")
            print(f"      API não respondeu ({e}); nova tentativa em {espera:.0f}s", flush=True)
            time.sleep(espera)
            espera = min(espera * 2, 60)
    raise AssertionError("inalcançável")


def cidades_raspadas(niveis: set[str]) -> list[dict]:
    """
    Nível 0 é município catalogado sem diário raspado: não há o que buscar.

    O nível **não** diz se o acervo é pesquisável. Blumenau, São José, Itajaí e
    Chapecó são nível 1 e devolvem zero para qualquer palavra; São Paulo também
    é nível 1 e responde normalmente. Quem separa um caso do outro é a sonda de
    `acervo_pesquisavel`, não o nível.
    """
    return [c for c in pede("/cities", [])["cities"] if c.get("level") in niveis]


# Palavra que existe em qualquer diário oficial de qualquer prefeitura. Serve
# de sonda: zero aqui não quer dizer "esta cidade não tem REMUME", quer dizer
# "o acervo desta cidade não tem texto para pesquisar". Confundir os dois é
# publicar conclusão errada sobre a cidade.
SONDA = '"prefeitura"'


def tem_acervo_pesquisavel(territory_id: str) -> bool | None:
    """None quando nem a sonda conseguiu resposta — não se conclui nada."""
    try:
        resposta = pede("/gazettes", [
            ("querystring", SONDA),
            ("territory_ids", territory_id),
            ("size", "1"),
        ], tentativas=3)
    except RuntimeError:
        return None
    return bool(resposta.get("total_gazettes", 0))


def busca(territory_id: str, tamanho: int, desde: str | None, salto: int = 0) -> dict:
    parametros = [
        ("querystring", TERMOS),
        ("territory_ids", territory_id),
        ("size", str(tamanho)),
        ("offset", str(salto)),
        ("sort_by", "descending_date"),
        ("number_of_excerpts", "3"),
        ("excerpt_size", "500"),
    ]
    if desde:
        parametros.append(("published_since", desde))
    return pede("/gazettes", parametros)


def para_candidatos(bruto: dict) -> list[dict]:
    candidatos = []
    for g in bruto.get("gazettes", []):
        trechos = [" ".join(t.split()) for t in g.get("excerpts", [])]
        candidatos.append({
            "data": g["date"],
            "edicao": g.get("edition"),
            "edicao_extra": g.get("is_extra_edition"),
            "classificacao": classifica(trechos),
            "url": g["url"],
            "txt_url": g.get("txt_url"),
            "trechos": trechos,
        })
    return candidatos


def carrega_apoio() -> tuple[dict[int, dict], dict[int, int]]:
    cadastro = {m["codigo_ibge"]: m for m in json.loads(IBGE.read_text(encoding="utf8"))["municipios"]}
    if not POPULACAO.exists():
        sys.exit("Falta data/fontes/nacional/populacao-censo-2022.json.\n"
                 "Rode antes: python3 scripts/baixa_populacao_ibge.py")
    pop = {m["codigo_ibge"]: m["populacao"]
           for m in json.loads(POPULACAO.read_text(encoding="utf8"))["municipios"]}
    return cadastro, pop


def ja_temos(slug: str) -> bool:
    return (RAIZ / "data/municipios" / slug / "remume.json").exists()


def prospecta(args: argparse.Namespace) -> dict:
    cadastro, populacao = carrega_apoio()
    niveis = {n.strip() for n in args.niveis.split(",")}
    cidades = cidades_raspadas(niveis)
    total_raspados = len(cidades)
    print(f"{total_raspados} municípios com diário raspado pelo Querido Diário "
          f"(nível {args.niveis})", flush=True)

    for c in cidades:
        c["ibge"] = int(c["territory_id"])
        c["populacao"] = populacao.get(c["ibge"], 0)
    if args.uf:
        alvos = {u.strip().upper() for u in args.uf.split(",")}
        cidades = [c for c in cidades if c["state_code"] in alvos]
    cidades.sort(key=lambda c: -c["populacao"])
    if args.limite:
        cidades = cidades[: args.limite]

    CACHE.mkdir(parents=True, exist_ok=True)
    consulta_atual = {"termos": TERMOS, "tamanho": args.tamanho, "desde": args.desde}
    resultado, erros = [], []

    for i, c in enumerate(cidades, 1):
        slug = cadastro.get(c["ibge"], {}).get("slug")
        rotulo = f'{c["territory_name"]}/{c["state_code"]}'
        cache = CACHE / f'{c["territory_id"]}.json'

        # O cache guarda só a resposta crua da API. A classificação é
        # recalculada toda vez, de propósito: regra nova precisa valer para o
        # que já foi baixado, senão a fila fica com triagem de duas épocas.
        guardado = {}
        if cache.exists() and not args.refaz:
            lido = json.loads(cache.read_text(encoding="utf8"))
            if lido.get("consulta") == consulta_atual:
                guardado = lido
        paginas = guardado.get("paginas", [])
        pesquisavel = guardado.get("acervo_pesquisavel")
        novidade = False

        if not paginas:
            print(f'[{i}/{len(cidades)}] {rotulo}', flush=True)
            try:
                paginas = [busca(c["territory_id"], args.tamanho, args.desde)]
            except RuntimeError as e:
                print(f"      !! {e}", flush=True)
                erros.append(rotulo)
                continue
            novidade = True
            time.sleep(args.espera)

        total = paginas[0].get("total_gazettes", 0)
        candidatos = [x for pagina in paginas for x in para_candidatos(pagina)]

        # Segunda passada: a busca vem do diário mais novo para o mais velho, e
        # o decreto que aprovou a lista costuma ser antigo. Numa cidade que cita
        # a REMUME cem vezes em edital, ele fica atrás da fila. Só desce mais
        # fundo onde as páginas já lidas não acharam ato nenhum.
        while (args.fundo
               and not any(x["classificacao"] == "ato" for x in candidatos)
               and len(paginas) * args.tamanho < min(total, args.fundo)):
            try:
                pagina = busca(c["territory_id"], args.tamanho, args.desde,
                               len(paginas) * args.tamanho)
            except RuntimeError as e:
                print(f"      !! página {len(paginas)}: {e}", flush=True)
                break
            paginas.append(pagina)
            candidatos += para_candidatos(pagina)
            novidade = True
            time.sleep(args.espera)

        # Zero resultado tem duas causas muito diferentes, e o relatório não
        # pode juntar as duas: a cidade não cita a REMUME, ou o acervo dela não
        # tem texto para pesquisar.
        if total == 0 and pesquisavel is None:
            pesquisavel = tem_acervo_pesquisavel(c["territory_id"])
            novidade = True
            time.sleep(args.espera)
        elif total:
            pesquisavel = True

        if novidade:
            cache.write_text(json.dumps({
                "consulta": consulta_atual,
                "paginas": paginas,
                "acervo_pesquisavel": pesquisavel,
            }, ensure_ascii=False), encoding="utf8")

        atos = [x for x in candidatos if x["classificacao"] == "ato"]
        resultado.append({
            "slug": slug,
            "ibge": c["ibge"],
            "nome": c["territory_name"],
            "uf": c["state_code"],
            "populacao": c["populacao"],
            "nivel_qd": c["level"],
            "acervo_pesquisavel": pesquisavel,
            "ja_no_site": bool(slug and ja_temos(slug)),
            "diarios_com_o_termo": total,
            "diarios_lidos": len(candidatos),
            "atos_encontrados": len(atos),
            "atribuicoes_encontradas": sum(
                1 for x in candidatos if x["classificacao"] == "atribuicao"),
            "candidatos": candidatos,
        })

    if erros:
        print(f"\n{len(erros)} município(s) ficaram sem resposta da API: {', '.join(erros[:10])}")

    return {
        "gerado_em": HOJE,
        "consulta": {
            "api": f"{API}/gazettes",
            "termos": TERMOS,
            "publicados_desde": args.desde,
            "diarios_por_municipio": args.tamanho,
            "diarios_no_maximo_por_municipio": args.fundo,
        },
        "cobertura": {
            "municipios_no_brasil": len(cadastro),
            "municipios_com_diario_raspado": total_raspados,
            "niveis_do_qd_consultados": sorted(niveis),
            "consultados": len(resultado),
            "com_ato_provavel": sum(1 for m in resultado if m["atos_encontrados"]),
            "sem_resposta_da_api": erros,
        },
        "municipios": sorted(
            resultado, key=lambda m: (-m["atos_encontrados"], -m["populacao"])
        ),
        "proveniencia": [{
            "fonte_nome": "Querido Diário — Open Knowledge Brasil",
            "fonte_url": f"{API}/gazettes",
            "fonte_arquivo": "fontes/prospeccao/candidatos.json",
            "fonte_data": HOJE,
            "extraido_em": HOJE,
            "verificado_em": HOJE,
            "metodo": "automatica",
        }],
    }


def escreve_relatorio(dados: dict) -> str:
    c = dados["cobertura"]
    populacao_coberta = sum(m["populacao"] for m in dados["municipios"] if m["atos_encontrados"])
    so_atribuicao = [m for m in dados["municipios"]
                     if not m["atos_encontrados"] and m["atribuicoes_encontradas"]]

    linhas = [
        "# Prospecção de REMUME no Querido Diário",
        "",
        f"Gerado em {dados['gerado_em']} por `scripts/prospecta_remume.py`.",
        "",
        "**Isto não é dado de saúde.** É a fila de trabalho: onde parece existir",
        "um ato publicando a lista municipal. Nada daqui entra no site sem alguém",
        "abrir o documento, confirmar que é a REMUME vigente e extrair a lista.",
        "",
        "| | |",
        "|---|---|",
        f"| Municípios consultados | {c['consultados']} |",
        f"| Com ato provável | {c['com_ato_provavel']} |",
        f"| Só com portaria de comissão | {len(so_atribuicao)} |",
        f"| População nesses municípios | {populacao_coberta:,} |".replace(",", "."),
        "",
        "## Com ato provável",
        "",
        "| Município | UF | População | Atos | Diários citando | Último ato | Link |",
        "|---|---|---:|---:|---:|---|---|",
    ]
    for m in dados["municipios"]:
        if not m["atos_encontrados"]:
            continue
        ato = next(x for x in m["candidatos"] if x["classificacao"] == "ato")
        marca = " ✔" if m["ja_no_site"] else ""
        linhas.append(
            f'| {m["nome"]}{marca} | {m["uf"]} | {m["populacao"]:,} | {m["atos_encontrados"]} | '
            f'{m["diarios_com_o_termo"]} | {ato["data"]} | [diário]({ato["url"]}) |'.replace(",", ".")
        )


    com_ato = [m for m in dados["municipios"] if m["atos_encontrados"]]
    if com_ato:
        linhas += ["", "### O trecho que fez cada um entrar na fila", ""]
        for m in com_ato:
            ato = next(x for x in m["candidatos"] if x["classificacao"] == "ato")
            trecho = trecho_que_casou(ato["trechos"])
            if len(trecho) > 400:
                trecho = trecho[:400] + "…"
            linhas += [f'**{m["nome"]}/{m["uf"]}** — {ato["data"]}, '
                       f'[diário]({ato["url"]})' + (f' · [txt]({ato["txt_url"]})'
                                                    if ato.get("txt_url") else ""),
                       "", f"> {trecho}", ""]

    linhas += [
        "",
        "## Têm REMUME, mas o que apareceu foi a comissão",
        "",
        "Portaria que cria a Comissão de Farmácia e Terapêutica e lista",
        "\"atualizar a REMUME\" entre as atribuições dela. Não é o ato que publica",
        "a lista — mas prova que a lista existe, e costuma nomear quem responde",
        "por ela na prefeitura. Bom ponto de partida para pedir o documento.",
        "",
        "| Município | UF | População | Diários citando | Lidos |",
        "|---|---|---:|---:|---:|",
    ]
    for m in so_atribuicao[:60]:
        linhas.append(
            f'| {m["nome"]} | {m["uf"]} | {m["populacao"]:,} | {m["diarios_com_o_termo"]} | '
            f'{m["diarios_lidos"]} |'.replace(",", "."))

    so_ruido = [m for m in dados["municipios"]
                if not m["atos_encontrados"] and not m["atribuicoes_encontradas"]
                and m["diarios_com_o_termo"]]
    linhas += [
        "",
        "## Citam a REMUME, mas nenhum trecho parece ser o ato",
        "",
        "Quase sempre é edital de compra. Vale um olho quando a cidade é grande",
        "e a coluna *Lidos* for bem menor que *Diários citando*: aí o ato pode",
        "só não ter sido alcançado. A triagem é por palavra e erra nos dois lados.",
        "",
        "| Município | UF | População | Diários citando | Lidos |",
        "|---|---|---:|---:|---:|",
    ]
    for m in so_ruido[:120]:
        linhas.append(
            f'| {m["nome"]} | {m["uf"]} | {m["populacao"]:,} | {m["diarios_com_o_termo"]} | '
            f'{m["diarios_lidos"]} |'.replace(",", ".")
        )
    if len(so_ruido) > 120:
        linhas.append(f"\n… e mais {len(so_ruido) - 120} municípios.")

    sem_termo = [m for m in dados["municipios"]
                 if not m["diarios_com_o_termo"] and m["acervo_pesquisavel"] is True]
    sem_texto = [m for m in dados["municipios"] if m["acervo_pesquisavel"] is False]
    sem_sonda = [m for m in dados["municipios"] if m["acervo_pesquisavel"] is None]

    linhas += [
        "",
        f"E {len(sem_termo)} municípios com acervo pesquisável não citam o termo",
        "em nenhum diário. Aí é achado de verdade: ou a cidade não publicou a lista",
        "no diário, ou publicou antes do que o acervo alcança.",
        "",
        "## Sem texto pesquisável",
        "",
        f"{len(sem_texto)} municípios têm diário raspado mas devolvem zero até para a",
        "palavra *prefeitura*. **Não dá para concluir nada sobre a REMUME deles por",
        "aqui** — é acervo sem texto, não cidade sem lista. O nível de abertura do",
        "Querido Diário não separa esses casos: São Paulo é nível 1 e responde",
        "normalmente; Blumenau é nível 1 e devolve zero.",
        "",
    ]
    if sem_texto:
        linhas += ["| Município | UF | População |", "|---|---|---:|"]
        for m in sorted(sem_texto, key=lambda m: -m["populacao"])[:60]:
            linhas.append(
                f'| {m["nome"]} | {m["uf"]} | {m["populacao"]:,} |'.replace(",", "."))
        if len(sem_texto) > 60:
            linhas.append(f"\n… e mais {len(sem_texto) - 60} municípios.")
    if sem_sonda:
        linhas.append(f"\nEm {len(sem_sonda)} municípios nem a sonda teve resposta da API.")
    linhas += [
        "",
        "## Como triar um candidato",
        "",
        "1. Abrir o diário e achar o ato. O trecho no `candidatos.json` diz onde.",
        "2. Conferir se é a REMUME **vigente** — decreto de 2019 revogado por um",
        "   de 2023 não serve, e a lista costuma vir em anexo separado.",
        "3. Guardar o documento em `data/fontes/<uf>-<cidade>/` com o SHA-256.",
        "4. Extrair para o schema e abrir PR. Ver `docs/DADOS.md`.",
        "",
    ]
    return "\n".join(linhas)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    p.add_argument("--uf", help="só estas UFs, separadas por vírgula")
    p.add_argument("--niveis", default="1,3",
                   help="níveis de abertura do Querido Diário a consultar "
                        "(padrão 1,3 — todos os que têm diário raspado)")
    p.add_argument("--limite", type=int, help="só os N municípios mais populosos")
    p.add_argument("--desde", help="só diários publicados a partir de AAAA-MM-DD")
    p.add_argument("--tamanho", type=int, default=20,
                   help="quantos diários trazer por município (padrão 20)")
    p.add_argument("--fundo", type=int, default=100,
                   help="quantos diários no máximo vasculhar quando a primeira "
                        "página não acha ato (padrão 100; 0 desliga)")
    p.add_argument("--espera", type=float, default=0.5,
                   help="segundos entre chamadas à API (padrão 0,5)")
    p.add_argument("--refaz", action="store_true", help="ignora o cache local")
    args = p.parse_args()

    dados = prospecta(args)

    DESTINO.mkdir(parents=True, exist_ok=True)
    (DESTINO / "candidatos.json").write_text(
        json.dumps(dados, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    (DESTINO / "RELATORIO.md").write_text(escreve_relatorio(dados), encoding="utf8")

    c = dados["cobertura"]
    print(f"\n{c['consultados']} municípios consultados, "
          f"{c['com_ato_provavel']} com ato provável")
    print(f"gravado em {DESTINO.relative_to(RAIZ)}/")


if __name__ == "__main__":
    main()
