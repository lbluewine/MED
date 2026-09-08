"""
Guarda a população de cada município (Censo 2022 do IBGE).

    python3 scripts/baixa_populacao_ibge.py

Não é dado de saúde e não vai à tela. Serve para ordenar a fila de trabalho:
qual município importar primeiro. Ver scripts/prospecta_remume.py.

O Censo só muda de dez em dez anos, então esta fonte não entra no job semanal
de data/fontes/fontes.json — seria conferir todo domingo algo que muda uma vez
por década.
"""
import gzip
import hashlib
import json
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "data/fontes/nacional/populacao-censo-2022.json"

# Agregado 4709 = Censo 2022, variável 93 = população residente, N6 = município.
URL = (
    "https://servicodados.ibge.gov.br/api/v3/agregados/4709"
    "/periodos/2022/variaveis/93?localidades=N6[all]"
)
UA = (
    "tem-no-sus/0.0 (projeto voluntario de informacao publica de saude; "
    "+https://github.com/lbluewine/MED)"
)
HOJE = date.today().isoformat()


def baixa(url: str) -> bytes:
    """O IBGE responde comprimido mesmo sem o cabeçalho pedir."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        dados = r.read()
    if dados[:2] == b"\x1f\x8b":
        dados = gzip.decompress(dados)
    return dados


def main() -> None:
    bruto = json.loads(baixa(URL))
    series = bruto[0]["resultados"][0]["series"]

    municipios = []
    for s in series:
        valor = s["serie"].get("2022")
        # O IBGE devolve "-" quando não há valor apurado. Sem número, sem linha.
        if valor in (None, "-", "..", "...", "X"):
            continue
        municipios.append({
            "codigo_ibge": int(s["localidade"]["id"]),
            "nome": s["localidade"]["nome"],
            "populacao": int(valor),
        })
    municipios.sort(key=lambda m: m["codigo_ibge"])

    saida = {
        "comentario": [
            "População residente por município, Censo 2022 do IBGE.",
            "Não é dado de saúde: só ordena a fila de importação de REMUMEs.",
        ],
        "municipios": municipios,
        "proveniencia": [{
            "fonte_nome": "Censo Demográfico 2022 — população residente (tabela 4709)",
            "fonte_url": URL,
            "fonte_arquivo": "fontes/nacional/populacao-censo-2022.json",
            "fonte_data": "2022-07-31",
            "extraido_em": HOJE,
            "verificado_em": HOJE,
            "metodo": "automatica",
        }],
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    texto = json.dumps(saida, ensure_ascii=False, indent=2) + "\n"
    SAIDA.write_text(texto, encoding="utf8")
    digest = hashlib.sha256(texto.encode("utf8")).hexdigest()
    SAIDA.with_suffix(".sha256").write_text(f"{digest}  {SAIDA.name}\n", encoding="utf8")

    total = sum(m["populacao"] for m in municipios)
    print(f"{len(municipios)} municípios, {total:,} habitantes".replace(",", "."))
    print(f"gravado em {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
