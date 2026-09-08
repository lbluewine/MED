"""
Confere se a REMUME de cada município continua onde o catálogo diz.

    python3 scripts/acha_remume.py            # todas as do catálogo
    python3 scripts/acha_remume.py sc-criciuma

Roda a cascata de fallback, parando no primeiro degrau que responder:

    1. link direto guardado
    2. página de listagem + regra de casamento
    3. Querido Diário (a fila que scripts/prospecta_remume.py já levantou)
    4. pedido pela LAI — não automatizável; o relatório só diz que chegou aqui

O resultado volta para data/fontes/prefeituras.json, em `remume.situacao`, e a
página /fontes publica o que quebrou. É esse o ciclo: link morre calado, e
alguém de fora costuma descobrir antes da gente.

## Por que o link direto não é a âncora, e mesmo assim é o primeiro degrau

Domínio de prefeitura é estável; caminho até o PDF não é. A REMUME de Criciúma
mora em `/redes-de-atencao-saude/material-apoio/20` — ID sequencial dentro de
um sistema interno, que não sobrevive a troca de CMS. Ancorar na página que
lista os documentos sobreviveria à republicação anual.

Só que essa página nem sempre existe de forma legível: o site do CIGTES é uma
aplicação JavaScript, e baixar o HTML dela devolve uma casca sem link nenhum.
Por isso `ancora` diz, por município, o que dá para fazer ali — e `listagem_js`
é registro honesto de "precisaria de navegador", não promessa de que funciona.
"""
import argparse
import hashlib
import json
import re
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CATALOGO = RAIZ / "data/fontes/prefeituras.json"
PROSPECCAO = RAIZ / "data/fontes/prospeccao/candidatos.json"
HOJE = date.today().isoformat()
UA = "Mozilla/5.0 (compatible; tem-no-sus/0.0; +https://github.com/lbluewine/MED)"

SEM_TLS = ssl.create_default_context()
SEM_TLS.check_hostname = False
SEM_TLS.verify_mode = ssl.CERT_NONE


def baixa(url: str, maximo: int = 12_000_000) -> tuple[int | None, str | None, bytes]:
    """
    Status `None` quer dizer que não houve resposta nenhuma — DNS morto,
    conexão recusada, tempo esgotado. Um 404 **não** é isso: é o servidor
    dizendo que aquele caminho não existe mais, e as duas coisas pedem ações
    diferentes de quem for consertar.
    """
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60, context=SEM_TLS) as r:
            return r.status, r.headers.get("Content-Type", ""), r.read(maximo)
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Content-Type", ""), b""
    except (urllib.error.URLError, OSError, ValueError):
        return None, None, b""


def e_documento(tipo: str | None, corpo: bytes) -> bool:
    """PDF de verdade começa com %PDF. Página de erro com status 200 não."""
    if corpo[:4] == b"%PDF":
        return True
    return bool(tipo and ("pdf" in tipo or "spreadsheet" in tipo or "excel" in tipo))


def tenta_link_direto(remume: dict) -> dict | None:
    url = remume.get("url_documento")
    if not url:
        return None
    status, tipo, corpo = baixa(url)
    if status is None:
        return {"situacao": "fora_do_ar", "detalhe": "o endereço não respondeu"}
    if status != 200 or not e_documento(tipo, corpo):
        return {"situacao": "mudou_de_lugar",
                "detalhe": f"o endereço respondeu {status} e não devolveu documento"}
    return {"situacao": "no_lugar", "achado_por": "direta",
            "url_documento": url,
            "sha256": hashlib.sha256(corpo).hexdigest()}


def tenta_listagem(remume: dict) -> dict | None:
    """
    Procura, na página de listagem, o link cujo texto ou endereço casa com a
    regra do município. Sem JavaScript: o que a página só monta no navegador
    esta etapa não vê, e é por isso que existe o degrau seguinte.
    """
    listagem, regra = remume.get("url_listagem"), remume.get("regra")
    if not listagem or not regra:
        return None
    status, _, corpo = baixa(listagem)
    if status != 200 or not corpo:
        return {"situacao": "fora_do_ar",
                "detalhe": "a página de listagem não respondeu"}

    html = corpo.decode("utf8", "ignore")
    padrao = re.compile(regra, re.I)
    achados = [
        urllib.parse.urljoin(listagem, href)
        for href, texto in re.findall(r'href="([^"]+)"[^>]*>(.*?)</a>', html, re.S | re.I)
        if padrao.search(texto) or padrao.search(href)
    ]
    for url in achados:
        status, tipo, doc = baixa(url)
        if status == 200 and e_documento(tipo, doc):
            return {"situacao": "no_lugar", "achado_por": "listagem",
                    "url_documento": url,
                    "sha256": hashlib.sha256(doc).hexdigest()}
    return {"situacao": "nao_achado",
            "detalhe": f"a listagem respondeu, mas nenhum link casou com “{regra}”"}


