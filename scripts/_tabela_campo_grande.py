"""
Lê a tabela do Anexo I da REMUME de Campo Grande a partir das coordenadas.

O texto do PDF sai com as células quebradas em várias linhas e as colunas
centralizadas, então fatiar por espaçamento erra. O que é estável é a posição
horizontal de cada coluna e a posição vertical do número do item.

Uma linha da tabela **não** começa na altura do número do item: a célula mais
alta pode subir acima dele. Por isso a fronteira entre duas linhas é o ponto
médio entre os números de item vizinhos, não o número em si.
"""
import re
import subprocess
from pathlib import Path

NOMES_DAS_COLUNAS = ("item", "nome", "concentracao", "forma", "local")

# Ponto de partida, medido nas páginas 2 a 19 do DIOGRANDE 6.466. Só vale como
# palpite: a tabela não fica no mesmo lugar em todas as páginas — na 19 ela
# está 55 pontos à direita, e fronteira fixa cortava a última coluna no meio.
COLUNAS_PADRAO = [
    ("item", 0, 150),
    ("nome", 150, 285),
    ("concentracao", 285, 430),
    ("forma", 430, 565),
    ("local", 565, 800),
]

# Cabeçalho de página e cabeçalho de tabela. Não são dado, e o de tabela fica
# logo acima do primeiro item — sem tirá-lo, ele é absorvido pela primeira
# linha e o item 1 se perde.
RUIDO = re.compile(
    r"DIOGRANDE|PÁGINA|PREFEITURA|MUNICIPAL DE CAMPO GRANDE|MATO GROSSO DO SUL|"
    r"^ANEXO$|^ITEM$|^NOME$|CONCENTRAÇÃO|COMPOSIÇÃO|FARMACÊUTICA|^DESCRIÇÃO$|"
    r"PADRONIZADO|RELAÇÃO MUNICIPAL|ESSENCIAIS|quinta-feira|novembro",
    re.I,
)

