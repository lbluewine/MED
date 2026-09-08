"""
Baixa do CNES os estabelecimentos de saúde de um município.

    python3 scripts/baixa_cnes.py sc-criciuma
    python3 scripts/baixa_cnes.py --do-site      # os municípios já publicados

Fonte: API de dados abertos do Ministério da Saúde, que serve o Cadastro
Nacional de Estabelecimentos de Saúde por município, no Brasil inteiro, com o
mesmo formato em todo lugar. É por isso que endereço de posto de saúde **não**
precisa de um catálogo de sites de prefeitura: precisa de uma fonte só.

Guarda em data/fontes/<municipio>/cnes-estabelecimentos.json **só quem atende
pelo SUS**. Em Criciúma são 201 de 1.247: o resto é consultório e laboratório
particular, que o site nunca mostra — mandar alguém a uma clínica privada seria
pior que não mostrar nada. Guardar o que não se publica encheria o repositório
com 6x mais bytes sem servir de auditoria para afirmação nenhuma do site. O
total que veio do cadastro fica registrado no cabeçalho do arquivo.
Quem traduz para o schema do site é scripts/extrai_unidades_cnes.py.

O nome do arquivo não leva data, ao contrário das outras fontes. O CNES muda
todo mês e vale para 5.570 municípios: nome datado viraria um arquivo novo por
mês por cidade, e a data que importa já vem dentro, em `data_atualizacao` de
cada estabelecimento.
"""
import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
IBGE = RAIZ / "data/nacional/municipios-ibge.json"
FONTES = RAIZ / "data/fontes"
MUNICIPIOS = RAIZ / "data/municipios"

API = "https://apidadosabertos.saude.gov.br/cnes"
UA = (
    "tem-no-sus/0.0 (projeto voluntario de informacao publica de saude; "
    "+https://github.com/lbluewine/MED)"
)
# A API devolve no máximo 20 por página, mesmo pedindo mais.
PAGINA = 20
HOJE = date.today().isoformat()


def pede(caminho: str, parametros: str, tentativas: int = 5) -> dict:
    url = f"{API}{caminho}?{parametros}"
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
            print(f"    API não respondeu ({e}); nova tentativa em {espera:.0f}s", flush=True)
            time.sleep(espera)
            espera = min(espera * 2, 60)
    raise AssertionError("inalcançável")


def baixa_municipio(codigo_ibge: int) -> list[dict]:
    """
    O CNES é indexado pelo código de município **sem o dígito verificador**:
    4204608 (IBGE) vira 420460 na API.
    """
    codigo = str(codigo_ibge)[:6]
    estabelecimentos, salto = {}, 0
    while True:
        lote = pede("/estabelecimentos",
                    f"codigo_municipio={codigo}&limit={PAGINA}&offset={salto}")
        itens = lote.get("estabelecimentos", [])
        antes = len(estabelecimentos)
        for e in itens:
            estabelecimentos[e["codigo_cnes"]] = e
        print(f"    {len(estabelecimentos)} estabelecimentos", end="\r", flush=True)
        if len(itens) < PAGINA:
            break
        # Rede de proteção: um endpoint que ignora `offset` devolve sempre a
        # mesma página, e o laço nunca termina. Foi o que /tipounidades fez.
        if len(estabelecimentos) == antes:
            print(f"\n    a API repetiu a página em offset={salto}; parando aqui")
            break
        salto += PAGINA
    print()
    # Ordem estável pelo código: sem isso o SHA-256 muda sem o dado mudar, e a
    # verificação semanal passaria a gritar toda semana por nada.
    return [estabelecimentos[c] for c in sorted(estabelecimentos)]


