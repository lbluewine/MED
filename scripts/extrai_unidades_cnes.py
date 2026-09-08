"""
Traduz o retorno cru do CNES para data/municipios/<id>/unidades-cnes.json.

    python3 scripts/extrai_unidades_cnes.py sc-criciuma
    python3 scripts/extrai_unidades_cnes.py --do-site

Roda depois de scripts/baixa_cnes.py. Aqui nada é inventado: o que não se
reconhece com certeza vira nulo e o texto original fica no registro.

Este arquivo **não substitui** unidades.json. São perguntas diferentes:

    unidades.json        onde retirar este medicamento — é da prefeitura
    unidades-cnes.json   que unidades de saúde existem aqui — é do cadastro federal

O CNES não sabe o que cada unidade entrega. Deixar os dois no mesmo lugar faria
o site dizer que uma UBS entrega um remédio porque ela existe.
"""
import argparse
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
IBGE = RAIZ / "data/nacional/municipios-ibge.json"
FONTES = RAIZ / "data/fontes"
MUNICIPIOS = RAIZ / "data/municipios"
HOJE = date.today().isoformat()

# A categoria sai da descrição oficial do tipo, não de uma tabela de códigos
# decorada: o CNES tem 80 e poucos tipos e acrescenta novos. A ordem importa —
# "CENTRO DE ATENCAO PSICOSSOCIAL" tem que casar com CAPS antes de cair em
# "CENTRO DE ATENCAO", que é especializado.
CATEGORIAS = [
    ("caps", r"PSICOSSOCIAL"),
    ("farmacia", r"FARMACIA"),
    ("ubs", r"CENTRO DE SAUDE|UNIDADE BASICA|POSTO DE SAUDE|SAUDE DA FAMILIA|"
            r"SAUDE INDIGENA|ACADEMIA DA SAUDE"),
    ("pronto_atendimento", r"PRONTO ATENDIMENTO|PRONTO SOCORRO|URGENCIA"),
    ("hospital", r"HOSPITAL|UNIDADE MISTA"),
    ("apoio_diagnostico", r"LABORATORIO|DIAGNOSE|SADT|OFICINA ORTOPEDICA"),
    ("gestao", r"SECRETARIA|VIGILANCIA|CENTRAL DE|REGULACAO|PREVENCAO DE DOENCAS|"
               r"TELESSAUDE|COOPERATIVA"),
    ("especializado", r"CLINICA|POLICLINICA|ESPECIALIDADE|ESPECIALIZAD|AMBULATOR|"
                      r"CENTRO DE ATENCAO|IMUNIZACAO|PARTO NORMAL|HEMOTERAPIA|"
                      r"ATENCAO DOMICILIAR|REGIME RESIDENCIAL|APOIO A SAUDE"),
    ("outro", r"CONSULTORIO|UNIDADE MOVEL"),
]


def sem_acento(texto: str) -> str:
    plano = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in plano if not unicodedata.combining(c)).upper()


def categoriza(descricao: str) -> str:
    plano = sem_acento(descricao)
    for categoria, padrao in CATEGORIAS:
        if re.search(padrao, plano):
            return categoria
    return "outro"


def telefone(bruto: str | None) -> tuple[list[str], str | None]:
    """
    Devolve (telefones no formato do site, o que sobrou sem entender).

    O cadastro traz "4834458450", "48-34447153" e "(48)34458487" para a mesma
    coisa. Onde a leitura não é segura, o número vai para observações escrito
    como veio: telefone errado faz a pessoa ligar para a casa de um estranho.
    """
    if not bruto:
        return [], None
    digitos = re.sub(r"\D", "", bruto)
    if len(digitos) == 11:
        return [f"({digitos[:2]}) {digitos[2:7]}-{digitos[7:]}"], None
    if len(digitos) == 10:
        return [f"({digitos[:2]}) {digitos[2:6]}-{digitos[6:]}"], None
    if len(digitos) == 9:
        return [f"{digitos[:5]}-{digitos[5:]}"], None
    if len(digitos) == 8:
        return [f"{digitos[:4]}-{digitos[4:]}"], None
    return [], f"O cadastro informa o telefone como “{bruto.strip()}”."


def cep(bruto: str | None) -> str | None:
    if not bruto:
        return None
    digitos = re.sub(r"\D", "", str(bruto))
    return f"{digitos[:5]}-{digitos[5:]}" if len(digitos) == 8 else None


def texto(valor) -> str | None:
    if valor is None:
        return None
    limpo = " ".join(str(valor).split())
    return limpo or None