PALAVRA = re.compile(
    r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>'
)
ENTIDADES = {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'"}


def limpa(texto: str) -> str:
    for de, para in ENTIDADES.items():
        texto = texto.replace(de, para)
    return texto


def palavras_por_pagina(pdf: Path, primeira: int, ultima: int) -> list[list[tuple]]:
    xml = subprocess.run(
        ["pdftotext", "-bbox-layout", "-f", str(primeira), "-l", str(ultima),
         str(pdf), "-"],
        capture_output=True, text=True, check=True,
    ).stdout
    paginas = []
    for bruto in xml.split("<page ")[1:]:
        palavras = [
            ((float(a) + float(c)) / 2, (float(b) + float(d)) / 2, limpa(t))
            for a, b, c, d, t in PALAVRA.findall(bruto)
        ]
        # O ruído sai por linha inteira, não por palavra: "novembro" sozinha
        # não diz nada, mas a linha em que ela aparece é sempre cabeçalho.
        alturas_ruins = {
            round(y) for _, y, texto in palavras if RUIDO.search(texto)
        }
        paginas.append([
            (x, y, texto) for x, y, texto in palavras
            if round(y) not in alturas_ruins
        ])
    return paginas


def coluna_de(x: float, colunas: list[tuple] | None = None) -> str | None:
    for nome, inicio, fim in colunas or COLUNAS_PADRAO:
        if inicio <= x < fim:
            return nome
    return None


def colunas_da_pagina(palavras: list[tuple]) -> list[tuple]:
    """
    Onde cada coluna começa e termina **nesta página**.

    As cinco colunas são separadas por vãos de espaço em branco bem maiores que
    o espaço entre palavras. Achar os quatro maiores vãos dá as fronteiras onde
    elas de fato estão, em vez de onde estavam na página 2.
    """
    if not palavras:
        return COLUNAS_PADRAO

    # Só o miolo da tabela. Cabeçalho da página e rodapé atravessam a largura
    # inteira e colariam todas as colunas numa faixa só.
    ys = [y for x, y, texto in palavras if x < 200 and re.fullmatch(r"\d{1,4}", texto)]
    if not ys:
        return COLUNAS_PADRAO
    topo, base = min(ys) - 25, max(ys) + 25
    dentro = [w for w in palavras if topo <= w[1] <= base]
    if not dentro:
        return COLUNAS_PADRAO

    ocupado = sorted((x - 12, x + 12) for x, _, _ in dentro)
    faixas = [list(ocupado[0])]
    for inicio, fim in ocupado[1:]:
        if inicio > faixas[-1][1]:
            faixas.append([inicio, fim])
        else:
            faixas[-1][1] = max(faixas[-1][1], fim)
    if len(faixas) != len(NOMES_DAS_COLUNAS):
        return COLUNAS_PADRAO
    fronteiras = [0.0]
    for atual, seguinte in zip(faixas, faixas[1:]):
        fronteiras.append((atual[1] + seguinte[0]) / 2)
    fronteiras.append(10_000.0)
    return [
        (nome, fronteiras[i], fronteiras[i + 1])
        for i, nome in enumerate(NOMES_DAS_COLUNAS)
    ]


def _alturas(palavras: list[tuple]) -> list[float]:
    """As alturas onde há texto, uma por linha impressa."""
    return sorted({round(y, 1) for _, y, _ in palavras})


def _corte(topo: float, base: float, alturas: list[float]) -> float:
    """
    Onde termina uma linha da tabela e começa a seguinte.

    Não é no meio do caminho entre os dois números de item: uma célula de cinco
    linhas sobe acima desse meio, e o corte pelo meio entregava a primeira
    linha dela para a linha de cima — foi assim que o "Unidades com" do item 57
    virou parte do item 56.

    É no **maior espaço em branco** entre os dois itens. Entre linhas da mesma
    célula o espaçamento é o da fonte; entre uma célula e outra ele é maior, e
    é essa folga que a tabela usa para separar. Quando só há as duas linhas dos
    próprios itens, o maior espaço é o meio — o comportamento de antes.
    """
    dentro = [a for a in alturas if topo < a <= base]
    pontos = [topo, *dentro] if dentro and dentro[-1] < base else [topo, *dentro]
    if base not in pontos:
        pontos.append(base)
    maior, corte = -1.0, (topo + base) / 2
    for a, b in zip(pontos, pontos[1:]):
        if b - a > maior:
            maior, corte = b - a, (a + b) / 2
    return corte


def _empilha(conteudo: list[tuple]) -> str:
    """Uma linha impressa por linha de texto, na ordem em que aparecem."""
    por_altura: dict[float, list[tuple]] = {}
    for y, x, texto in conteudo:
        por_altura.setdefault(round(y, 1), []).append((x, texto))
    return "\n".join(
        " ".join(t for _, t in sorted(ws)) for _, ws in sorted(por_altura.items())
    )


def linhas_da_pagina(palavras: list[tuple]) -> tuple[list[dict], dict[str, str]]:
    """
    Devolve uma célula por coluna, para cada número de item da página.

    Só conta como item o número inteiro sozinho na coluna da esquerda. Número
    dentro do nome — "Vitamina B12" — está noutra coluna e não confunde.
    """
    colunas = colunas_da_pagina(palavras)
    itens = sorted(
        (y, int(t)) for x, y, t in palavras
        if coluna_de(x, colunas) == "item" and re.fullmatch(r"\d{1,4}", t)
    )
    if not itens:
        return [], {}

    alturas = _alturas(palavras)
    saltos = sorted(b - a for a, b in zip(alturas, alturas[1:]))
    meia = (saltos[len(saltos) // 2] / 2) if saltos else 20.0

    ys = [y for y, _ in itens]
    fronteiras = []
    for i, y in enumerate(ys):
        acima = _corte(ys[i - 1], y, alturas) if i else y - meia * 1.2
        abaixo = _corte(y, ys[i + 1], alturas) if i + 1 < len(ys) else y + meia * 3
        fronteiras.append((acima, abaixo))

    linhas = []
    for (topo, base), (_, numero) in zip(fronteiras, itens):
        celulas: dict[str, list[tuple]] = {c[0]: [] for c in colunas}
        for x, y, texto in palavras:
            if not (topo <= y < base):
                continue
            coluna = coluna_de(x, colunas)
            if coluna and coluna != "item":
                celulas[coluna].append((y, x, texto))
        # As linhas impressas da célula ficam separadas por "\n". É por elas que
        # se descobre palavra partida pela quebra: "Medroxiprogester" no fim de
        # uma linha e "ona" no começo da seguinte. Juntando tudo com espaço,
        # essa informação se perde e o conserto vira adivinhação.
        linhas.append({
            "item": numero,
            **{
                coluna: _empilha(conteudo)
                for coluna, conteudo in celulas.items()
                if coluna != "item"
            },
        })

    # Uma célula pode quebrar no fim da página e continuar no topo da seguinte:
    # o item 143 termina a página 9 com "Todas unidades de" e o "saúde" está na
    # página 10, acima do primeiro item dela.
    sobra: dict[str, str] = {}
    for x, y, texto in sorted(palavras, key=lambda w: (w[1], w[0])):
        if y >= fronteiras[0][0]:
            continue
        coluna = coluna_de(x, colunas)
        if coluna and coluna != "item":
            sobra[coluna] = f'{sobra.get(coluna, "")} {texto}'.strip()

    return linhas, sobra


def extrai(pdf: Path, primeira: int, ultima: int) -> list[dict]:
    linhas: list[dict] = []
    for palavras in palavras_por_pagina(pdf, primeira, ultima):
        da_pagina, sobra = linhas_da_pagina(palavras)
        # A sobra do topo pertence à última linha da página anterior.
        if sobra and linhas:
            for coluna, texto in sobra.items():
                linhas[-1][coluna] = f"{linhas[-1][coluna]}\n{texto}".strip()
        linhas += da_pagina
    return linhas
