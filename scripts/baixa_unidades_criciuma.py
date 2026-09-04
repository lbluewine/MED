"""
Refaz o snapshot das unidades de saúde no Portal da Transparência de Criciúma.

O portal não tem download nem API: os dados estão no HTML das páginas de
listagem, e a coordenada de cada unidade vem dentro do endereço do mapa
embutido. Este script lê tudo e grava um JSON, que é o que o job semanal
compara para saber se algo mudou.

    python3 scripts/baixa_unidades_criciuma.py
"""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "data/fontes/sc-criciuma/transparencia-unidades-2026-09-04.json"

BASE = "https://transparencia.criciuma.sc.gov.br/unidades"
# tipo[0]=3 é o filtro de saúde no portal.
CONSULTA = "?url=unidades&search=&tipo%5B0%5D=3&page="
UA = (
    "tem-no-sus/0.0 (projeto voluntario de informacao publica de saude; "
    "+https://github.com/lbluewine/MED)"
)
MAX_PAGINAS = 40


def baixa(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read().decode("utf8", "replace")


def unidades_da_pagina(pagina: str) -> dict[str, dict]:
    achadas: dict[str, dict] = {}
    for m in re.finditer(
        r'onclick="open_modal(\d+)\(\)"(.*?)(?=onclick="open_modal|\Z)', pagina, re.S
    ):
        uid, bloco = m.group(1), m.group(2)[:3500]

        def campo(padrao: str) -> str | None:
            achado = re.search(padrao, bloco, re.S)
            if not achado:
                return None
            return re.sub(r"\s+", " ", achado.group(1)).strip() or None

        nome = campo(r'class="ttl"[^>]*>(.*?)</div>')
        if not nome:
            continue

        # A coordenada vem do endereço do mapa embutido: !3d é a latitude e
        # !2d é a longitude.
        lat = lng = None
        mapa = re.search(r'src="(https://www\.google\.com/maps/embed\?pb=[^"]+)"', bloco)
        if mapa:
            a = re.search(r"!3d(-?\d+\.\d+)", mapa.group(1))
            o = re.search(r"!2d(-?\d+\.\d+)", mapa.group(1))
            lat = float(a.group(1)) if a else None
            lng = float(o.group(1)) if o else None

        achadas[uid] = {
            "nome": nome,
            "telefone": campo(r"Telefone:\s*(.*?)<"),
            "email": campo(r"E-mail:\s*(.*?)<"),
            "expediente": campo(r"Expediente:\s*(.*?)\s*(?:\||<)"),
            "rua": campo(r'id="rua">(.*?)</span>'),
            "bairro": campo(r'id="bairro">(.*?)</span>'),
            "cep": campo(r'id="cep">(.*?)</span>'),
            "lat": lat,
            "lng": lng,
        }
    return achadas


def main() -> None:
    todas: dict[str, dict] = {}
    for pagina in range(1, MAX_PAGINAS + 1):
        try:
            html = baixa(BASE + CONSULTA + str(pagina))
        except Exception as e:  # a última página responde 404
            if pagina == 1:
                raise SystemExit(f"o portal não respondeu: {e}")
            break
        achadas = unidades_da_pagina(html)
        if not achadas:
            break
        todas.update(achadas)
        time.sleep(1.0)

    if len(todas) < 50:
        raise SystemExit(
            f"só {len(todas)} unidades: o portal mudou de formato. "
            "Falha barulhenta é melhor que snapshot pela metade."
        )

    # Ordem fixa. Sem isso o portal devolve as unidades em ordem diferente a
    # cada leitura, o snapshot muda sozinho e o job semanal abre um pull
    # request dizendo que mudou algo que não mudou.
    ordenadas = {k: todas[k] for k in sorted(todas, key=int)}
    SAIDA.write_text(
        json.dumps(ordenadas, ensure_ascii=False, indent=1, sort_keys=False) + "\n",
        encoding="utf8",
    )
    com_geo = sum(1 for u in todas.values() if u["lat"])
    print(f"{len(todas)} unidades, {com_geo} com coordenada -> {SAIDA.name}")


if __name__ == "__main__":
    main()
