"""
Gera data/estados/sc/ceaf.json a partir do portal da SES/SC.

Para cada doença atendida pelo CEAF, a SES publica os papéis que o pedido
precisa: o protocolo que o médico segue, o formulário próprio da doença e o
termo de responsabilidade. É isso que falta nas cartilhas genéricas, que dizem
"traga os exames necessários" sem dizer quais.

Rodar:

    python3 scripts/extrai_ceaf_sc.py
"""
import json
import re
import html
import subprocess
import tempfile
import time
import unicodedata
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "data/estados/sc/ceaf.json"
SNAPSHOT = RAIZ / "data/fontes/sc/ceaf-condicoes-2026-09-04.json"

BASE = "https://www.saude.sc.gov.br"
INDICE = (
    BASE + "/index.php/pt/assistencia-farmaceutica/"
    "componente-especializado-da-assistencia-farmaceutica-ceaf"
)
UA = "tem-no-sus/0.0 (projeto voluntario de informacao publica de saude; +https://github.com/lbluewine/MED)"
HOJE = "2026-09-04"


def baixa(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read().decode("utf8", "replace")


def slug(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", t)).strip("-")


MIUDAS = {"de", "da", "do", "das", "dos", "e", "em", "com", "a", "o", "na", "no",
          "para", "por", "ao", "aos", "à", "às", "que", "sob"}
SIGLAS = {"CEAF", "SUS", "TER", "LME", "PCDT", "SES", "SC", "MS", "RME", "CID",
          "SAES", "SCTIE", "C1", "C5", "AME", "TTR", "HIV", "AIDS", "DPOC"}


def titulo_humano(bruto: str) -> str:
    """
    O portal escreve tudo em maiúscula. Texto todo em maiúscula é mais difícil
    de ler, e o público daqui lê com dificuldade. As siglas continuam em
    maiúscula porque é assim que se reconhecem.
    """
    t = re.sub(r"\s+", " ", html.unescape(bruto)).strip()
    if not t.isupper():
        return t
    palavras = []
    for i, p in enumerate(t.split()):
        limpa = re.sub(r"[^A-Za-zÀ-Ý0-9/]", "", p)
        if limpa in SIGLAS or all(x in SIGLAS for x in limpa.split("/") if x):
            palavras.append(p)
        elif i > 0 and p.lower() in MIUDAS:
            palavras.append(p.lower())
        else:
            palavras.append(p.capitalize())
    return " ".join(palavras)


# Que papel é esse, dito em português. Ver a tabela de tradução obrigatória de
# jargão em docs/CONTEUDO.md.
TIPOS = [
    (r"\bTERMO DE ESCLARECIMENTO|^TER\b|\bTER [A-ZÀ-Ý]", "termo_responsabilidade"),
    (r"\bFORMUL[ÁA]RIO", "formulario"),
    (r"\bRESUMO", "resumo"),
    (r"\bPORTARIA|\bPROTOCOLO CL[ÍI]NICO|\bPCDT", "protocolo"),
    (r"\bLME\b", "lme"),
    (r"\bDECLARA[ÇC][ÃA]O|\bTERMO DE CONSENTIMENTO|\bRECIBO", "declaracao"),
]


def tipo_documento(nome_bruto: str) -> str:
    for padrao, tipo in TIPOS:
        if re.search(padrao, nome_bruto, re.I):
            return tipo
    return "outro"


def condicoes_do_indice(pagina: str) -> dict[str, str]:
    """
    A lista fica no bloco "Protocolos clínicos, TER, resumos e formulários".

    Não usar o menu lateral: ele está desatualizado e traz doenças que já
    mudaram de nome. Foi assim que a Púrpura Trombocitopênica Idiopática, hoje
    Trombocitopenia Imune Primária, aparecia sem documento nenhum.
    """
    bloco = re.search(
        r'<div[^>]*class="[^"]*lista-ter[^"]*"[^>]*>(.*?)'
        r'(?=<div class="card-header"|</div>\s*</div>\s*</div>\s*</div>\s*</div>)',
        pagina,
        re.S,
    )
    if not bloco:
        raise SystemExit("não achei o bloco lista-ter no índice do CEAF")

    achadas = {}
    for href, nome in re.findall(
        r'<li><a href="([^"]+)"[^>]*>.*?</i>\s*([^<]+?)\s*</a></li>', bloco.group(1), re.S
    ):
        achadas[re.sub(r"\s+", " ", html.unescape(nome)).strip()] = href.split("?")[0]
    return achadas


# ---------------------------------------------------------------------------
# O PDF "Resumo" de cada doença
# ---------------------------------------------------------------------------
#
# O Resumo é a peça que faltava: ele lista, por medicamento, os "Anexos
# Obrigatórios", ou seja, quais exames e papéis aquele pedido exige. É a
# resposta que as cartilhas não dão.
#
# O mesmo PDF traz dose, critério de inclusão e monitoramento. Nada disso é
# lido aqui. É conteúdo clínico, e conteúdo clínico não vai ao ar sem revisão
# farmacêutica registrada. Ver a regra 2 no CLAUDE.md e docs/CONTEUDO.md.

# Onde a seção de anexos começa e onde termina, nas variações que a fonte usa.
INICIO_ANEXOS = re.compile(r"Anexos?\s+Obrigat[óo]ri[oa]s?\s*:?", re.I)
FIM_ANEXOS = re.compile(
    r"^\s*(Administra[çc][ãa]o|Posologia|Monitoramento|Exclus[ãa]o|Inclus[ãa]o|"
    r"Tempo\s+de\s+Tratamento|Prescri[çc][ãa]o|Medicamento|Apresenta[çc][ãa]o|"
    r"CID-?10|Crit[ée]rios?)\b",
    re.I | re.M,
)
RODAPE = re.compile(r"DIAF/SA[SE]/SES/SC.*|^\s*\d+\s*$", re.M)


def texto_do_pdf(caminho: Path) -> str:
    saida = subprocess.run(
        ["pdftotext", "-layout", str(caminho), "-"], capture_output=True, text=True
    )
    return saida.stdout


MEDICAMENTO = re.compile(r"^\s*Medicamentos?\s{2,}(.+?)\s*$", re.M)


def anexos_obrigatorios(texto: str) -> list[dict]:
    """
    Os "Anexos Obrigatórios" do Resumo, agrupados pelo medicamento a que
    pertencem.

    Cada remédio da doença pede exames diferentes, e juntar tudo numa lista só
    faria a pessoa achar que precisa de todos. O nome do medicamento vem da
    linha "Medicamento" logo acima do bloco.
    """
    grupos: list[dict] = []
    for m in INICIO_ANEXOS.finditer(texto):
        antes = texto[: m.start()]
        med = None
        for mm in MEDICAMENTO.finditer(antes):
            med = re.sub(r"\s+", " ", mm.group(1)).strip()

        resto = texto[m.end():]
        fim = FIM_ANEXOS.search(resto)
        trecho = RODAPE.sub(" ", resto[: fim.start()] if fim else resto[:1500])

        itens: list[str] = []
        for pedaco in re.split(r"[\n\r]+\s*(?:[-–—•‣]|\u200b|\d+[.)])\s*", trecho):
            item = re.sub(r"\s+", " ", pedaco).strip(" -–—•;:.\u200b\u2060")
            if 8 <= len(item) <= 400 and item not in itens:
                itens.append(item)
        if not itens:
            continue

        # Dois medicamentos podem pedir exatamente a mesma coisa.
        anterior = next((g for g in grupos if g["itens"] == itens), None)
        if anterior and med and med not in anterior["medicamentos"]:
            anterior["medicamentos"].append(med)
        elif not anterior:
            grupos.append({"medicamentos": [med] if med else [], "itens": itens})
    return grupos


CID = re.compile(r"CID-?10\s*:?\s*((?:[A-Z]\d{2}(?:\.\d+)?[,;\s]*)+)", re.I)


def cids(texto: str) -> list[str]:
    """Os códigos CID-10 que a doença usa. Vão no laudo, então ajudam a conferir."""
    fora: list[str] = []
    for m in CID.finditer(texto):
        for c in re.findall(r"[A-Z]\d{2}(?:\.\d+)?", m.group(1)):
            if c not in fora:
                fora.append(c)
    return fora


def le_resumo(url: str) -> tuple[list[str], list[str]] | None:
    """Baixa o Resumo e devolve (anexos, cids). None quando não dá para ler."""
    with tempfile.TemporaryDirectory() as tmp:
        destino = Path(tmp) / "resumo.pdf"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                destino.write_bytes(r.read())
        except Exception:
            return None
        if destino.read_bytes()[:4] != b"%PDF":
            return None
        texto = texto_do_pdf(destino)
    if not texto.strip():
        return None
    return anexos_obrigatorios(texto), cids(texto)


def documentos(pagina: str) -> list[dict]:
    """Cada bloco `edocman-document` é um papel que a pessoa pode precisar."""
    docs, vistos = [], set()
    for bloco in re.split(r'<div class="edocman-document', pagina)[1:]:
        m = re.search(
            r'<a href="([^"]+/download)"[^>]*class="edocman-document-title-link"[^>]*>(.*?)</a>',
            bloco,
            re.S,
        )
        if not m:
            continue
        url = BASE + html.unescape(m.group(1))
        bruto = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(2))).strip()
        nome = titulo_humano(bruto)
        if not nome or url in vistos:
            continue
        vistos.add(url)

        desc = re.search(
            r'<div class="edocman-description-details[^"]*">\s*<p>(.*?)</p>', bloco, re.S
        )
        tam = re.search(r'sizeinformation">.*?&nbsp;([\d.]+\s*\wB)', bloco, re.S)
        data = re.search(r'dateinformation">.*?&nbsp;(\d{2}-\d{2}-\d{4})', bloco, re.S)

        docs.append({
            "nome": nome,
            "tipo": tipo_documento(bruto),
            "url": url,
            "descricao": re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", desc.group(1)))).strip()
            if desc
            else None,
            "tamanho": tam.group(1).strip() if tam else None,
            "publicado_em": (
                "-".join(reversed(data.group(1).split("-"))) if data else None
            ),
        })
    return docs