def coordenada(e: dict) -> dict | None:
    lat = e.get("latitude_estabelecimento_decimo_grau")
    lng = e.get("longitude_estabelecimento_decimo_grau")
    if lat is None or lng is None:
        return None
    # Fora do Brasil é erro de cadastro, e pino errado manda alguém para o
    # lugar errado. Sem coordenada a unidade continua na lista, só sai do mapa.
    if not (-34 <= lat <= 6) or not (-74 <= lng <= -33):
        return None
    return {"lat": lat, "lng": lng,
            "fonte": "CNES — declarado pelo estabelecimento",
            "obtido_em": HOJE}


def converte(e: dict, tipos: dict[str, str]) -> dict:
    codigo_tipo = e.get("codigo_tipo_unidade")
    descricao = tipos.get(str(codigo_tipo)) or f"TIPO {codigo_tipo} NÃO CATALOGADO"
    nome = texto(e.get("nome_fantasia")) or texto(e.get("nome_razao_social")) or "Sem nome no cadastro"
    telefones, sobra = telefone(e.get("numero_telefone_estabelecimento"))
    return {
        "cnes": str(e["codigo_cnes"]),
        "nome": nome,
        "categoria": categoriza(descricao),
        "tipo_cnes": descricao,
        "codigo_tipo_cnes": codigo_tipo if isinstance(codigo_tipo, int) else 0,
        "atende_sus": e.get("estabelecimento_faz_atendimento_ambulatorial_sus") == "SIM",
        "endereco": {
            "logradouro": texto(e.get("endereco_estabelecimento")),
            "numero": texto(e.get("numero_estabelecimento")),
            "bairro": texto(e.get("bairro_estabelecimento")),
            "cep": cep(e.get("codigo_cep_estabelecimento")),
        },
        "telefones": telefones,
        "turno": texto(e.get("descricao_turno_atendimento")),
        "geo": coordenada(e),
        "atualizado_no_cnes_em": texto(e.get("data_atualizacao")),
        "observacoes": sobra,
    }


def extrai(slug: str, tipos: dict[str, str]) -> dict:
    origem = FONTES / slug / "cnes-estabelecimentos.json"
    if not origem.exists():
        sys.exit(f"Falta {origem.relative_to(RAIZ)}.\n"
                 f"Rode antes: python3 scripts/baixa_cnes.py {slug}")
    bruto = json.loads(origem.read_text(encoding="utf8"))
    unidades = [converte(e, tipos) for e in bruto["estabelecimentos"]]
    unidades.sort(key=lambda u: (u["categoria"], u["nome"]))

    proveniencia = list(bruto["proveniencia"])
    for p in proveniencia:
        p["extraido_em"] = HOJE
        p["verificado_em"] = HOJE
    return {"municipio_id": slug, "unidades": unidades, "proveniencia": proveniencia}


def main() -> None:
    p = argparse.ArgumentParser(description="Traduz o CNES para o schema do site.")
    p.add_argument("municipios", nargs="*")
    p.add_argument("--do-site", action="store_true",
                   help="todos os municípios que já têm pasta em data/municipios/")
    args = p.parse_args()

    caminho_tipos = FONTES / "nacional/cnes-tipos-unidade.json"
    if not caminho_tipos.exists():
        sys.exit("Falta data/fontes/nacional/cnes-tipos-unidade.json.\n"
                 "Rode antes: python3 scripts/baixa_cnes.py --tipos <municipio>")
    tipos = json.loads(caminho_tipos.read_text(encoding="utf8"))["tipos"]

    alvos = list(args.municipios)
    if args.do_site:
        alvos += [d.name for d in sorted(MUNICIPIOS.iterdir()) if d.is_dir()]
    alvos = sorted(set(alvos))
    if not alvos:
        sys.exit("Diga qual município, ou use --do-site.")

    for slug in alvos:
        dados = extrai(slug, tipos)
        destino = MUNICIPIOS / slug / "unidades-cnes.json"
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(json.dumps(dados, ensure_ascii=False, indent=2) + "\n",
                           encoding="utf8")

        sus = [u for u in dados["unidades"] if u["atende_sus"]]
        por_categoria: dict[str, int] = {}
        for u in sus:
            por_categoria[u["categoria"]] = por_categoria.get(u["categoria"], 0) + 1
        resumo = ", ".join(f"{n} {c}" for c, n in sorted(por_categoria.items(),
                                                         key=lambda kv: -kv[1]))
        print(f'{slug}: {len(dados["unidades"])} estabelecimentos, '
              f"{len(sus)} atendem pelo SUS")
        print(f"   {resumo}")
        sem_geo = sum(1 for u in sus if u["geo"] is None)
        sem_tel = sum(1 for u in sus if not u["telefones"])
        if sem_geo or sem_tel:
            print(f"   {sem_geo} sem coordenada, {sem_tel} sem telefone legível")


if __name__ == "__main__":
    main()
