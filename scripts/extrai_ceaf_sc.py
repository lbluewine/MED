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
    achadas = {}
    for href, nome in re.findall(
        r'<a[^>]+href="([^"]+)"[^>]*>\s*([^<]{3,120}?)\s*</a>', pagina
    ):
        if "componente-especializado-da-assistencia-farmaceutica-ceaf" not in href:
            continue
        if "protocolos-clinicos-ter-resumos-e-formularios/" not in href:
            continue
        achadas[html.unescape(nome).strip()] = href
    return achadas


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

    condicoes, sem_doc = [], []
    for i, (nome, href) in enumerate(sorted(achadas.items()), 1):
        pagina = baixa(BASE + href)
        docs = documentos(pagina)
        titulo = titulo_humano(nome)
        condicoes.append({
            "slug": slug(nome),
            "nome": titulo,
            "nome_fonte": html.unescape(nome).strip(),
            "url_fonte": BASE + href,
            "documentos": docs,
        })
        if not docs:
            sem_doc.append(titulo)
        print(f"  [{i:>3}/{len(achadas)}] {titulo[:52]:<52} {len(docs)} documento(s)")
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
    if sem_doc:
        print(f"{len(sem_doc)} sem documento nenhum: {', '.join(sem_doc[:8])}")


if __name__ == "__main__":
    main()