DOCUMENTOS_GERAIS = (
    BASE + "/index.php/pt/servicos/assistencia-farmaceutica-diaf/"
    "componente-especializado-da-assistencia-farmaceutica-ceaf/documentos-do-ceaf"
)


def main() -> None:
    gerais = documentos(baixa(DOCUMENTOS_GERAIS))
    print(f"{len(gerais)} formulários padrão do CEAF")

    indice = baixa(INDICE)
    achadas = condicoes_do_indice(indice)
    print(f"{len(achadas)} condições no índice")

    condicoes, sem_doc, nao_lidos = [], [], []
    for i, (nome, href) in enumerate(sorted(achadas.items()), 1):
        pagina = baixa(BASE + href)
        docs = documentos(pagina)
        titulo = nome

        # O Resumo é onde estão os exames exigidos. Sem ele, a condição entra
        # só com os papéis, e a página diz que não sabe quais exames pedir.
        resumo = next((d for d in docs if d["tipo"] == "resumo"), None)
        anexos, cid10 = [], []
        if resumo:
            lido = le_resumo(resumo["url"])
            if lido:
                anexos, cid10 = lido
            else:
                nao_lidos.append(titulo)

        condicoes.append({
            "slug": slug(nome),
            "nome": titulo,
            "nome_fonte": html.unescape(nome).strip(),
            "url_fonte": BASE + href,
            "cid10": cid10,
            "anexos_obrigatorios": anexos,
            "documentos": docs,
        })
        if not docs:
            sem_doc.append(titulo)
        print(
            f"  [{i:>3}/{len(achadas)}] {titulo[:46]:<46} "
            f"{len(docs)} doc, {len(anexos)} grupo(s) de anexos"
        )
        time.sleep(0.8)

    SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT.write_text(
        json.dumps({"documentos_gerais": gerais, "condicoes": condicoes},
                   ensure_ascii=False, indent=1) + "\n",
        encoding="utf8",
    )

    saida = {
        "uf": "SC",
        "documentos_gerais": gerais,
        "condicoes": condicoes,
        "proveniencia": [{
            "fonte_nome": "Componente Especializado da Assistência Farmacêutica (CEAF) — SES/SC",
            "fonte_url": INDICE,
            "fonte_arquivo": "fontes/sc/ceaf-condicoes-2026-09-04.json",
            "fonte_data": HOJE,
            "extraido_em": HOJE,
            "verificado_em": HOJE,
            "metodo": "ia-assistida",
        }],
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

    total = sum(len(c["documentos"]) for c in condicoes)
    print(f"\n{len(condicoes)} condições, {total} documentos")
    com_anexos = sum(1 for c in condicoes if c["anexos_obrigatorios"])
    print(f"{com_anexos} condições com os exames exigidos extraídos do Resumo")
    if sem_doc:
        print(f"{len(sem_doc)} sem documento nenhum: {', '.join(sem_doc[:8])}")
    if nao_lidos:
        print(f"{len(nao_lidos)} com Resumo que não deu para ler: {', '.join(nao_lidos[:8])}")


if __name__ == "__main__":
    main()
