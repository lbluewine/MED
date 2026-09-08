"""
Gera data/nacional/farmacia-popular.json a partir do elenco publicado pelo
Ministério da Saúde.

Depende de poppler-utils (pdftotext). Rodar:

    python3 scripts/extrai_farmacia_popular.py

O PDF é uma tabela de duas colunas: a indicação à esquerda, os medicamentos à
direita. O texto corrido perde essa ligação, porque o rótulo da indicação vem
centralizado no meio do bloco dele. Por isso a leitura é geométrica: cada
palavra tem coordenada, e o agrupamento é resolvido por programação dinâmica
— cada item vai para o rótulo mais próximo, respeitando a ordem da página.

Nada aqui interpreta o que o medicamento faz. O texto de cada item vai para o
JSON exatamente como a fonte escreve; o que o script separa (princípio ativo,
dose) serve só para cruzar com a lista do município.
"""
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PDF = RAIZ / "data/fontes/nacional/pfpb-elenco-2026-08-31.pdf"
SAIDA = RAIZ / "data/nacional/farmacia-popular.json"
HOJE = "2026-09-06"

# Onde a coluna da indicação acaba e a dos medicamentos começa, em pontos do
# PDF. As duas colunas estão bem separadas: rótulos terminam antes de 260,
# itens começam depois de 300.
CORTE_COLUNAS = 300.0

# Dose no fim do texto: "500mg", "0,02mg", "100ui/ml", "50mcg/dose", "5 mg".
DOSE = re.compile(
    r"\s*\d+(?:[.,]\d+)?\s*(?:mg|mcg|g|ml|ui/ml|ui|%)(?:/(?:ml|dose))?\s*$",
    re.IGNORECASE,
)

# Observação que a fonte anexa ao item depois de um travessão.
OBSERVACAO = re.compile(r"\s+[-–]\s+(.+)$")

PROVENIENCIA = [
    {
        "fonte_nome": "Elenco de Medicamentos e Insumos do Programa Farmácia Popular do Brasil",
        "fonte_url": (
            "https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular/"
            "arquivos/elenco-de-medicamentos-e-insumos-pfpb.pdf"
        ),
        "fonte_arquivo": "fontes/nacional/pfpb-elenco-2026-08-31.pdf",
        "fonte_data": "2026-08-31",
        "extraido_em": HOJE,
        "verificado_em": HOJE,
        "metodo": "ia-assistida",
    }
]

# Como retirar. Não sai do PDF do elenco: sai da página do programa, e por isso
# tem proveniência própria. Cada frase é o que a página informa, sem acréscimo.
COMO_RETIRAR = {
    "gratuito": True,
    "documentos": [
        "Documento oficial com foto e número do CPF, ou documento de identidade em que conste o CPF",
        "Receita médica dentro do prazo de validade, do SUS ou de serviço particular",
    ],
    "onde": (
        "Farmácias e drogarias da rede privada credenciadas, identificadas com o "
        "selo “Aqui Tem Farmácia Popular”."
    ),
    "proveniencia": [
        {
            "fonte_nome": "Programa Farmácia Popular — Ministério da Saúde",
            "fonte_url": "https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular",
            "fonte_arquivo": None,
            "fonte_data": "2026-09-06",
            "extraido_em": HOJE,
            "verificado_em": HOJE,
            "metodo": "manual",
        }
    ],
}

# Onde a pessoa acha uma farmácia credenciada. O painel é oficial e interativo;
# o site linka em vez de copiar, porque a lista muda toda semana e uma cópia
# velha manda gente a uma farmácia que saiu do programa.
BUSCA_ENDERECOS = {
    "url": "https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_PFPB_ENDERECOS/index.html",
    "nome": "Consulta de endereços das farmácias do PFPB — Ministério da Saúde",
}


def sem_acento(texto: str) -> str:
    decomposto = unicodedata.normalize("NFD", texto)
    return "".join(c for c in decomposto if unicodedata.category(c) != "Mn")


def para_slug(texto: str) -> str:
    limpo = sem_acento(texto).lower()
    limpo = re.sub(r"[^a-z0-9]+", "-", limpo)
    return limpo.strip("-")