def tabela_de_tipos() -> dict[str, str]:
    """
    Este endpoint **não pagina**: ignora `limit` e `offset` e devolve os 39
    tipos de uma vez. Paginar aqui rodava para sempre relendo a mesma página.
    """
    lote = pede("/tipounidades", "")
    return dict(sorted(
        ((str(t["codigo_tipo_unidade"]), t["descricao_tipo_unidade"])
         for t in lote.get("tipos_unidade", [])),
        key=lambda kv: int(kv[0]),
    ))


def cadastro() -> dict[str, dict]:
    return {m["slug"]: m
            for m in json.loads(IBGE.read_text(encoding="utf8"))["municipios"]}


def grava(caminho: Path, dados: dict) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    texto = json.dumps(dados, ensure_ascii=False, indent=2) + "\n"
    caminho.write_text(texto, encoding="utf8")
    digest = hashlib.sha256(texto.encode("utf8")).hexdigest()
    caminho.with_suffix(".sha256").write_text(
        f"{digest}  {caminho.name}\n", encoding="utf8")


def main() -> None:
    p = argparse.ArgumentParser(description="Baixa os estabelecimentos do CNES.")
    p.add_argument("municipios", nargs="*",
                   help="slugs, como sc-criciuma. Vazio com --do-site pega os publicados")
    p.add_argument("--do-site", action="store_true",
                   help="todos os municípios que já têm pasta em data/municipios/")
    p.add_argument("--tipos", action="store_true",
                   help="também rebaixa a tabela de tipos de unidade do CNES")
    args = p.parse_args()

    conhecidos = cadastro()
    alvos = list(args.municipios)
    if args.do_site:
        alvos += [d.name for d in sorted(MUNICIPIOS.iterdir()) if d.is_dir()]
    alvos = sorted(set(alvos))
    if not alvos:
        sys.exit("Diga qual município, ou use --do-site.")

    desconhecidos = [a for a in alvos if a not in conhecidos]
    if desconhecidos:
        sys.exit(f"Slug fora do cadastro do IBGE: {', '.join(desconhecidos)}")

    if args.tipos:
        print("Tabela de tipos de unidade")
        grava(FONTES / "nacional/cnes-tipos-unidade.json", {
            "comentario": ["Tabela oficial de tipos de estabelecimento do CNES.",
                           "Usada por scripts/extrai_unidades_cnes.py."],
            "tipos": tabela_de_tipos(),
            "proveniencia": [{
                "fonte_nome": "CNES — tipos de unidade",
                "fonte_url": f"{API}/tipounidades",
                "fonte_arquivo": "fontes/nacional/cnes-tipos-unidade.json",
                "fonte_data": HOJE,
                "extraido_em": HOJE,
                "verificado_em": HOJE,
                "metodo": "automatica",
            }],
        })

    for slug in alvos:
        m = conhecidos[slug]
        print(f'{m["nome"]}/{m["uf"]}')
        todos = baixa_municipio(m["codigo_ibge"])
        estabelecimentos = [
            e for e in todos
            if e.get("estabelecimento_faz_atendimento_ambulatorial_sus") == "SIM"]
        grava(FONTES / slug / "cnes-estabelecimentos.json", {
            "municipio_id": slug,
            "codigo_ibge": m["codigo_ibge"],
            "criterio": "só estabelecimentos com atendimento ambulatorial pelo SUS",
            "total_no_cnes": len(todos),
            "estabelecimentos": estabelecimentos,
            "proveniencia": [{
                "fonte_nome": f'CNES — estabelecimentos de {m["nome"]}/{m["uf"]}',
                "fonte_url": f'{API}/estabelecimentos?codigo_municipio={str(m["codigo_ibge"])[:6]}',
                "fonte_arquivo": f"fontes/{slug}/cnes-estabelecimentos.json",
                "fonte_data": HOJE,
                "extraido_em": HOJE,
                "verificado_em": HOJE,
                "metodo": "automatica",
            }],
        })
        print(f"    {len(todos)} no cadastro, {len(estabelecimentos)} atendem pelo SUS")


if __name__ == "__main__":
    main()
