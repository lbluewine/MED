"""
Monta o catálogo de sites oficiais de prefeitura.

    python3 scripts/monta_catalogo_prefeituras.py --da-prospeccao
    python3 scripts/monta_catalogo_prefeituras.py --limite 200
    python3 scripts/monta_catalogo_prefeituras.py --uf SC

Grava data/fontes/prefeituras.json: onde fica o site de cada prefeitura e, por
município, onde a REMUME dela é publicada.

O catálogo existe porque a REMUME **não tem fonte nacional**. Endereço de posto
de saúde tem — é o CNES, e por isso não passa por aqui (ver docs/DADOS.md).

O domínio é adivinhado pelo padrão `cidade.uf.gov.br` e **confirmado pelo
título da página**: só entra como confirmado quando o título diz "prefeitura" e
o nome da cidade. Medido em 08/09/2026 nos 60 maiores municípios, o padrão
acerta 82%; o resto é abreviação que só uma pessoa resolve — `pmf.sc.gov.br`
para Florianópolis, `campos.rj.gov.br` para Campos dos Goytacazes. Esses ficam
com `confirmacao: "nenhuma"` esperando alguém preencher.

**O que uma pessoa escreve à mão neste arquivo nunca é sobrescrito.** É o ponto
do catálogo: o trabalho humano de achar onde a lista mora fica guardado, e a
próxima execução parte dele em vez de recomeçar.
"""
import argparse
import json
import re
import socket
import ssl
import sys
import unicodedata
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
IBGE = RAIZ / "data/nacional/municipios-ibge.json"
POPULACAO = RAIZ / "data/fontes/nacional/populacao-censo-2022.json"
PROSPECCAO = RAIZ / "data/fontes/prospeccao/candidatos.json"
CATALOGO = RAIZ / "data/fontes/prefeituras.json"
MUNICIPIOS = RAIZ / "data/municipios"

HOJE = date.today().isoformat()
UA = "Mozilla/5.0 (compatible; tem-no-sus/0.0; +https://github.com/lbluewine/MED)"

# Muito site de prefeitura serve certificado vencido ou com cadeia incompleta.
# Recusar por isso deixaria o catálogo pior sem deixar ninguém mais seguro: só
# se lê o título de uma página pública, não se envia nada.
SEM_TLS = ssl.create_default_context()
SEM_TLS.check_hostname = False
SEM_TLS.verify_mode = ssl.CERT_NONE


def sem_acento(texto: str) -> str:
    plano = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in plano if not unicodedata.combining(c)).lower()


def candidatos(slug: str) -> list[str]:
    uf, _, nome = slug.partition("-")
    base = nome.replace("-", "")
    return [f"{base}.{uf}.gov.br", f"pm{base}.{uf}.gov.br"]


def resolve(dominio: str) -> bool:
    try:
        socket.getaddrinfo(dominio, 443, proto=socket.IPPROTO_TCP)
        return True
    except socket.gaierror:
        return False


def le_titulo(url: str) -> tuple[int | None, str | None]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=25, context=SEM_TLS) as r:
            html = r.read(80_000).decode("utf8", "ignore")
            status = r.status
    except (urllib.error.URLError, urllib.error.HTTPError, OSError, ValueError):
        return None, None
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I)
    return status, " ".join(m.group(1).split())[:120] if m else None


def confirma(nome: str, dominio: str) -> tuple[str, str | None, str | None]:
    """Devolve (url, título visto, tipo de confirmação)."""
    for url in (f"https://{dominio}/", f"https://www.{dominio}/"):
        status, titulo = le_titulo(url)
        if status is None:
            continue
        if titulo is None:
            return url, None, "responde"
        plano = sem_acento(titulo)
        if "prefeitura" in plano and sem_acento(nome) in plano:
            return url, titulo, "titulo"
        return url, titulo, "responde"
    return f"https://{dominio}/", None, "nenhuma"


def descobre(m: dict) -> dict:
    for dominio in candidatos(m["slug"]):
        if not resolve(dominio):
            continue
        url, titulo, confirmacao = confirma(m["nome"], dominio)
        return {"dominio": dominio, "url": url, "titulo_visto": titulo,
                "confirmacao": confirmacao}
    return {"dominio": None, "url": None, "titulo_visto": None,
            "confirmacao": "nenhuma"}


def carrega_catalogo() -> dict[str, dict]:
    if not CATALOGO.exists():
        return {}
    return {p["slug"]: p
            for p in json.loads(CATALOGO.read_text(encoding="utf8"))["prefeituras"]}


