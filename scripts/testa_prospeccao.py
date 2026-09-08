"""
Testa a triagem de scripts/prospecta_remume.py contra trechos reais de diário.

    python3 scripts/testa_prospeccao.py

Todo caso aqui saiu de um diário oficial de verdade, colhido na varredura dos
60 maiores municípios em 08/09/2026. Regra de triagem que muda sem passar por
estes casos volta a promover portaria de comissão como se fosse o ato que
publica a lista — foi exatamente o que aconteceu na primeira versão.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from prospecta_remume import classifica  # noqa: E402

CASOS = [
    # --- o ato que publica a lista -------------------------------------
    ("Jaboatão dos Guararapes, 2018-12-21",
     "PORTARIA Nº 094/2018. INSTITUIR A RELAÇÃO MUNICIPAL DE MEDICAMENTOS "
     "ESSENCIAIS/ REMUME – 2018/2019. A SECRETARIA MUNICIPAL DE SAÚDE, no uso "
     "de suas atribuições legais, CONSIDERANDO a necessidade de se efetuar a "
     "seleção de medicamentos", "ato"),
    ("Campos dos Goytacazes, 2026-06-30",
     "CMS no. 128/2026 Aprova a Relação Municipal de Medicamentos – REMUME "
     "2026/2028 O Plenário do Conselho Municipal de Saúde de Campos dos "
     "Goytacazes, em sua Reunião Ordinária", "ato"),
    ("forma clássica de decreto",
     "Fica aprovada a Relação Municipal de Medicamentos Essenciais - REMUME, "
     "na forma do Anexo I deste Decreto.", "ato"),
    ("ementa curta",
     "Aprova a REMUME do Município e dá outras providências", "ato"),

    # --- portaria de comissão, que não é o ato --------------------------
    ("Santos, 2022-08-08",
     "Prestar assessoria técnica à Comissão de Licitações e Seção de Compras "
     "da SMS; Atualizar a Relação Municipal de Medicamentos Essenciais – "
     "REMUME. Art. 3° A participação na Comissão não ensejará remuneração",
     "atribuicao"),
    ("Cuiabá, 2025-11-24",
     "Art. 3º - Compete à CFTP: I – Elaborar e manter atualizada a Relação "
     "Municipal de Medicamentos Essenciais (REMUME); II – Elaborar e revisar "
     "o Guia Farmacoterapêutico", "atribuicao"),
    ("São João de Meriti, 2023-03-20",
     "Fica criada a Comissão de Farmácia e Terapêutica da Secretaria "
     "Municipal de Saúde com as seguintes atribuições. a) Atualizar a Relação "
     "Municipal de Medicamentos (REMUME);", "atribuicao"),
    ("Manaus, 2025-10-17",
     "dispensação, prescrição, utilização e administração de medicamentos; "
     "3.1.2. Padronizar, promover e avaliar o uso seguro. 3.1.3. Elaborar e "
     "atualizar a Relação Municipal de Medicamentos Essenciais e o Formulário "
     "Terapêutico", "atribuicao"),
    ("São José dos Campos, 2023-10-31",
     "§ 2º - No âmbito operacional: • Revisar e atualizar a Relação Municipal "
     "de Medicamentos/Materiais - REMUME periodicamente; • Emitir parecer "
     "sobre as solicitações de inclusão", "atribuicao"),

    ("Santos, 2017-06-05",
     "III. Analisar e emitir parecer técnico em relação aos medicamentos de "
     "uso contínuo; IV. Prestar assessoria técnica à Comissão de Licitações; "
     "V. Atualizar a Relação Municipal de Medicamentos Essenciais",
     "atribuicao"),
    ("Cuiabá, 2023-05-10",
     "realizando a manutenção de todas as unidades de saúde nos 3 níveis de "
     "atenção do município. 13 - Implementar e atualizar a Relação Municipal "
     "de Medicamentos Essenciais", "atribuicao"),

    # --- compra, que é a maior parte do acervo --------------------------
    ("São Paulo, 2025-03-17",
     "PREGÃO ELETRÔNICO: 90161/2025 OBJETO: REGISTRO DE PREÇOS PARA "
     "FORNECIMENTO DE MEDICAMENTO PADRONIZADOS PELA RELAÇÃO MUNICIPAL DE "
     "MEDICAMENTOS ESSENCIAIS (REMUME/SP).", "licitacao"),
    ("São Paulo, 2025-03-07",
     "adjudicado e homologado por Autoridade Competente, destinado para "
     "REGISTRO DE PREÇOS PARA O FORNECIMENTO DE COLESTIRAMINA 4 G PO, "
     "PADRONIZADO PELA RELAÇÃO MUNICIPAL DE MEDICAMENTOS ESSENCIAIS "
     "(REMUME/SP)", "licitacao"),

    # --- só cita ---------------------------------------------------------
    ("São Paulo, 2025-03-21",
     "O metilfenidato 10 mg comprimido está padronizado na Relação Municipal "
     "de Medicamentos - REMUME/SMS-SP e disponível para dispensação nas "
     "unidades", "mencao"),
    ("Marília, 2026-08-28",
     "garantir a dispensação de medicamentos da Relação Municipal de "
     "Medicamentos (REMUME), a ser complementada por farmácias privadas",
     "mencao"),
]


def main() -> None:
    falhas = 0
    for origem, trecho, esperado in CASOS:
        obtido = classifica([trecho])
        if obtido != esperado:
            falhas += 1
            print(f"FALHOU  {origem}")
            print(f"        esperado {esperado}, veio {obtido}")
            print(f"        {trecho[:110]}…")
    print(f"{len(CASOS) - falhas}/{len(CASOS)} casos passaram")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
