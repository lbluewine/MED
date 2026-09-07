/**
 * Lista as grafias que o cruzamento com a lista nacional não resolveu sozinho.
 *
 * O site cruza a lista de cada município com a RENAME por nome, e cada
 * prefeitura escreve à sua maneira. As regras de `lib/nomes-medicamentos.ts`
 * cobrem os padrões conhecidos; o que sobra precisa de gente olhando, e é isso
 * que este relatório junta.
 *
 * Sem ele, o que não casa some calado: a lista A–Z mostra o mesmo medicamento
 * duas vezes, uma como da prefeitura e outra como do piso nacional, e ninguém
 * percebe. Com uma cidade eram 52 nomes; com as 295 de Santa Catarina, revisar
 * isso a olho não é possível.
 *
 * O relatório propõe, quem cuida do site decide. Nada aqui altera dado: as
 * decisões vão à mão para `data/nacional/nomes-equivalentes.json`, cada uma
 * com quem conferiu. É a regra 3 do `CLAUDE.md`.
 *
 * Rodar:
 *
 *     npx tsx scripts/revisa-equivalencias.ts            # todas as cidades
 *     npx tsx scripts/revisa-equivalencias.ts sc-criciuma
 */
import { listaMunicipios } from "../lib/dados";
import { chavesDeBusca, conferidoForaDaRename } from "../lib/equivalencias";
import { semAcento } from "../lib/nomes-medicamentos";
import { listaRemedios } from "../lib/remedios";
import { medicamentosRename } from "../lib/rename";

/** Quantos nomes parecidos sugerir por grafia sem par. */
const QUANTAS_SUGESTOES = 3;

/**
 * Palavras que carregam o sentido do nome, para procurar parecidos.
 *
 * Sugestão não é decisão: serve para a pessoa não ter de varrer 513 nomes à
 * mão. Casar por semelhança automaticamente levaria alguém ao medicamento
 * errado, e é por isso que isto só imprime.
 */
function palavras(nome: string): string[] {
  return semAcento(nome)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((p) => p.length >= 5);
}

function parecidos(nome: string, candidatos: string[]): string[] {
  const alvo = new Set(palavras(nome));
  if (alvo.size === 0) return [];
  return candidatos
    .map((c) => {
      const dele = palavras(c);
      const comuns = dele.filter((p) => alvo.has(p)).length;
      return { nome: c, comuns };
    })
    .filter((x) => x.comuns > 0)
    .sort((a, b) => b.comuns - a.comuns)
    .slice(0, QUANTAS_SUGESTOES)
    .map((x) => x.nome);
}

function main(): void {
  const pedidas = process.argv.slice(2);
  const cidades = pedidas.length > 0 ? pedidas : listaMunicipios();
  if (cidades.length === 0) {
    console.log("Nenhum município publicado ainda.");
    return;
  }

  const nacionais = medicamentosRename();
  const nomesNacionais = nacionais.map((m) => m.nome);
  const chavesNacionais = new Set(
    nacionais.flatMap((m) => chavesDeBusca(m.nome)).filter((c) => c.length > 0),
  );

  let totalSemPar = 0;
  for (const cidade of cidades) {
    const municipais = listaRemedios(cidade);
    const semPar = municipais.filter(
      (r) =>
        !chavesDeBusca(r.nome).some((c) => chavesNacionais.has(c)) &&
        // Já conferido: alguém olhou e concluiu que não está na RENAME.
        !conferidoForaDaRename(r.nome),
    );
    totalSemPar += semPar.length;

    const pct = municipais.length
      ? Math.round((semPar.length / municipais.length) * 100)
      : 0;
    console.log(
      `\n=== ${cidade} — ${semPar.length} de ${municipais.length} sem par na RENAME (${pct}%) ===`,
    );
    if (semPar.length === 0) {
      console.log("  nada a revisar");
      continue;
    }

    for (const r of semPar) {
      const sugestoes = parecidos(r.nome, nomesNacionais);
      console.log(`\n  ${r.nome}`);
      if (sugestoes.length === 0) {
        console.log("     sem parecido na RENAME — provavelmente não está mesmo");
      } else {
        for (const s of sugestoes) console.log(`     parecido: ${s}`);
      }
    }
  }

  if (totalSemPar > 0) {
    console.log(
      `\n\n${totalSemPar} grafia(s) esperando revisão.` +
        `\nPara cada uma, acrescente uma entrada em data/nacional/nomes-equivalentes.json:` +
        `\n` +
        `\n  {` +
        `\n    "grafia": "como a lista do município escreve",` +
        `\n    "onde": "sc-criciuma",` +
        `\n    "canonico": "o mesmo medicamento na RENAME, ou null se não estiver nela",` +
        `\n    "codigo_atc": null,` +
        `\n    "revisado_por": "seu nome",` +
        `\n    "revisado_em": "AAAA-MM-DD",` +
        `\n    "observacao": null` +
        `\n  }` +
        `\n` +
        `\nUm "canonico": null também é resposta — o nome sai do relatório e ninguém` +
        `\nprecisa conferir de novo na próxima importação.`,
    );
  }
}

main();