def escolhe_alvos(args, municipios: list[dict]) -> list[dict]:
    if args.da_prospeccao:
        if not PROSPECCAO.exists():
            sys.exit("Falta data/fontes/prospeccao/candidatos.json.\n"
                     "Rode antes: python3 scripts/prospecta_remume.py")
        fila = json.loads(PROSPECCAO.read_text(encoding="utf8"))["municipios"]
        querem = {m["slug"] for m in fila
                  if m["atos_encontrados"] or m["atribuicoes_encontradas"]}
        querem |= {d.name for d in MUNICIPIOS.iterdir() if d.is_dir()}
        return [m for m in municipios if m["slug"] in querem]

    alvos = municipios
    if args.uf:
        ufs = {u.strip().upper() for u in args.uf.split(",")}
        alvos = [m for m in alvos if m["uf"] in ufs]
    alvos = sorted(alvos, key=lambda m: -m["populacao"])
    return alvos[: args.limite] if args.limite else alvos


def main() -> None:
    p = argparse.ArgumentParser(description="Descobre o site de cada prefeitura.")
    p.add_argument("--da-prospeccao", action="store_true",
                   help="só os municípios com ato ou portaria na fila da prospecção")
    p.add_argument("--uf", help="só estas UFs, separadas por vírgula")
    p.add_argument("--limite", type=int, help="só os N mais populosos")
    p.add_argument("--refaz", action="store_true",
                   help="reconsulta também quem já está confirmado pelo título")
    p.add_argument("--paralelo", type=int, default=12)
    args = p.parse_args()

    municipios = json.loads(IBGE.read_text(encoding="utf8"))["municipios"]
    if not POPULACAO.exists():
        sys.exit("Falta a população: rode python3 scripts/baixa_populacao_ibge.py")
    pop = {m["codigo_ibge"]: m["populacao"]
           for m in json.loads(POPULACAO.read_text(encoding="utf8"))["municipios"]}
    for m in municipios:
        m["populacao"] = pop.get(m["codigo_ibge"], 0)

    guardado = carrega_catalogo()
    alvos = escolhe_alvos(args, municipios)
    print(f"{len(alvos)} municípios a consultar")

    def trabalha(m: dict) -> dict:
        antes = guardado.get(m["slug"], {})
        # Nunca se refaz o que uma pessoa escreveu, e não se reconsulta quem já
        # está confirmado: o catálogo tem que ficar mais barato a cada rodada.
        if antes.get("confirmacao") == "manual" or (
            antes.get("confirmacao") == "titulo" and not args.refaz
        ):
            return antes
        achado = descobre(m)
        return {
            "slug": m["slug"], "nome": m["nome"], "uf": m["uf"],
            "populacao": m["populacao"],
            **achado,
            "verificado_em": HOJE,
            # O bloco da REMUME é do humano. Descoberta automática não encosta.
            "remume": antes.get("remume"),
        }

    with ThreadPoolExecutor(args.paralelo) as ex:
        resultado = list(ex.map(trabalha, alvos))

    catalogo = dict(guardado)
    for r in resultado:
        catalogo[r["slug"]] = r
    prefeituras = sorted(catalogo.values(), key=lambda p: -p.get("populacao", 0))

    CATALOGO.parent.mkdir(parents=True, exist_ok=True)
    CATALOGO.write_text(json.dumps({
        "comentario": [
            "Onde fica o site de cada prefeitura, e onde a REMUME dela é publicada.",
            "O domínio é descoberto por scripts/monta_catalogo_prefeituras.py.",
            "O bloco 'remume' é preenchido à mão e nunca é sobrescrito.",
            "confirmacao: 'titulo' o título diz prefeitura e o nome da cidade;",
            "             'responde' o endereço responde mas o título não confirma;",
            "             'manual' alguém conferiu e escreveu;",
            "             'nenhuma' não achamos — precisa de gente.",
        ],
        "prefeituras": prefeituras,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

    por_confirmacao: dict[str, int] = {}
    for r in resultado:
        por_confirmacao[r.get("confirmacao", "nenhuma")] = \
            por_confirmacao.get(r.get("confirmacao", "nenhuma"), 0) + 1
    print("  " + ", ".join(f"{n} {c}" for c, n in sorted(por_confirmacao.items(),
                                                         key=lambda kv: -kv[1])))
    com_remume = sum(1 for r in prefeituras if r.get("remume"))
    print(f"{len(prefeituras)} no catálogo, {com_remume} com a REMUME localizada")
    print(f"gravado em {CATALOGO.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
