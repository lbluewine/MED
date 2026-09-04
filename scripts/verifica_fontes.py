"""
Confere se as fontes mudaram e atualiza a data de conferência.

Etapa 1 do pipeline de docs/DADOS.md. Este script não decide nada e não
publica nada: ele compara, relata e sai. Quem aprova é gente.

    python3 scripts/verifica_fontes.py              # só confere
    python3 scripts/verifica_fontes.py --atualizar  # e regrava verificado_em

Sai com código 1 se alguma fonte mudou, e 2 se alguma saiu do ar. Falha
silenciosa é pior que erro: uma fonte que sumiu precisa acordar alguém.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FONTES = RAIZ / "data/fontes"
MANIFESTO = FONTES / "fontes.json"
UA = (
    "tem-no-sus/0.0 (projeto voluntario de informacao publica de saude; "
    "+https://github.com/lbluewine/MED)"
)

MUDOU, FORA_DO_AR = 1, 2


def sha256(dados: bytes) -> str:
    return hashlib.sha256(dados).hexdigest()


def hash_guardado(arquivo: Path) -> str | None:
    caminho = arquivo.with_suffix(".sha256")
    if not caminho.exists():
        return None
    return caminho.read_text(encoding="utf8").split()[0]


def baixa(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def roda_extratores(caminhos: list[str]) -> bool:
    """
    Roda em ordem. Uma fonte pode precisar de dois passos: primeiro alguém
    baixa e refaz o snapshot, depois alguém traduz o snapshot para o schema.
    """
    for caminho in caminhos:
        print(f"      rodando {caminho}")
        r = subprocess.run(
            [sys.executable, str(RAIZ / caminho)], capture_output=True, text=True
        )
        if r.returncode != 0:
            print(f"      falhou:\n{r.stdout[-1500:]}{r.stderr[-1500:]}")
            return False
    return True


def confere(fonte: dict) -> str:
    """Devolve 'igual', 'mudou', 'fora_do_ar' ou 'sem_verificacao'."""
    nome = f'{fonte["id"]} ({fonte["descricao"]})'
    arquivo = FONTES / fonte["arquivo"]

    if fonte["tipo"] == "sem_verificacao":
        print(f"  --  {nome}: sem URL estável, só um humano atualiza")
        return "sem_verificacao"

    if fonte["tipo"] == "arquivo":
        try:
            baixado = baixa(fonte["url"])
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
            print(f"  !!  {nome}: a fonte não respondeu — {e}")
            return "fora_do_ar"
        if not baixado:
            print(f"  !!  {nome}: a fonte devolveu um arquivo vazio")
            return "fora_do_ar"
        atual, antigo = sha256(baixado), hash_guardado(arquivo)
        if antigo is None:
            print(f"  !!  {nome}: não há hash guardado para comparar")
            return "fora_do_ar"
        if atual == antigo:
            print(f"  ok  {nome}: não mudou")
            return "igual"
        print(f"  **  {nome}: MUDOU")
        print(f"      antes {antigo[:16]}…  agora {atual[:16]}…")
        arquivo.write_bytes(baixado)
        arquivo.with_suffix(".sha256").write_text(
            f"{atual}  {arquivo.name}\n", encoding="utf8"
        )
        if fonte["extratores"] and not roda_extratores(fonte["extratores"]):
            return "fora_do_ar"
        return "mudou"

    # tipo "extraida": a página muda de marcação sem o conteúdo mudar, então o
    # que vale comparar é o snapshot que o extrator produz.
    antes = arquivo.read_bytes() if arquivo.exists() else b""
    if not roda_extratores(fonte["extratores"]):
        print(f"  !!  {nome}: o extrator não completou")
        return "fora_do_ar"
    depois = arquivo.read_bytes() if arquivo.exists() else b""
    if not depois:
        print(f"  !!  {nome}: o extrator não gerou o snapshot")
        return "fora_do_ar"
    if sha256(antes) == sha256(depois):
        print(f"  ok  {nome}: não mudou")
        return "igual"
    print(f"  **  {nome}: MUDOU")
    arquivo.with_suffix(".sha256").write_text(
        f"{sha256(depois)}  {arquivo.name}\n", encoding="utf8"
    )
    return "mudou"


def atualiza_verificado_em(hoje: str) -> int:
    """
    Regrava `verificado_em` em todo o data/.

    Isso acontece mesmo quando nada muda, e é justamente o ponto: "conferido
    hoje" quer dizer que hoje aquela ainda é a lista válida. Nenhum outro campo
    é tocado.
    """
    tocados = 0
    for caminho in sorted((RAIZ / "data").rglob("*.json")):
        if FONTES in caminho.parents:
            continue
        texto = caminho.read_text(encoding="utf8")
        novo = re.sub(r'("verificado_em":\s*")\d{4}-\d{2}-\d{2}(")', rf"\g<1>{hoje}\g<2>", texto)
        if novo != texto:
            caminho.write_text(novo, encoding="utf8")
            tocados += 1
    return tocados


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--atualizar", action="store_true",
                   help="regrava verificado_em quando tudo respondeu")
    args = p.parse_args()

    manifesto = json.loads(MANIFESTO.read_text(encoding="utf8"))
    print(f"Conferindo {len(manifesto['fontes'])} fontes\n")

    resultados = {f["id"]: confere(f) for f in manifesto["fontes"]}

    mudaram = [i for i, r in resultados.items() if r == "mudou"]
    quebradas = [i for i, r in resultados.items() if r == "fora_do_ar"]
    hoje = date.today().isoformat()

    print()
    if quebradas:
        print(f"{len(quebradas)} fonte(s) fora do ar ou sem hash: {', '.join(quebradas)}")
        print("Isso precisa de gente. Não mexemos em verificado_em.")
        sys.exit(FORA_DO_AR)

    if args.atualizar:
        n = atualiza_verificado_em(hoje)
        print(f"verificado_em atualizado para {hoje} em {n} arquivo(s)")

    if mudaram:
        print(f"{len(mudaram)} fonte(s) mudaram: {', '.join(mudaram)}")
        print("Revise o diff item a item antes de publicar.")
        sys.exit(MUDOU)

    print("Nenhuma fonte mudou.")


if __name__ == "__main__":
    main()
