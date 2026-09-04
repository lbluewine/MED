"""
Gera data/municipios/sc-criciuma/unidades.json a partir das duas fontes.

Portal da transparência: onde a unidade fica, telefone, e-mail e expediente.
REMUME 11/2024: o que a unidade entrega e a quem atende.

Quando as duas discordam, as duas ficam registradas e a divergência vai para
a tela. Rodar de novo:

    python3 scripts/extrai_unidades_criciuma.py
"""
import json
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SNAPSHOT = RAIZ / "data/fontes/sc-criciuma/transparencia-unidades-2026-09-04.json"
SAIDA = RAIZ / "data/municipios/sc-criciuma/unidades.json"

HOJE = "2026-09-04"

FONTE_PORTAL = {
    "fonte_nome": "Portal da Transparência de Criciúma, endereços e telefones das unidades de saúde",
    "fonte_url": "https://transparencia.criciuma.sc.gov.br/unidades?url=unidades&search=&tipo%5B0%5D=3",
    "fonte_arquivo": "fontes/sc-criciuma/transparencia-unidades-2026-09-04.json",
    "fonte_data": "2026-09-04",
    "extraido_em": HOJE,
    "verificado_em": HOJE,
    "metodo": "ia-assistida",
}

FONTE_REMUME = {
    "fonte_nome": "REMUME Criciúma versão 11/2024, seção 8 (Locais de acesso aos medicamentos)",
    "fonte_url": "https://cigtes.criciuma.sc.gov.br/redes-de-atencao-saude/material-apoio/20",
    "fonte_arquivo": "fontes/sc-criciuma/remume-2024-11.pdf",
    "fonte_data": "2024-11-01",
    "extraido_em": "2026-09-03",
    "verificado_em": HOJE,
    "metodo": "ia-assistida",
}


