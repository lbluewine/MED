"""
Gera data/nacional/rename.json a partir do PDF oficial da RENAME.

A RENAME é o piso nacional: o que o SUS garante em qualquer município do
Brasil. É ela que faz uma cidade sem lista própria ter resposta, em vez de
"ainda não publicamos esta parte".

Os Anexos I a III trazem a tabela de medicamentos. O Anexo IV é de insumos
(seringa, tira de glicemia) e fica de fora: não é medicamento e não cabe no
schema.

## Por que a extração olha a cor do fundo

Na tabela, um medicamento com várias apresentações ocupa uma célula mesclada, e
o nome fica solto no meio dela:

    ibuprofeno       200 mg      comprimido
                     300 mg      comprimido
                     600 mg      cápsula

Lendo por linha de texto, as apresentações sem nome ao lado ficam órfãs. Tentar
adivinhar por proximidade não funciona: o nome nem sempre está no centro do
bloco, e a apresentação mais próxima de "imiquimode" era a última do
ibuprofeno, logo acima. Numa conferência contra o PDF, esse chute dizia que
imiquimode é "suspensão oral" quando é creme, e que naloxona é "cápsula 10 mg"
quando é solução injetável. Num site de saúde isso não é erro de formatação.

A tabela não tem bordas desenhadas, mas cada medicamento é uma faixa de fundo
colorido separada da seguinte por uma linha branca fina. Essa faixa é a
fronteira exata da célula mesclada. Por isso o script renderiza a página em
tons de cinza e lê onde o fundo começa e termina — é a única marca no
documento que diz, sem adivinhação, quais apresentações são de quem.

Rodar:

    python3 scripts/extrai_rename.py                # baixa da fonte oficial
    python3 scripts/extrai_rename.py caminho.pdf    # usa um PDF já baixado

O download exige acesso a bvsms.saude.gov.br. Em rede que bloqueia esse host
(é o caso da rede da Secretaria), baixe o PDF em outra conexão e passe o
caminho como argumento — o resultado é o mesmo.

Precisa de `pdftotext` e `pdftoppm` (pacote poppler-utils).
"""
import hashlib
import json
import re
import statistics
import subprocess
import sys
import tempfile
import unicodedata
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "data/nacional/rename.json"
COPIA = RAIZ / "data/fontes/nacional/rename-2024.pdf"

# De onde o PDF vem, em ordem de preferência. A primeira é a canônica: é para
# onde a página oficial da Rename redireciona, e o endereço que o Ministério
# publica desde sempre. A segunda é o mesmo documento hospedado pela Secretaria
# de Estado da Saúde de Santa Catarina — está aqui porque a rede da Secretaria
# de Criciúma bloqueia o host da primeira, e sem espelho o script não roda no
# computador de quem cuida do site. O que foi usado de fato vai na proveniência.
FONTES = [
    (
        "Relação Nacional de Medicamentos Essenciais (Rename) 2024 — Ministério da Saúde",
        "https://bvsms.saude.gov.br/bvs/publicacoes/relacao_nacional_medicamentos_2024.pdf",
    ),
    (
        "Relação Nacional de Medicamentos Essenciais (Rename) 2024 — Ministério da Saúde, "
        "cópia publicada pela Secretaria de Estado da Saúde de Santa Catarina",
        "https://www.saude.sc.gov.br/index.php/pt/component/edocman/rename/download",
    ),
]

# A página oficial da Rename. Fica registrada porque é o endereço estável que
# se confere quando sai edição nova.
PAGINA_OFICIAL = "https://www.gov.br/saude/pt-br/composicao/sectics/rename"
EDICAO = "RENAME 2024"
FONTE_DATA = "2024-12-30"

UA = (
    "tem-no-sus/0.0 (projeto voluntario de informacao publica de saude; "
    "+https://github.com/lbluewine/MED)"
)

# Faixas de página de cada anexo, no PDF da edição 2024. O script confere os
# títulos antes de usar: se a edição mudar a paginação, ele para em vez de
# extrair as páginas erradas.
ANEXOS = [
    ("basico", 124, 145, "ANEXO I"),
    ("estrategico", 146, 161, "ANEXO II"),
    ("especializado", 162, 221, "ANEXO III"),
]

