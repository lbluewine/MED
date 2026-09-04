"""
Gera data/municipios/sc-criciuma/remume.json a partir da REMUME publicada.

Depende de poppler-utils (pdftotext e pdftocairo). Rodar:

    python3 scripts/extrai_remume_criciuma.py

A leitura da tabela fica em _tabela_remume.py. Aqui só se traduz o que a fonte
escreve para o vocabulário do schema. Nada é inventado: o que não se reconhece
com certeza vira nulo, e o texto original continua no registro.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _tabela_remume import extrai  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
PDF = RAIZ / "data/fontes/sc-criciuma/remume-2024-11.pdf"
SAIDA = RAIZ / "data/municipios/sc-criciuma/remume.json"
HOJE = "2026-09-04"

PROVENIENCIA = [{
    "fonte_nome": "REMUME Criciúma versão 11/2024",
    "fonte_url": "https://cigtes.criciuma.sc.gov.br/redes-de-atencao-saude/material-apoio/20",
    "fonte_arquivo": "fontes/sc-criciuma/remume-2024-11.pdf",
    "fonte_data": "2024-11-01",
    "extraido_em": HOJE,
    "verificado_em": HOJE,
    "metodo": "ia-assistida",
}]

COMPONENTE = {"cbaf": "basico", "ambulatorial": "basico", "cesaf": "estrategico"}

# Onde a fonte manda a pessoa ir, traduzido para as unidades do site.
# O que não é balcão de entrega fica de fora e aparece só como texto.
LOCAIS = [
    (r"farm[aá]cias?\s+distritais?|farm[aá]cia distrital", "farmacia_distrital"),
    (r"dispens[aá]rios?\s+nas?\s+ubs", "dispensario_ubs"),
    (r"farm[aá]cias?\s+estrat[eé]gica", "farmacia_estrategica"),
    (r"farm[aá]cia\s+escola", "farmacia_ceaf"),
    (r"\bcaps\b", "farmacia_caps"),
    (r"automonitoramento\s+glic[eê]mico", "programa_insumos"),
]

RECEITAS = [
    (r"Controle\s+Especial\s*[“\"]?Branca", "controle_especial_branca_2_vias"),
    (r"Notifica[çc][ãa]o\s+de\s+Receita\s*[“\"]?B[”\"]?\s*Azul", "notificacao_b_azul"),
    (r"Notifica[çc][ãa]o\s+de\s+Receita\s*[“\"]?A[”\"]?\s*Amarela", "notificacao_a_amarela"),
    (r"Receitu[aá]rio\s+em\s+duas\s+vias", "antimicrobiano_2_vias"),
    (r"Receitu[aá]rio\s+simples", "simples"),
]

CONTROLADOS = {
    "controle_especial_branca_2_vias",
    "notificacao_b_azul",
    "notificacao_a_amarela",
}

FORMAS = [
    (r"\bcomprimidos?\b", "comprimido"),
    (r"\bc[aá]psulas?\b", "capsula"),
    (r"\bsolu[çc][ãa]o\s+nasal\b", "solucao_nasal"),
    (r"\bsolu[çc][ãa]o\s+inalat[óo]ria\b", "solucao_inalatoria"),
    (r"\bsolu[çc][ãa]o\s+retal\b", "solucao_retal"),
    (r"\bsolu[çc][ãa]o\s+oral\b", "solucao_oral"),
    (r"\bsuspens[ãa]o\s+oral\b", "suspensao_oral"),
    (r"\bxarope\b", "xarope"),
    (r"\bcreme\b", "creme"),
    (r"\bpomada\b", "pomada"),
    (r"\bcol[íi]rio\b|\boft[aá]lmica\b", "colirio"),
    (r"\binjet[aá]vel|\bampola\b", "injetavel"),
    (r"\bspray\s+nasal\b", "spray_nasal"),
    (r"\baeross?ol\b|spray\s+oral\b", "aerossol_inalatorio"),
    (r"\bsupposit|\bsupositório\b", "supositorio"),
    (r"\badesivo\b", "adesivo"),
    (r"\blo[çc][ãa]o\b", "locao"),
    (r"\bgel\b", "gel"),
    (r"\bpasta\b", "pasta"),
    (r"\b[óo]leo\b", "oleo"),
    (r"\bsolu[çc][ãa]o\s+nasal\b", "solucao_nasal"),
    (r"\bsolu[çc][ãa]o\s+inalat[óo]ria\b", "solucao_inalatoria"),
    (r"\bsolu[çc][ãa]o\s+retal\b", "solucao_retal"),
    (r"\bp[óo]\b|granulado", "po"),
]


def limpa(texto: str) -> str:
    return re.sub(r"\s+", " ", texto).strip(" -–—")


def principio_ativo(bruto: str) -> tuple[str, str | None]:
    """Separa o nome do remédio das notas entre parênteses que a fonte anexa."""
    notas = re.findall(r"\((?:Controlado|RDC)[^)]*\)?", bruto)
    nome = re.sub(r"\((?:Controlado|RDC)[^)]*\)?", " ", bruto)
    nome = re.sub(r"\s*\*+\s*", " ", nome)
    return limpa(nome), (limpa(" ".join(notas)) or None)


def forma_e_concentracao(apresentacao: str, nome: str) -> tuple[str | None, str | None]:
    apresentacao = re.sub(rf"^\s*{re.escape(nome)}\s*", "", apresentacao, flags=re.I)
    forma = next((f for padrao, f in FORMAS if re.search(padrao, apresentacao, re.I)), None)
    # A concentração é o que vem antes da primeira palavra de forma.
    m = re.search(r"^(.*?)(?=\b(?:comprimido|c[áa]psula|solu[çc][ãa]o|suspens[ãa]o|xarope|"
                  r"creme|pomada|col[íi]rio|injet[aá]vel|ampola|frasco|p[óo]|granulado|"
                  r"adesivo|spray|aeross?ol|lo[çc][ãa]o|bisnaga|gel|pasta|[óo]leo)\b)", apresentacao, re.I)
    conc = limpa(m.group(1)) if m and m.group(1).strip() else None
    return forma, conc


def item(reg: dict) -> dict | None:
    nome, nota_nome = principio_ativo(reg["medicamento"])
    if not nome:
        return None

    classe = reg["classe"]
    receita = next((r for padrao, r in RECEITAS if re.search(padrao, classe, re.I)), None)

    # A classificação é o que vem antes da parte sobre receita.
    corte = re.search(r"Receitu[aá]rio|Notifica[çc][ãa]o", classe, re.I)
    classificacao = limpa(classe[: corte.start()]) if corte else None
    resto = limpa(classe[corte.end():]) if corte else ""
    resto = re.sub(r"^(simples|em duas vias|de Controle Especial[^A-ZÀ-Ý]*|"
                   r"de Receita\s*[“\"]?[AB][”\"]?\s*(Azul|Amarela)|acompanhado de receita)",
                   "", resto, flags=re.I).strip(" -–—*")

    local = reg["local"]
    onde = []
    for padrao, tipo in LOCAIS:
        if re.search(padrao, local, re.I) and tipo not in onde:
            onde.append(tipo)

    forma, conc = forma_e_concentracao(limpa(reg["apresentacao"]), nome)
    observacoes = " ".join(x for x in (nota_nome, resto or None) if x).strip() or None

    return {
        "principio_ativo": nome,
        "apresentacao": limpa(reg["apresentacao"]),
        "concentracao": conc,
        "forma": forma,
        "componente": COMPONENTE[reg["secao"]],
        "retirada": "usado_na_unidade" if reg["secao"] == "ambulatorial" else "leva_para_casa",
        "onde_retirar": onde,
        "locais_texto": limpa(local),
        "tipo_receita": receita,
        "classificacao": classificacao or None,
        "exige": (
            ["receita_original", "documento_com_foto", "cartao_sus"]
            if receita in CONTROLADOS
            else ["receita_original"]
        ),
        "slug_ficha": None,
        "observacoes": observacoes,
        "proveniencia": PROVENIENCIA,
    }


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        subprocess.run(["pdftotext", "-bbox-layout", str(PDF), str(tmp / "t.xml")], check=True)
        for p in range(1, 29):
            subprocess.run(
                ["pdftocairo", "-svg", "-f", str(p), "-l", str(p), str(PDF), str(tmp / f"p{p}.svg")],
                check=True,
            )
        brutos = extrai(tmp / "t.xml", tmp)

    itens, descartados = [], []
    for reg in brutos:
        norm = item(reg)
        (itens if norm else descartados).append(norm or reg)

    # Duas linhas podem descrever a mesma apresentação em locais diferentes;
    # o schema recusa duplicata, então a fonte precisa ser conferida.
    chaves = [(i["principio_ativo"], i["apresentacao"], i["retirada"]) for i in itens]
    repetidas = {c for c in chaves if chaves.count(c) > 1}

    SAIDA.write_text(json.dumps(itens, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"{len(itens)} itens gravados")
    if descartados:
        print(f"{len(descartados)} linhas descartadas (sem nome ou sem tipo de receita):")
        for d in descartados[:10]:
            print(f'   {d.get("secao")} {d.get("item")}: {d.get("medicamento", "")[:44]!r}')
    if repetidas:
        print(f"{len(repetidas)} apresentações repetidas, conferir na fonte:")
        for r in sorted(repetidas)[:10]:
            print(f"   {r[0]} — {r[1][:44]} ({r[2]})")
    sem_receita = sum(1 for i in itens if not i["tipo_receita"])
    print(f"{sem_receita} sem tipo de receita informado na fonte")
    sem_local = sum(1 for i in itens if not i["onde_retirar"])
    sem_forma = sum(1 for i in itens if not i["forma"])
    print(f"{sem_local} sem local mapeado, {sem_forma} sem forma reconhecida")


if __name__ == "__main__":
    main()