def slug(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", t)).strip("-")


def horarios(expediente: str) -> list[dict]:
    """
    "08:00 - 12:00 -- 13:00 - 17:00" vira dois turnos.

    A fonte não diz em quais dias, então `dias` fica nulo. A tela precisa
    admitir que não sabe, em vez de chutar "seg-sex".
    """
    turnos = []
    for par in re.findall(r"(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})", expediente or ""):
        if par[0] < par[1]:
            turnos.append({"dias": None, "abre": par[0], "fecha": par[1]})
    return turnos


def telefones(bruto: str | None) -> list[str]:
    """Só normaliza o espaço depois do DDD. Nenhum dígito é alterado."""
    achados = re.findall(r"\(\d{2}\)\s*\d{4,5}-\d{4}|\b\d{4,5}-\d{4}\b", bruto or "")
    return [re.sub(r"\)\s*", ") ", t) for t in achados]


# O portal publica, para estas unidades, um mapa embutido que aponta para um
# lugar diferente do que a própria página descreve — no caso da Farmácia
# Distrital Centro, o link do mapa busca "Unidade Básica de Saúde - Central",
# um nome que não é o da unidade, e com um raio de zoom de 56 km, sinal de
# copiar e colar errado na hora de editar a página. O endereço em texto (Rua
# João Pessoa, 187) é a Farmácia da UBS Centro de verdade; o pino, não.
#
# Confirmado em 2026-09-04, comparando o texto do endereço com o link do
# mapa na mesma página. Um pino errado manda alguém para o lugar errado, o
# que é pior que não ter pino nenhum.
PINO_NAO_CONFIAVEL = {"Farmácia Distrital Centro"}


def endereco(u: dict, geo_conferida: bool) -> dict:
    if u["nome"] in PINO_NAO_CONFIAVEL:
        geo_conferida = False
    cep = u.get("cep") or ""
    return {
        "logradouro": re.sub(r",?\s*\bSN\b", ", sem número", u["rua"]).strip(),
        "bairro": u.get("bairro") or None,
        "cep": cep if re.fullmatch(r"\d{5}-\d{3}", cep) else None,
        "geo": (
            {
                "lat": u["lat"],
                "lng": u["lng"],
                "conferido_por": "Portal da Transparência de Criciúma",
                "conferido_em": HOJE,
            }
            if geo_conferida and u.get("lat") and u.get("lng")
            else None
        ),
    }


ENTREGA_DISTRITAL = (
    "Medicamentos do componente básico, incluindo os controlados. É a farmácia de "
    "referência do distrito."
)
ENTREGA_DISPENSARIO = (
    "Parte dos medicamentos do componente básico. Procure a unidade onde você faz "
    "acompanhamento."
)

# Unidades do portal que entram no site, com o que a REMUME diz que elas
# entregam. O que não está aqui não é ponto de retirada de medicamento.
FARMACIAS = {
    "Farmácia Distrital Centro": dict(
        tipo="farmacia_distrital", dispensa=["basico"], entrega=ENTREGA_DISTRITAL,
        divergencias=[
            "A REMUME de 2024 informa outro telefone: (48) 3430-0959. "
            "Se ninguém atender no número acima, tente esse.",
            "A REMUME de 2024 informa o CEP 88801-530 para este mesmo endereço, "
            "e o portal da prefeitura informa 88810-020. A rua e o número são os mesmos.",
            "A REMUME informa que esta farmácia abre das 7h às 19h.",
            "O mapa do portal da prefeitura, para este endereço, aponta para um "
            "lugar chamado de outro jeito. Por isso ela não tem pino no mapa "
            "deste site, mesmo o endereço e o telefone estando corretos.",
        ]),
    "Farmácia Distrital Santa Luzia": dict(
        tipo="farmacia_distrital", dispensa=["basico"], entrega=ENTREGA_DISTRITAL,
        divergencias=["A REMUME informa que esta farmácia abre das 8h às 18h."]),
    "Farmácia Distrital Próspera": dict(
        tipo="farmacia_distrital", dispensa=["basico"], entrega=ENTREGA_DISTRITAL,
        divergencias=[
            "A REMUME informa que fica nos fundos da Praça da Chaminé, na esquina "
            "com a Travessa do Mineiro, e que abre das 7h às 19h.",
        ]),
    "Farmácia Distrital Quarta Linha": dict(
        tipo="farmacia_distrital", dispensa=["basico"], entrega=ENTREGA_DISTRITAL,
        divergencias=[
            "A REMUME de 2024 informa o endereço como Rodovia Monsueto Luiz Rosso, "
            "sem número, e o portal da prefeitura informa Rua Monsueto Luiz Rosso, 65.",
        ],
        # O portal cadastra o mesmo prédio duas vezes: uma como "Unidade
        # Básica de Saúde Quarta Linha / HG" (o posto de saúde, aberto das 7h
        # às 19h) e outra como "Farmácia Distrital Quarta Linha" (a farmácia
        # dentro do posto, aberta das 8h às 17h). Mesmo endereço, mesmo CEP e
        # mesmo telefone — é uma porta só. Confirmado por quem conhece o
        # bairro em 2026-09-04.
        observacoes=(
            "Fica dentro da Unidade Básica de Saúde (posto de saúde) do "
            "bairro, que abre das 7h às 19h. A farmácia, dentro do posto, "
            "abre das 8h às 17h."
        )),
    "Farmácia Distrital Boa Vista": dict(
        tipo="farmacia_distrital", dispensa=["basico"], entrega=ENTREGA_DISTRITAL,
        divergencias=[
            "A REMUME de 2024 traz um CEP inválido para este endereço. O CEP "
            "mostrado aqui é o do portal da prefeitura.",
            "A REMUME informa que fica na esquina com a Rua São Francisco do Sul, "
            "e que abre das 7h às 19h.",
        ]),
    "Farmácia Central": dict(
        tipo="farmacia_distrital", dispensa=["basico"], entrega=ENTREGA_DISTRITAL,
        divergencias=["Esta farmácia não aparece na REMUME de 2024. Ligue antes de ir."]),
    "Farmácia Escola": dict(
        tipo="farmacia_ceaf", dispensa=["especializado"],
        entrega="Os medicamentos de alto custo, que quem entrega é o governo do estado (CEAF).",
        divergencias=[
            "A REMUME de 2024 informa outro telefone: (48) 3431-2789. "
            "Se ninguém atender no número acima, tente esse.",
            "A REMUME informa esta farmácia como Clínicas Integradas da UNESC, "
            "com atendimento das 8h às 17h.",
        ]),
    "Complexo de Saúde Santo Agostinho": dict(
        tipo="farmacia_alimentar", dispensa=[],
        entrega="Fórmulas infantis, dietas para sonda, complementos alimentares e o que foi pedido na justiça.",
        divergencias=[
            "A REMUME de 2024 informa outro telefone: (48) 3437-7893. "
            "Se ninguém atender no número acima, tente esse.",
            "A REMUME informa atendimento das 8h às 17h.",
        ]),
    "CAPS II - Centro de Atenção Psicossocial II": dict(
        tipo="farmacia_caps", dispensa=["basico"],
        entrega="Medicamentos para quem faz tratamento no próprio CAPS II.",
        restricao="Atende só quem é acompanhado no CAPS II. Se você não faz tratamento lá, procure a farmácia distrital do seu bairro.",
        divergencias=[]),
    "CAPS II AD - Centro de Atenção Psicossocial II Álcool e Outras Drogas": dict(
        tipo="farmacia_caps", dispensa=["basico"],
        entrega="Medicamentos para quem faz tratamento no próprio CAPS II AD.",
        restricao="Atende só quem é acompanhado no CAPS II AD. Se você não faz tratamento lá, procure a farmácia distrital do seu bairro.",
        divergencias=[
            "A REMUME de 2024 informa outro endereço: Rua João Batista Rita, "
            "sem número, no bairro Santa Luzia. Ligue antes de ir.",
        ]),
    "CAPS III - Centro de Atenção Psicossocial III": dict(
        tipo="farmacia_caps", dispensa=["basico"],
        entrega="Medicamentos para quem faz tratamento no próprio CAPS III.",
        restricao="Atende só quem é acompanhado no CAPS III. Se você não faz tratamento lá, procure a farmácia distrital do seu bairro.",
        divergencias=[
            "A REMUME de 2024 informa outro endereço: Rua Santo Antônio, 1080, "
            "no bairro Cruzeiro do Sul. Ligue antes de ir.",
        ]),
}

# Unidades que o portal cadastra separado, mas que são o mesmo prédio que uma
# entrada de FARMACIAS. O nome cita quem confirmou, para quem for auditar
# depois saber que não foi suposição.
COBERTAS_POR_OUTRA_ENTRADA = {
    # Mesmo endereço, CEP e telefone que "Farmácia Distrital Quarta Linha".
    # Confirmado por quem conhece o bairro em 2026-09-04.
    "Unidade Básica de Saúde Quarta Linha / HG",
}

# A REMUME chama de "Farmácia Estratégica"; o portal cadastra o mesmo endereço
# e o mesmo telefone como PAMDHA. É a mesma porta, com dois nomes.
FARMACIAS["PAMDHA - Programa de Atenção Municipal as Dst Hiv Aids"] = dict(
    tipo="farmacia_estrategica", dispensa=["estrategico"],
    nome_publico="Farmácia Estratégica",
    entrega=(
        "Medicamentos dos programas de HIV e aids, hepatites, tuberculose, "
        "hanseníase, sífilis, toxoplasmose, influenza e tabagismo."
    ),
    divergencias=[
        "A REMUME chama esta unidade de Farmácia Estratégica e informa que fica "
        "no Centro de Vigilância em Saúde, com atendimento das 7h às 16h. "
        "O endereço e o telefone são os mesmos que o portal da prefeitura "
        "cadastra como PAMDHA.",
    ])

# Farmácias que a REMUME lista e o portal da prefeitura não cadastra.
# Ficam no site, com a divergência à mostra e sem pino no mapa.
SO_NA_REMUME = [
    dict(id="criciuma-farmacia-wosocris-rio-maina", nome="Farmácia da Wosocris / Rio Maina",
         logradouro="Rua Virgílio Mondardo, sem número", bairro="Catarinense",
         cep="88818-338", telefones=["(48) 3403-7000"], abre="07:00", fecha="19:00"),
    dict(id="criciuma-farmacia-ubs-santa-barbara", nome="Farmácia da UBS Santa Bárbara",
         logradouro="Rua Sampaio Viana", bairro="Santa Bárbara",
         cep="88804-270", telefones=["(48) 3445-8405"], abre="07:00", fecha="19:00"),
    dict(id="criciuma-farmacia-ubs-sao-sebastiao", nome="Farmácia da UBS São Sebastião",
         logradouro="Rua José Machado de Souza, sem número", bairro="São Sebastião",
         cep="88807-150", telefones=["(48) 3445-8470"], abre="07:00", fecha="19:00"),
    dict(id="criciuma-farmacia-ubs-mina-do-mato", nome="Farmácia da UBS Mina do Mato",
         logradouro="Rua Antônio Teodoro Máximo, sem número", bairro="Mina do Mato",
         cep="88810-530", telefones=["(48) 3403-6011"], abre="07:00", fecha="19:00"),
]

PAMGC = dict(
    id="criciuma-pamgc", nome="Programa de medida de glicemia (PAMGC)",
    tipo="programa_insumos", dispensa=[],
    entrega="Insulina NPH e Regular, fitas e aparelho de medir açúcar no sangue.",
    restricao=(
        "Entrega as fitas e o aparelho só para quem usa insulina ou está grávida. "
        "É preciso fazer cadastro antes."
    ),
    observacoes=(
        "Leve uma caixa de isopor pequena para trazer a insulina. A REMUME informa "
        "só Clínicas Integradas da UNESC, sem rua e sem número."
    ),
    logradouro="Clínicas Integradas da UNESC", telefones=["3431-4538"],
)


def main() -> None:
    portal = json.loads(SNAPSHOT.read_text(encoding="utf8"))
    unidades: list[dict] = []
    vistos: set[str] = set()

    for u in portal.values():
        nome = u["nome"]

        if nome in FARMACIAS:
            cfg = FARMACIAS[nome]
            vistos.add(nome)
            divergencias = list(cfg["divergencias"])
            turnos = horarios(u["expediente"])
            observacoes = cfg.get("observacoes")
            if observacoes is None and not turnos and u["expediente"]:
                # "24hrs" e afins: guardamos a palavra da fonte em vez de inventar
                # um intervalo que a fonte não deu.
                observacoes = f"O portal da prefeitura informa o expediente como: {u['expediente']}."
            unidades.append({
                "id": slug(cfg.get("nome_publico", nome)),
                "nome": cfg.get("nome_publico", nome),
                "tipo": cfg["tipo"],
                "endereco": endereco(u, geo_conferida=True),
                "telefones": telefones(u["telefone"]),
                "horarios": turnos,
                "dispensa": cfg["dispensa"],
                "entrega_descricao": cfg["entrega"],
                "restricao": cfg.get("restricao"),
                "observacoes": observacoes,
                "divergencias": divergencias,
                "proveniencia": [FONTE_PORTAL, FONTE_REMUME],
            })
            continue

        if nome in COBERTAS_POR_OUTRA_ENTRADA:
            vistos.add(nome)
            continue

        if re.match(r"UBS|Unidade Básica|ESF", nome, re.I):
            turnos = horarios(u["expediente"])
            unidades.append({
                "id": slug(nome),
                "nome": nome,
                "tipo": "dispensario_ubs",
                "endereco": endereco(u, geo_conferida=True),
                "telefones": telefones(u["telefone"]),
                "horarios": turnos,
                "dispensa": ["basico"],
                "entrega_descricao": ENTREGA_DISPENSARIO,
                "restricao": None,
                "observacoes": (
                    None if turnos
                    else f"O portal da prefeitura informa o expediente como: {u['expediente']}."
                ),
                "divergencias": [],
                "proveniencia": [FONTE_PORTAL],
            })

    faltando = set(FARMACIAS) - vistos
    if faltando:
        raise SystemExit(f"Farmácias esperadas e não encontradas no portal: {sorted(faltando)}")

    for f in SO_NA_REMUME:
        unidades.append({
            "id": f["id"], "nome": f["nome"], "tipo": "farmacia_distrital",
            "endereco": {"logradouro": f["logradouro"], "bairro": f["bairro"],
                         "cep": f["cep"], "geo": None},
            "telefones": f["telefones"],
            "horarios": [{"dias": None, "abre": f["abre"], "fecha": f["fecha"]}],
            "dispensa": ["basico"], "entrega_descricao": ENTREGA_DISTRITAL,
            "restricao": None, "observacoes": None,
            "divergencias": [
                "O portal da prefeitura não cadastra esta farmácia. O endereço e o "
                "telefone vêm da REMUME de 2024. Ligue antes de ir."
            ],
            "proveniencia": [FONTE_REMUME],
        })

    unidades.append({
        "id": PAMGC["id"], "nome": PAMGC["nome"], "tipo": PAMGC["tipo"],
        "endereco": {"logradouro": PAMGC["logradouro"], "bairro": None,
                     "cep": None, "geo": None},
        "telefones": PAMGC["telefones"],
        "horarios": [{"dias": None, "abre": "08:00", "fecha": "12:00"},
                     {"dias": None, "abre": "13:00", "fecha": "17:00"}],
        "dispensa": PAMGC["dispensa"], "entrega_descricao": PAMGC["entrega"],
        "restricao": PAMGC["restricao"], "observacoes": PAMGC["observacoes"],
        "divergencias": ["O portal da prefeitura não cadastra este programa."],
        "proveniencia": [FONTE_REMUME],
    })

    unidades.sort(key=lambda x: (x["tipo"], x["nome"]))
    SAIDA.write_text(json.dumps(unidades, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

    por_tipo: dict[str, int] = {}
    for u in unidades:
        por_tipo[u["tipo"]] = por_tipo.get(u["tipo"], 0) + 1
    com_geo = sum(1 for u in unidades if u["endereco"]["geo"])
    print(f"{len(unidades)} unidades, {com_geo} com coordenada")
    for tipo, n in sorted(por_tipo.items()):
        print(f"  {tipo}: {n}")


if __name__ == "__main__":
    main()
