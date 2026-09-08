# data/

O banco de dados deste projeto. Arquivos JSON versionados, validados por Zod no
build. Dado inválido derruba o build.

**Está vazio de propósito.** Nenhum dado de saúde entra aqui sem vir de um
documento público, com o bloco `proveniencia` preenchido e a cópia do documento
de origem guardada em `fontes/`. Ver `docs/DADOS.md`.

Estrutura esperada:

```
municipios/sc-criciuma/municipio.json
municipios/sc-criciuma/unidades.json        # onde retirar — da prefeitura
municipios/sc-criciuma/unidades-cnes.json   # que unidades existem — do CNES
municipios/sc-criciuma/remume.json
estados/sc/ceaf.json
nacional/medicamentos.json
fontes/sc-criciuma/remume-AAAA-MM.pdf
```

Para conferir o que já está publicado:

```
npm run valida-dados
```
