"""
Lê o Anexo I da REMUME de Campo Grande e grava a tabela para conferência.

    python3 scripts/le_remume_campo_grande.py

Saída: data/fontes/ms-campo-grande/anexo-i-lido.json

**Isto ainda não é `remume.json`.** É a tabela da fonte, lida e reparada, para
uma pessoa conferir antes de virar dado publicado. O que falta para publicar
está em docs/ROADMAP.md: a cidade não tem `unidades.json`, e sem saber o
endereço do CEM, do CEDIP e do CRS o site não pode dizer onde retirar.

Só o Anexo I entra. O Anexo II é, nas palavras da própria resolução,
"medicamentos de uso em procedimentos internos nas Unidades de Saúde (não
dispensados à população)", e o Anexo III é o que fica na UPA para uso durante
o atendimento. Publicar qualquer um dos dois mandaria alguém à farmácia buscar
o que nunca é entregue.
"""
import json
import re
import subprocess
import sys
import unicodedata
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _tabela_campo_grande import extrai  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
PDF = RAIZ / "data/fontes/ms-campo-grande/diario-6466-remume-2021.pdf"
SAIDA = RAIZ / "data/fontes/ms-campo-grande/anexo-i-lido.json"
ANEXO_I = (2, 19)
HOJE = date.today().isoformat()

PROVENIENCIA = [{
    "fonte_nome": "Resolução SESAU n. 628/2021 — REMUME Campo Grande 2021, Anexo I",
    "fonte_url": "https://data.queridodiario.ok.org.br/5002704/2021-11-18/b15df93bb14a657fb9dd9a45f4473c050f37a2ac.pdf",
    "fonte_arquivo": "fontes/ms-campo-grande/diario-6466-remume-2021.pdf",
    "fonte_data": "2021-11-17",
    "extraido_em": HOJE,
    "verificado_em": HOJE,
    "metodo": "ia-assistida",
}]


def sem_acento(texto: str) -> str:
    plano = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in plano if not unicodedata.combining(c)).lower()


def texto_do_pdf() -> str:
    return subprocess.run(
        ["pdftotext", "-layout", str(PDF), "-"],
        capture_output=True, text=True, check=True,
    ).stdout


def repara(campo: str, vocabulario: set[str]) -> str:
    """
    Junta palavra partida pela quebra de linha do PDF.

    "Medroxiprogester" no fim de uma linha e "ona" no começo da seguinte são a
    mesma palavra. A emenda só é tentada **na quebra**, nunca no meio de uma
    linha: assim "Ácido Fólico", que está inteiro numa linha só, fica em paz, e
    o "E" de "CTA E CEM", que é conjunção, também.

    E só emenda quando o resultado é palavra que existe no próprio diário.
    """
    linhas = campo.split("\n")
    saida = linhas[:1]
    for seguinte in linhas[1:]:
        fim = saida[-1].split(" ")[-1] if saida[-1] else ""
        comeco = seguinte.split(" ")[0] if seguinte else ""
        if fim and comeco and sem_acento(fim + comeco) in vocabulario:
            saida[-1] = " ".join(saida[-1].split(" ")[:-1] + [fim + comeco])
            resto = " ".join(seguinte.split(" ")[1:])
            if resto:
                saida.append(resto)
        else:
            saida.append(seguinte)
    return " ".join(" ".join(saida).split())


def main() -> None:
    if not PDF.exists():
        sys.exit(f"Falta {PDF.relative_to(RAIZ)}.")

    bruto = texto_do_pdf()
    # Palavras do próprio diário: o vocabulário mais confiável para decidir se
    # dois pedaços eram uma palavra só. Siglas de três letras entram porque
    # CRS, CEM e CTA são exatamente o que a quebra de linha parte.
    vocabulario = {sem_acento(w) for w in re.findall(r"[A-Za-zÀ-ÿ]{3,}", bruto)}

    linhas = extrai(PDF, *ANEXO_I)
    numeros = [l["item"] for l in linhas]
    faltando = [n for n in range(1, max(numeros) + 1) if n not in numeros]
    repetidos = sorted({n for n in numeros if numeros.count(n) > 1})

    reparos = []
    for l in linhas:
        for campo in ("nome", "concentracao", "forma", "local"):
            # Juntar as linhas de uma célula com espaço é o normal e não é
            # reparo. Reparo é a emenda de palavra partida — o que muda em
            # relação a essa junção simples.
            simples = " ".join(l[campo].split())
            depois = repara(l[campo], vocabulario)
            if depois != simples:
                reparos.append({"item": l["item"], "campo": campo,
                                "antes": simples, "depois": depois})
            l[campo] = depois

    vazios = [l["item"] for l in linhas
              if not all(l[c] for c in ("nome", "concentracao", "forma", "local"))]

    # A leitura por coordenada acerta a tabela regular e tropeça onde a fonte
    # empilha várias linhas numa célula só — é o caso dos blísteres de
    # hanseníase, itens 49 a 53. Em vez de deixar passar calado, aponta-se
    # onde alguém precisa olhar. Nada aqui é publicado sem essa conferência.
    suspeitos = []
    for l in linhas:
        motivos = []
        if l["nome"][:1].islower():
            motivos.append("o nome começa em minúscula — pode estar cortado")
        if len(l["concentracao"]) > 60:
            motivos.append("a concentração é longa demais — pode ter juntado linhas vizinhas")
        if len(l["nome"]) > 60:
            motivos.append("o nome é longo demais — pode ter juntado linhas vizinhas")
        if re.search(r"\b(mg|ml|UI)\b", l["nome"], re.I):
            motivos.append("há dose no nome — a coluna pode ter vazado")
        if motivos:
            suspeitos.append({"item": l["item"], "nome": l["nome"], "motivos": motivos})

    SAIDA.write_text(json.dumps({
        "comentario": [
            "Anexo I da REMUME de Campo Grande 2021, lido do diário oficial.",
            "NÃO é dado publicado: falta conferência humana e falta unidades.json.",
            "Gerado por scripts/le_remume_campo_grande.py.",
        ],
        "municipio_id": "ms-campo-grande",
        "conferencia": {
            "itens_lidos": len(linhas),
            "numeracao_da_fonte": f"1 a {max(numeros)}",
            "itens_faltando": faltando,
            "itens_repetidos": repetidos,
            "celulas_vazias": vazios,
            "palavras_reparadas": len(reparos),
            "itens_a_conferir": [s["item"] for s in suspeitos],
        },
        "a_conferir": suspeitos,
        "reparos": reparos,
        "itens": linhas,
        "proveniencia": PROVENIENCIA,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

    print(f"{len(linhas)} itens lidos, numeração 1 a {max(numeros)}")
    print(f"  faltando: {faltando or 'nenhum'}")
    print(f"  repetidos: {repetidos or 'nenhum'}")
    print(f"  células vazias: {vazios or 'nenhuma'}")
    print(f"  palavras reparadas: {len(reparos)}")
    print(f"  itens a conferir à mão: {[s['item'] for s in suspeitos] or 'nenhum'}")
    for s in suspeitos:
        print(f"     {s['item']:>3} “{s['nome'][:44]}” — {'; '.join(s['motivos'])}")
    for r in reparos:
        print(f"     {r['item']:>3} {r['campo']}: “{r['antes']}” → “{r['depois']}”")
    print(f"gravado em {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
