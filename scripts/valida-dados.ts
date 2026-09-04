/**
 * Valida todo o `data/` contra os schemas e relata o frescor de cada arquivo.
 *
 * Roda no CI e antes de qualquer merge. Sai com código 1 se algo não valida.
 */
import {
  carregaMedicamentos,
  carregaMunicipio,
  carregaRemume,
  carregaUnidades,
  listaMunicipios,
} from "../lib/dados";
import { dadoDesatualizado, dataPorExtenso } from "../lib/prazos";
import { revisaoValida } from "../lib/clinico";

let erros = 0;
let avisos = 0;

function erro(msg: string) {
  erros++;
  console.error(`ERRO  ${msg}`);
}

function aviso(msg: string) {
  avisos++;
  console.warn(`AVISO ${msg}`);
}

const municipios = listaMunicipios();
if (municipios.length === 0) {
  console.log("Nenhum município publicado ainda. Nada a validar em data/municipios.");
}

for (const id of municipios) {
  try {
    const municipio = carregaMunicipio(id);
    const unidades = carregaUnidades(id);
    const remume = carregaRemume(id);

    console.log(
      `${municipio.nome}/${municipio.uf}: ${remume.length} itens, ${unidades.length} unidades`,
    );
    if (remume.length === 0) {
      aviso(`${id}: sem remume.json. A busca não responde para esta cidade.`);
    }

    // Integridade entre arquivos: a REMUME não pode mandar ninguém para um tipo
    // de unidade que o município não tem.
    const tiposExistentes = new Set(unidades.map((u) => u.tipo));
    for (const item of remume) {
      for (const tipo of item.onde_retirar) {
        if (tipo !== "farmacia_popular" && !tiposExistentes.has(tipo)) {
          erro(`${id}: "${item.principio_ativo}" manda para "${tipo}", que não existe em unidades.json`);
        }
      }
    }

    // O frescor de um registro é o da fonte conferida há mais tempo.
    for (const registro of [municipio, ...unidades, ...remume]) {
      for (const fonte of registro.proveniencia) {
        if (dadoDesatualizado(fonte.verificado_em)) {
          aviso(
            `${id}: "${fonte.fonte_nome}" conferida pela última vez em ` +
              dataPorExtenso(fonte.verificado_em),
          );
        }
      }
    }
  } catch (e) {
    erro(e instanceof Error ? e.message : String(e));
  }
}

try {
  const fichas = carregaMedicamentos();
  const publicaveis = fichas.filter((f) => revisaoValida(f.revisao)).length;
  console.log(
    `Fichas editoriais: ${fichas.length} (${publicaveis} com revisão válida, ` +
      `${fichas.length - publicaveis} sem conteúdo clínico publicável)`,
  );
} catch (e) {
  erro(e instanceof Error ? e.message : String(e));
}

console.log(`\n${erros} erro(s), ${avisos} aviso(s).`);
process.exit(erros > 0 ? 1 : 0);