def tenta_querido_diario(slug: str) -> dict | None:
    if not PROSPECCAO.exists():
        return None
    fila = json.loads(PROSPECCAO.read_text(encoding="utf8"))["municipios"]
    municipio = next((m for m in fila if m["slug"] == slug), None)
    if not municipio or not municipio["atos_encontrados"]:
        return None
    ato = next(c for c in municipio["candidatos"] if c["classificacao"] == "ato")
    return {"situacao": "so_no_diario", "achado_por": "querido_diario",
            "detalhe": f'há um ato provável no diário de {ato["data"]}',
            "url_diario": ato["url"]}


# O que uma pessoa escreveu no bloco. Tudo o mais é resultado da última
# execução e é reescrito do zero: um `detalhe` de "respondeu 404" sobrevivendo
# ao lado de um `situacao: no_lugar` faria o relatório se contradizer.
CAMPOS_HUMANOS = ("ancora", "url_listagem", "regra", "url_documento", "observacao")


def confere(prefeitura: dict) -> dict:
    remume = prefeitura.get("remume") or {}
    base = {c: remume.get(c) for c in CAMPOS_HUMANOS}
    zerado = {"situacao": None, "achado_por": None, "detalhe": None,
              "url_diario": None, "sha256": None, "conferido_em": HOJE}

    direto = tenta_link_direto(remume)
    listagem = tenta_listagem(remume)
    for tentativa in (direto, listagem):
        if tentativa and tentativa["situacao"] == "no_lugar":
            return {**base, **zerado, **tentativa}

    # Nenhum degrau do site funcionou. O diário não substitui a lista, mas diz
    # a quem procurar onde ela foi publicada.
    diario = tenta_querido_diario(prefeitura["slug"])
    if diario:
        return {**base, **zerado, **diario}

    falha = direto or listagem or {
        "situacao": "sem_pista",
        "detalhe": "não há link, listagem nem ato no diário — resta a LAI",
    }
    return {**base, **zerado, **falha}


def main() -> None:
    p = argparse.ArgumentParser(description="Confere onde está a REMUME de cada município.")
    p.add_argument("municipios", nargs="*", help="slugs; vazio confere o catálogo todo")
    args = p.parse_args()

    if not CATALOGO.exists():
        sys.exit("Falta data/fontes/prefeituras.json.\n"
                 "Rode antes: python3 scripts/monta_catalogo_prefeituras.py")
    catalogo = json.loads(CATALOGO.read_text(encoding="utf8"))

    alvos = [p for p in catalogo["prefeituras"]
             if (not args.municipios or p["slug"] in args.municipios)
             and (p.get("remume") or p["slug"] in args.municipios)]
    if not alvos:
        sys.exit("Nenhum município do catálogo tem o bloco `remume` preenchido.\n"
                 "É trabalho humano: achar onde a prefeitura publica a lista e "
                 "escrever em data/fontes/prefeituras.json.")

    contagem: dict[str, int] = {}
    for prefeitura in alvos:
        resultado = confere(prefeitura)
        prefeitura["remume"] = resultado
        situacao = resultado["situacao"]
        contagem[situacao] = contagem.get(situacao, 0) + 1
        detalhe = resultado.get("detalhe", "")
        print(f'{prefeitura["nome"]}/{prefeitura["uf"]}: {situacao}'
              + (f" — {detalhe}" if detalhe else ""))

    CATALOGO.write_text(json.dumps(catalogo, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf8")
    print("\n" + ", ".join(f"{n} {s}" for s, n in sorted(contagem.items(),
                                                         key=lambda kv: -kv[1])))
    print(f"gravado em {CATALOGO.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