# O Apêndice A repete a mesma lista, mas classificada pelo ATC — o código
# internacional do princípio ativo. É o único identificador estável que a
# RENAME publica: cruzar fontes por nome depende de cada prefeitura escrever
# igual, e nenhuma escreve. Ver `docs/DADOS.md`.
APENDICE_ATC = (26, 122)

# "A16AB04": uma letra de grupo anatômico, dois dígitos, e o resto do caminho.
CODIGO_ATC = re.compile(r"^[A-Z]\d{2}[A-Z]{0,2}\d{0,2}$")

# As colunas não ficam no mesmo lugar em todos os anexos: os Anexos I e II têm
# três (nome, concentração, forma) e o Anexo III tem cinco — entram o grupo de
# financiamento do CEAF ("1A", "1B") e o PCDT da doença. Por isso as faixas são
# descobertas em cada página. Só as três primeiras viram dado; grupo e PCDT são
# do processo do alto custo, que é do estado, e não cabem no schema da RENAME.
GAP_ENTRE_COLUNAS = 40.0

# Quantas linhas precisam começar no mesmo x para aquilo valer como coluna.
#
# É 1 porque a exclusão do traço, mais abaixo, já resolve o caso que motivava
# um mínimo maior. Exigir três linhas descartava páginas inteiras: onde a
# ciclosporina traz vinte PCDTs numa coluna e uma linha só nas outras, apenas a
# coluna dos PCDTs passava, e a página saía vazia e calada.
MINIMO_POR_COLUNA = 1

# Cabeçalho e rodapé de cada página, que não são dados.
Y_TOPO = 122.0
Y_RODAPE = 700.0

# Renderização para ler o fundo. 100 dpi já separa as faixas com folga e mantém
# a imagem pequena — a fronteira entre medicamentos tem 3 pontos de altura.
DPI = 100
ESCALA = DPI / 72.0

# Acima disto o fundo é a linha branca que separa dois medicamentos.
TOM_SEPARADOR = 250

# Faixa de fundo mais baixa que isto é sobra de arredondamento, não medicamento.
ALTURA_MINIMA_FAIXA = 8

# Duas linhas de uma mesma célula ficam a uma entrelinha (16 pt) uma da outra.
GAP_MESMA_CELULA = 19.0

RUIDO = re.compile(
    r"^(continua|continuação|denominação|comum|brasileira|\(dcb\)|"
    r"concentração|composição|forma|farmacêutica|grupo de|financiamento|"
    r"documento|norteador|componente |anexo |relação nacional|"
    r"ministério da saúde|\|?\s*\d+\s*$)",
    re.I,
)


def limpa(texto: str) -> str:
    """Tira espaço de largura zero e normaliza o branco."""
    t = texto.replace("​", "").replace("­", "")
    t = unicodedata.normalize("NFC", t)
    return re.sub(r"\s+", " ", t).strip()


def baixa_pdf(destino: Path):
    """Baixa o PDF da primeira fonte que responder. Devolve (nome, url) dela."""
    problemas = []
    for nome, url in FONTES:
        print(f"tentando {url}")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=180) as r:
                dados = r.read()
            if not dados.startswith(b"%PDF"):
                raise ValueError("a resposta não é um PDF")
        except Exception as e:
            problemas.append(f"  {url}\n    {e}")
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(dados)
        # A soma acompanha as outras fontes de `data/fontes/`: é como se
        # percebe que o documento mudou sem ninguém avisar.
        soma = hashlib.sha256(dados).hexdigest()
        destino.with_suffix(".sha256").write_text(
            f"{soma}  ./{destino.parent.name}/{destino.name}\n", encoding="utf-8"
        )
        print(f"  {len(dados) / 1_000_000:.1f} MB em {destino.relative_to(RAIZ)}")
        return nome, url

    raise SystemExit(
        "ERRO: nenhuma fonte respondeu.\n"
        + "\n".join(problemas)
        + "\n  Baixe o PDF em outra conexão e rode:"
        "\n    python3 scripts/extrai_rename.py <caminho.pdf>"
    )