def linhas_do_pdf() -> list[tuple[float, float, str]]:
    """Cada linha do PDF como (x inicial, y do meio, texto)."""
    xml = subprocess.run(
        ["pdftotext", "-bbox-layout", str(PDF), "-"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout

    achadas = []
    padrao = re.compile(
        r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">(.*?)</line>',
        re.S,
    )
    for m in padrao.finditer(xml):
        palavras = re.findall(r"<word[^>]*>(.*?)</word>", m[4], re.S)
        texto = " ".join(p.strip() for p in palavras if p.strip())
        if texto:
            achadas.append((float(m[1]), (float(m[2]) + float(m[3])) / 2, texto))
    return achadas


def agrupa(rotulos: list[tuple[float, str]], itens: list[tuple[float, str]]):
    """
    Divide os itens entre os rótulos, mantendo a ordem da página. Cada rótulo
    fica com um bloco contíguo e não vazio.

    O que amarra o rótulo ao bloco é a diagramação da tabela: o rótulo vem
    centralizado na altura do seu grupo. Então o custo de um bloco é a
    distância entre o **centro do bloco** e o rótulo — não a soma das
    distâncias item a item, que favoreceria blocos de tamanho parecido e
    empurraria itens para o vizinho.

    Programação dinâmica: custo[i][j] = melhor custo para distribuir os
    primeiros i itens entre os primeiros j rótulos.
    """
    n, k = len(itens), len(rotulos)
    if k == 0 or n < k:
        raise SystemExit(f"esperava pelo menos um item por indicação: {n} itens, {k} rótulos")

    INF = float("inf")
    custo = [[INF] * (k + 1) for _ in range(n + 1)]
    corte = [[0] * (k + 1) for _ in range(n + 1)]
    custo[0][0] = 0.0

    for j in range(1, k + 1):
        y_rotulo = rotulos[j - 1][0]
        for i in range(j, n - (k - j) + 1):
            soma = 0.0
            # o bloco do rótulo j vai do item t até o item i-1
            for t in range(i - 1, j - 2, -1):
                soma += itens[t][0]
                centro = soma / (i - t)
                candidato = custo[t][j - 1] + abs(centro - y_rotulo)
                if candidato < custo[i][j]:
                    custo[i][j] = candidato
                    corte[i][j] = t

    if custo[n][k] == INF:
        raise SystemExit("não consegui agrupar os itens por indicação")

    blocos, i = [], n
    for j in range(k, 0, -1):
        t = corte[i][j]
        blocos.append((rotulos[j - 1][1], [texto for _, texto in itens[t:i]]))
        i = t
    return list(reversed(blocos))


def separa(texto: str) -> dict:
    """Princípios ativos e observação de um item, a partir do texto da fonte."""
    corpo = texto
    observacao = None
    if achou := OBSERVACAO.search(corpo):
        observacao = achou[1].strip()
        corpo = corpo[: achou.start()].strip()

    principios, tem_dose = [], False
    for parte in corpo.split(" + "):
        parte = parte.strip()
        sem_dose = DOSE.sub("", parte).strip()
        if sem_dose != parte:
            tem_dose = True
        if sem_dose:
            principios.append(sem_dose)

    return {
        "texto": texto,
        "principios_ativos": principios,
        "observacao": observacao,
        # Absorvente e fralda são insumos, não medicamentos: a fonte os lista
        # sem dose, e a tela não pode chamá-los de medicamento.
        "insumo": not tem_dose,
    }


def main() -> None:
    if not PDF.exists():
        raise SystemExit(f"não achei o PDF de origem em {PDF}")

    linhas = sorted(linhas_do_pdf(), key=lambda l: l[1])

    data_fonte = None
    for _, _, texto in linhas:
        if achou := re.search(r"Atualizada em (\d{2})/(\d{2})/(\d{4})", texto):
            data_fonte = f"{achou[3]}-{achou[2]}-{achou[1]}"
    if data_fonte != PROVENIENCIA[0]["fonte_data"]:
        raise SystemExit(
            f"o PDF diz que foi atualizado em {data_fonte}, mas a proveniência "
            f"deste script diz {PROVENIENCIA[0]['fonte_data']}. "
            "Confira o documento novo antes de publicar."
        )

    # O cabeçalho da tabela e o rodapé de data não são dado.
    ignorar = ("Elenco de Medicamentos", "Indicação", "Princípio Ativo", "Atualizada em")
    corpo = [l for l in linhas if not any(l[2].startswith(p) for p in ignorar)]

    rotulos = [(y, texto) for x, y, texto in corpo if x < CORTE_COLUNAS]
    itens = [(y, texto) for x, y, texto in corpo if x >= CORTE_COLUNAS]

    grupos = []
    for indicacao, textos in agrupa(rotulos, itens):
        grupos.append(
            {
                "indicacao": indicacao,
                "slug": para_slug(indicacao),
                "itens": [separa(t) for t in textos],
            }
        )

    dados = {
        "fonte_atualizada_em": data_fonte,
        "como_retirar": COMO_RETIRAR,
        "busca_enderecos": BUSCA_ENDERECOS,
        "grupos": grupos,
        "proveniencia": PROVENIENCIA,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        json.dumps(dados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    total = sum(len(g["itens"]) for g in grupos)
    print(f"{SAIDA.relative_to(RAIZ)}: {len(grupos)} indicações, {total} itens\n")
    print("Confira o agrupamento antes de aprovar — é o que a IA pode errar:\n")
    for g in grupos:
        print(f"  {g['indicacao']} ({len(g['itens'])})")
        for item in g["itens"]:
            marca = " [insumo]" if item["insumo"] else ""
            print(f"      {item['texto']}{marca}")
    return None


if __name__ == "__main__":
    sys.exit(main())
