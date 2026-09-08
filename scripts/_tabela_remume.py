"""
Extrai as tabelas de medicamentos da REMUME de Criciúma.

A tabela pinta uma faixa de fundo em cada linha alternada. Essas faixas dão as
fronteiras exatas de cada linha e de cada coluna, nas mesmas coordenadas em que
o texto é reportado. Nada aqui é adivinhado por espaçamento.
"""
import re
import subprocess
from pathlib import Path

VERDE = "71.369934%, 84.309387%, 65.879822%"
COLUNAS = ("item", "medicamento", "apresentacao", "local", "classe")


def faixas_e_colunas(svg_path):
    """
    Fronteiras de linha e de coluna, lidas das faixas de fundo pintadas.

    A mesma cor é usada para destacar texto dentro de uma célula, então só
    valem os grupos que atravessam a tabela inteira: cinco retângulos lado a
    lado, na mesma altura, cobrindo da primeira à última coluna.
    """
    s = Path(svg_path).read_text(encoding="utf8")
    por_faixa = {}
    for m in re.finditer(
        r'fill="rgb\(([^)]+)\)"[^>]*d="M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)', s
    ):
        if m.group(1) != VERDE:
            continue
        x0, y0, x1, _, _, y2 = (float(g) for g in m.groups()[1:])
        por_faixa.setdefault((round(y0, 2), round(y2, 2)), []).append((round(x0, 2), round(x1, 2)))

    ys, xs = set(), None
    for (y0, y2), rects in por_faixa.items():
        rects.sort()
        if len(rects) != 5:
            continue
        if any(abs(rects[i][1] - rects[i + 1][0]) > 0.5 for i in range(4)):
            continue
        ys.add(y0)
        ys.add(y2)
        xs = [r[0] for r in rects] + [rects[-1][1]]
    return sorted(ys), (xs or [])


def palavras(xml_pagina):
    for m in re.finditer(
        r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>',
        xml_pagina,
    ):
        x0, y0, x1, y1 = (float(m.group(i)) for i in range(1, 5))
        yield (x0 + x1) / 2, (y0 + y1) / 2, m.group(5)


def extrai(xml_path="all.xml", svg_dir="svg"):
    xml = Path(xml_path).read_text(encoding="utf8")
    paginas = re.findall(r'<page width="[\d.]+" height="[\d.]+">(.*?)</page>', xml, re.S)

    itens, secao, ultimo = [], None, None
    for np, pg in enumerate(paginas, 1):
        ys, xs = faixas_e_colunas(f"{svg_dir}/p{np}.svg")
        if len(xs) < 6:
            continue

        # Onde cada seção começa nesta página, e onde a tabela termina.
        marcos, cabecalhos, y_fim, y_topo = [], [], 1e9, 0.0
        agrupadas = {}
        for cx, cy, t in palavras(pg):
            agrupadas.setdefault(round(cy / 4), []).append((cx, t))
        for k in sorted(agrupadas):
            y = k * 4
            linha = re.sub(r"\s+", " ", " ".join(t for _, t in sorted(agrupadas[k])))
            if re.search(r"2\.1 Componente Básico", linha):
                marcos.append((y, "cbaf"))
            elif re.search(r"2\.2 Medicamentos de Uso Ambulatorial", linha):
                marcos.append((y, "ambulatorial"))
            elif re.search(r"COMPONENTE\s+ESTRATÉGICO", linha):
                marcos.append((y, "cesaf"))
            elif re.match(r"[4-9]\.\s+[A-ZÀ-Ý]{4}", linha):
                marcos.append((y, None))
            # O cabeçalho fica acima da tabela e o rodapé abaixo. Nenhum dos
            # dois pode entrar em célula nenhuma.
            if re.search(r"REMUME CRICIÚMA - Versão|^Página \d+ de", linha):
                y_fim = min(y_fim, y - 4)
            elif re.search(r"Prefeitura Municipal de Criciúma|Medicamentos - REMUME", linha):
                # Cabeçalho da página, sempre no alto.
                y_topo = max(y_topo, y + 8)
            elif re.search(r"Item Medicamento", linha):
                # Cabeçalho da tabela: fronteira, não topo da página. Uma
                # página pode ter o fim de uma tabela e o início de outra.
                cabecalhos.append(y + 14)
        if secao is None and not marcos:
            continue

        # Linhas da tabela: cada vão entre fronteiras consecutivas é uma linha,
        # pintada ou não. A última vai da fronteira final até o pé da tabela.
        # A primeira linha de uma página de continuação não é pintada e fica
        # acima da primeira faixa: por isso o topo da tabela também é fronteira.
        # Um título de seção no meio da página também é fronteira: separa a
        # última linha da tabela anterior do texto que vem depois dela.
        limites = sorted(
            {y_topo}
            | {y for y in cabecalhos if y_topo < y < y_fim}
            | {ym - 4 for ym, _ in marcos if y_topo < ym < y_fim}
            | {y for y in ys if y_topo < y < y_fim}
        )
        limites.append(min(max(ys) + 200, y_fim))
        linhas = [(limites[i], limites[i + 1]) for i in range(len(limites) - 1)]

        celulas = [{c: [] for c in COLUNAS} for _ in linhas]
        for cx, cy, t in palavras(pg):
            if cx < xs[0] or cx > xs[-1]:
                continue
            li = next((i for i, (a, b) in enumerate(linhas) if a <= cy < b), None)
            if li is None:
                continue
            ci = next((i for i in range(5) if xs[i] <= cx < xs[i + 1]), None)
            if ci is None:
                continue
            celulas[li][COLUNAS[ci]].append((cy, cx, t))

        viu_item = False
        for (topo, _), cel in zip(linhas, celulas):
            for ym, sm in marcos:
                if ym <= topo + 8:
                    secao = sm
            if secao is None:
                continue
            reg = {}
            for c in COLUNAS:
                reg[c] = " ".join(t for _, _, t in sorted(cel[c]))
            if re.fullmatch(r"\d{1,3}", reg["item"]):
                reg["secao"] = secao
                reg["pagina"] = np
                itens.append(reg)
                ultimo = reg
                viu_item = True
            elif (not viu_item and ultimo is not None
                  and ultimo["secao"] == secao
                  and any(reg[c] for c in COLUNAS[1:])):
                # Linha sem número, antes do primeiro item da página: é a
                # continuação do item que atravessou a quebra de página.
                # Depois do primeiro item, linha sem número é título ou
                # parágrafo entre tabelas, e não entra em célula nenhuma.
                for c in COLUNAS[1:]:
                    if reg[c]:
                        ultimo[c] = (ultimo[c] + " " + reg[c]).strip()

        # Um título de seção pode aparecer depois da última linha da página:
        # vale para a página seguinte.
        if marcos:
            secao = marcos[-1][1]

    for r in itens:
        for c in COLUNAS[1:]:
            r[c] = re.sub(r"\s+", " ", r[c]).strip()
    return itens


if __name__ == "__main__":  # pragma: no cover
    import json
    from collections import Counter

    itens = extrai()
    json.dump(itens, open("remume_bruto.json", "w"), ensure_ascii=False, indent=1)
    print(Counter(i["secao"] for i in itens))
    faltando = [i for i in itens if not (i["medicamento"] and i["apresentacao"] and i["local"])]
    print("registros com coluna vazia:", len(faltando))
    for i in itens[:10]:
        print(f'  {i["item"]:>3} | {i["medicamento"][:26]:<26} | {i["apresentacao"][:26]:<26} | {i["local"][:36]:<36} | {i["classe"][:30]}')