def linhas_da_pagina(pdf: Path, pagina: int):
    """Cada linha de texto da página, como (y, x, texto), em pontos."""
    saida = subprocess.run(
        ["pdftotext", "-bbox-layout", "-f", str(pagina), "-l", str(pagina), str(pdf), "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout

    resultado = []
    for m in re.finditer(
        r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">(.*?)</line>',
        saida,
        re.S,
    ):
        x, y = float(m.group(1)), float(m.group(2))
        texto = limpa(" ".join(re.findall(r"<word[^>]*>([^<]*)</word>", m.group(3))))
        if texto:
            resultado.append((y, x, texto))
    resultado.sort()
    return resultado


def le_pgm(caminho: Path):
    """Lê um PGM binário (P5) sem depender de biblioteca de imagem."""
    dados = caminho.read_bytes()
    campos = []
    i = 2  # pula "P5"
    while len(campos) < 3:
        while i < len(dados) and dados[i : i + 1].isspace():
            i += 1
        if dados[i : i + 1] == b"#":
            while dados[i : i + 1] not in (b"\n", b""):
                i += 1
            continue
        j = i
        while j < len(dados) and not dados[j : j + 1].isspace():
            j += 1
        campos.append(int(dados[i:j]))
        i = j
    largura, altura, _ = campos
    return largura, altura, dados[i + 1 :]


def faixas_de_fundo(pdf: Path, pagina: int, x_ini: float, x_fim: float):
    """
    Os intervalos verticais (em pontos) de cada medicamento na página.

    Cada faixa de fundo colorido é a célula mesclada de um medicamento, e a
    linha branca entre duas faixas é a fronteira. É isso que diz de quem é cada
    apresentação — o resto é chute.
    """
    with tempfile.TemporaryDirectory() as tmp:
        prefixo = Path(tmp) / "pg"
        subprocess.run(
            ["pdftoppm", "-f", str(pagina), "-l", str(pagina),
             "-r", str(DPI), "-gray", str(pdf), str(prefixo)],
            check=True,
            capture_output=True,
        )
        arquivos = sorted(Path(tmp).glob("pg*.pgm"))
        if not arquivos:
            return []
        largura, altura, pixels = le_pgm(arquivos[0])

    x0, x1 = max(0, int(x_ini * ESCALA)), min(largura, int(x_fim * ESCALA))
    if x1 <= x0:
        return []

    faixas = []
    inicio = None
    for y_pt in range(int(Y_TOPO), int(Y_RODAPE)):
        y = int(y_pt * ESCALA)
        if y >= altura:
            break
        base = y * largura
        tom = statistics.median(pixels[base + x0 : base + x1])
        separador = tom >= TOM_SEPARADOR
        if not separador and inicio is None:
            inicio = y_pt
        elif separador and inicio is not None:
            if y_pt - inicio >= ALTURA_MINIMA_FAIXA:
                faixas.append((inicio, y_pt))
            inicio = None
    if inicio is not None and Y_RODAPE - inicio >= ALTURA_MINIMA_FAIXA:
        faixas.append((inicio, int(Y_RODAPE)))
    return faixas


def fronteiras_de_coluna(xs):
    """Onde uma coluna acaba e a próxima começa, pelo alinhamento das linhas."""
    quantas = {}
    for x in xs:
        chave = round(x, 1)
        quantas[chave] = quantas.get(chave, 0) + 1
    reais = {x for x, n in quantas.items() if n >= MINIMO_POR_COLUNA}
    # A coluna do nome é sempre a mais à esquerda e existe em toda página, mas
    # numa página com dois medicamentos ela tem duas linhas e o mínimo acima a
    # descartava — aí a concentração era lida como parte do nome, e a
    # risperidona virava "1 mg/mL 1 mg risperidona 2 mg 3 mg".
    if quantas:
        reais.add(min(quantas))
    ordenados = sorted(reais)
    return [
        (a + b) / 2 for a, b in zip(ordenados, ordenados[1:]) if b - a > GAP_ENTRE_COLUNAS
    ]


def blocos_de_celula(linhas):
    """Junta as linhas de uma coluna que são a mesma célula. Devolve os textos."""
    blocos, atual = [], []
    for y, texto in sorted(linhas):
        if atual and y - atual[-1][0] > GAP_MESMA_CELULA:
            blocos.append(atual)
            atual = []
        atual.append((y, texto))
    if atual:
        blocos.append(atual)
    return [limpa(" ".join(t for _, t in bloco)) for bloco in blocos]


def itens_da_pagina(pdf: Path, pagina: int, avisos: list):
    linhas = [
        (y, x, t)
        for y, x, t in linhas_da_pagina(pdf, pagina)
        if Y_TOPO <= y <= Y_RODAPE and not RUIDO.match(t)
    ]
    if not linhas:
        return []

    # O traço de célula vazia atrapalha a busca das colunas: por ser
    # centralizado, começa 70 pt à direita do resto da coluna e inventa uma
    # coluna que não existe. Por isso a primeira tentativa o ignora.
    #
    # Só que há páginas — as das vacinas — em que *toda* a concentração é
    # traço. Ali ignorá-lo apaga a coluna inteira, e a página inteira se
    # perdia calada. Quando sobra coluna de menos, a conta refaz contando os
    # traços, que naquele caso são a única coisa que marca onde a coluna está.
    fronteiras = fronteiras_de_coluna([x for _, x, t in linhas if t != "-"])
    if len(fronteiras) < 2:
        fronteiras = fronteiras_de_coluna([x for _, x, _ in linhas])
    if len(fronteiras) < 2:
        return []

    def coluna_de(x):
        return sum(1 for f in fronteiras if x > f)

    # A faixa de fundo é lida na coluna do nome, que é onde a célula mesclada
    # de um medicamento se estende por todas as apresentações dele.
    faixas = faixas_de_fundo(pdf, pagina, 45.0, fronteiras[0])

    itens = []
    for topo, base in faixas:
        nomes, concentracoes, formas, norteadores = [], [], [], []
        for y, x, t in linhas:
            if not (topo <= y <= base):
                continue
            n = coluna_de(x)
            if n == 0:
                nomes.append((y, t))
            elif n == 1:
                concentracoes.append((y, t))
            elif n == 2:
                formas.append((y, t))
            elif n == 4:
                # "Documento norteador": os PCDTs, um por doença atendida.
                norteadores.append((y, t))

        nome = limpa(" ".join(t for _, t in sorted(nomes)))
        if not nome:
            continue

        blocos_conc = blocos_de_celula(concentracoes)
        blocos_forma = blocos_de_celula(formas)

        # Dentro de uma faixa, concentração e forma andam em par: a n-ésima
        # concentração é da n-ésima forma. Quando as contagens não batem, o
        # medicamento sai como aviso e fica de fora — publicar a apresentação
        # errada é pior do que faltar uma linha.
        if len(blocos_conc) != len(blocos_forma):
            avisos.append(
                f"pág. {pagina}: {nome} — {len(blocos_conc)} concentrações "
                f"para {len(blocos_forma)} formas"
            )
            continue

        condicoes = condicoes_do_norteador(
            limpa(" ".join(t for _, t in sorted(norteadores)))
        )
        for concentracao, forma in zip(blocos_conc, blocos_forma):
            itens.append((nome, concentracao, forma, condicoes))
    return itens


# A coluna traz os protocolos colados: "PCDT Artrite Reumatoide PCDT Artrite
# Idiopática Juvenil". O próprio PDF escreve "PDCT" em um deles, e a separação
# aceita as duas grafias.
SEPARA_PCDT = re.compile(r"\bP[CD]{2}T\b")


def condicoes_do_norteador(texto: str) -> list:
    """As doenças atendidas, a partir da coluna 'Documento norteador'."""
    if not texto:
        return []
    partes = [limpa(p).strip(" .;,") for p in SEPARA_PCDT.split(texto)]
    vistas, saida = set(), []
    for p in partes:
        if p and p not in vistas:
            vistas.add(p)
            saida.append(p)
    return saida


def codigos_atc(pdf: Path) -> dict:
    """
    O código ATC de cada medicamento, lido do Apêndice A.

    Devolve `nome como a RENAME escreve -> código`. Um medicamento pode ter
    mais de um código (usos diferentes); fica o primeiro, que é o do grupo em
    que a própria lista o classifica.
    """
    mapa = {}
    for pagina in range(APENDICE_ATC[0], APENDICE_ATC[1] + 1):
        linhas = [
            (y, x, t)
            for y, x, t in linhas_da_pagina(pdf, pagina)
            if Y_TOPO <= y <= Y_RODAPE and not RUIDO.match(t)
        ]
        if not linhas:
            continue
        fronteiras = fronteiras_de_coluna([x for _, x, t in linhas if t != "-"])
        if len(fronteiras) < 4:
            continue

        def coluna_de(x, fronteiras=fronteiras):
            return sum(1 for f in fronteiras if x > f)

        for topo, base in faixas_de_fundo(pdf, pagina, 45.0, fronteiras[0]):
            nomes, codigos = [], []
            for y, x, t in linhas:
                if not (topo <= y <= base):
                    continue
                n = coluna_de(x)
                if n == 0:
                    nomes.append((y, t))
                elif n == 4 and CODIGO_ATC.match(t.strip()):
                    codigos.append(t.strip())
            nome = limpa(" ".join(t for _, t in sorted(nomes)))
            if nome and codigos and nome not in mapa:
                mapa[nome] = codigos[0]
    return mapa


def principios(nome: str):
    """
    "amoxicilina + clavulanato de potássio" são dois princípios ativos.

    A associação é o que a fonte escreve com "+". Não se separa por vírgula:
    vírgula aparece dentro do nome botânico de fitoterápico.
    """
    return [p for p in (limpa(p) for p in nome.split("+")) if p]


def main() -> None:
    if len(sys.argv) > 1:
        pdf = Path(sys.argv[1])
        if not pdf.is_file():
            raise SystemExit(f"ERRO: não achei {pdf}")
        # Arquivo entregue à mão: a proveniência não pode afirmar de onde veio,
        # então registra o que se sabe — e quem rodar confere antes de publicar.
        fonte_nome, fonte_url = FONTES[0]
        print(f"usando {pdf} (confira que é o PDF de {fonte_url})")
    else:
        fonte_nome, fonte_url = baixa_pdf(COPIA)
        pdf = COPIA

    print("lendo os códigos ATC do Apêndice A...")
    atc = codigos_atc(pdf)
    print(f"  {len(atc)} medicamentos com código")

    itens, avisos = [], []
    for componente, primeira, ultima, titulo in ANEXOS:
        # Confere que a faixa de páginas ainda é a do anexo esperado. Numa
        # edição nova a paginação muda, e extrair a página errada seria pior
        # do que não extrair.
        cabecalho = " ".join(t for _, _, t in linhas_da_pagina(pdf, primeira)[:12])
        if titulo not in cabecalho:
            raise SystemExit(
                f"ERRO: esperava {titulo} na página {primeira}, achei outra coisa.\n"
                f"  A paginação do PDF mudou. Confira ANEXOS em scripts/extrai_rename.py."
            )

        antes = len(itens)
        for pagina in range(primeira, ultima + 1):
            for nome, concentracao, forma, condicoes in itens_da_pagina(pdf, pagina, avisos):
                # O traço é como a fonte escreve célula vazia: o medicamento
                # não tem concentração declarada. Vira ausência, não literal.
                if concentracao == "-":
                    concentracao = ""
                if not forma or forma == "-":
                    continue
                itens.append(
                    {
                        "texto": limpa(f"{nome} {concentracao} {forma}"),
                        "principios_ativos": principios(nome),
                        "forma_farmaceutica": forma,
                        "componente": componente,
                        "condicoes": condicoes,
                        "codigo_atc": atc.get(nome),
                    }
                )
        print(f"{titulo} ({componente}): {len(itens) - antes} itens")

    if avisos:
        print(f"\n{len(avisos)} fora, por concentração e forma em número diferente:")
        for a in avisos[:20]:
            print(f"  {a}")
        if len(avisos) > 20:
            print(f"  ... e mais {len(avisos) - 20}")

    if len(itens) < 700:
        raise SystemExit(
            f"\nERRO: só {len(itens)} itens. A RENAME tem cerca de mil — algo na\n"
            f"  extração falhou, e publicar uma lista pela metade diria a alguém\n"
            f"  que o SUS não tem um medicamento que tem."
        )

    dado = {
        "edicao": EDICAO,
        "itens": itens,
        "proveniencia": [
            {
                "fonte_nome": fonte_nome,
                "fonte_url": fonte_url,
                "fonte_arquivo": str(COPIA.relative_to(RAIZ / "data")) if COPIA.is_file() else None,
                "fonte_data": FONTE_DATA,
                "extraido_em": date.today().isoformat(),
                "verificado_em": date.today().isoformat(),
                "metodo": "automatica",
            }
        ],
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n{len(itens)} itens em {SAIDA.relative_to(RAIZ)}")
    print(f"Página oficial para conferir edição nova: {PAGINA_OFICIAL}")


if __name__ == "__main__":
    main()
