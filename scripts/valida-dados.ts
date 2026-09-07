/**
 * Valida todo o `data/` contra os schemas e relata o frescor de cada arquivo.
 *
 * Roda no CI e antes de qualquer merge. Sai com código 1 se algo não valida.
 */
import {
  carregaCadastroMunicipiosIbge,
  carregaNomesEquivalentes,
  carregaCeaf,
  carregaFarmaciasPopulares,
  carregaMedicamentos,
  carregaMunicipio,
  carregaNomesComerciais,
  carregaRename,
  carregaRemume,
  carregaUnidades,
  listaMunicipios,
} from "../lib/dados";
import { listaRemedios } from "../lib/remedios";
import {
  elencoFarmaciaPopular,
  itensDoPrincipio,
} from "../lib/farmacia-popular";
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
  const ceaf = carregaCeaf("sc");
  if (ceaf === null) {
    aviso("sem data/estados/sc/ceaf.json. O guia de alto custo fica sem lista.");
  } else {
    const semDocumento = ceaf.condicoes.filter((c) => c.documentos.length === 0);
    const total = ceaf.condicoes.reduce((n, c) => n + c.documentos.length, 0);
    console.log(
      `CEAF ${ceaf.uf}: ${ceaf.condicoes.length} condições, ${total} documentos, ` +
        `${ceaf.documentos_gerais.length} formulários padrão`,
    );
    for (const c of semDocumento) {
      aviso(`CEAF: "${c.nome}" não tem documento publicado na fonte.`);
    }
  }
} catch (e) {
  erro(e instanceof Error ? e.message : String(e));
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

try {
  const comerciais = carregaNomesComerciais();
  if (comerciais) {
    const total = comerciais.itens.reduce((n, i) => n + i.nomes.length, 0);
    console.log(
      `Nomes comerciais: ${total} para ${comerciais.itens.length} medicamento(s)`,
    );

    // Um slug sem medicamento correspondente é nome comercial que nunca vai ser
    // encontrado: entrou errado ou a lista do município mudou embaixo dele.
    const conhecidos = new Set(
      listaMunicipios().flatMap((m) => listaRemedios(m).map((r) => r.slug)),
    );
    for (const i of comerciais.itens) {
      if (!conhecidos.has(i.slug)) {
        erro(`Nomes comerciais: "${i.slug}" não existe na lista de nenhum município.`);
      }
    }

    if (!comerciais.proveniencia.conferido_na_anvisa) {
      aviso(
        "Nomes comerciais: a lista ainda não foi conferida na Anvisa. " +
          `Origem: ${comerciais.proveniencia.origem}`,
      );
    }
  }
} catch (e) {
  erro(e instanceof Error ? e.message : String(e));
}

try {
  const popular = elencoFarmaciaPopular();
  if (popular === null) {
    aviso("sem data/nacional/farmacia-popular.json. Nenhuma tela cita o programa.");
  } else {
    const total = popular.grupos.reduce((n, g) => n + g.itens.length, 0);

    // Quantos itens do elenco federal também estão na lista de algum município.
    // É o número que dá sentido ao cruzamento: se cair para zero de um dia
    // para o outro, alguma fonte mudou o jeito de escrever os nomes e o
    // cruzamento parou de casar em silêncio.
    const casados = new Set(
      listaMunicipios().flatMap((m) =>
        listaRemedios(m).flatMap((r) => itensDoPrincipio(r.nome).map((i) => i.texto)),
      ),
    );
    console.log(
      `Farmácia Popular: ${total} itens em ${popular.grupos.length} indicações, ` +
        `${casados.size} também na lista de algum município`,
    );

    if (listaMunicipios().length > 0 && casados.size === 0) {
      erro(
        "Farmácia Popular: nenhum item casou com a lista de nenhum município. " +
          "O cruzamento de princípios ativos provavelmente quebrou.",
      );
    }

    for (const grupo of popular.grupos) {
      for (const item of grupo.itens) {
        if (item.principios_ativos.length === 0) {
          erro(`Farmácia Popular: "${item.texto}" ficou sem princípio ativo.`);
        }
      }
    }

    for (const id of listaMunicipios()) {
      const credenciadas = carregaFarmaciasPopulares(id);
      if (credenciadas === null) {
        aviso(
          `${id}: sem farmacias-populares.json. A página do programa mostra só ` +
            "o link do painel do Ministério. Ver data/fontes/FONTES.md.",
        );
        continue;
      }
      if (credenciadas.municipio_id !== id) {
        erro(
          `${id}: farmacias-populares.json diz ser de "${credenciadas.municipio_id}".`,
        );
      }
      const fonte = credenciadas.proveniencia[0]!;
      const comEndereco = credenciadas.farmacias.filter((f) => f.cep).length;
      const noMapa = credenciadas.farmacias.filter((f) => f.geo).length;
      const divergencias = credenciadas.farmacias.filter(
        (f) => f.divergencias.length > 0,
      ).length;
      console.log(
        `Farmácias credenciadas em ${id}: ${credenciadas.farmacias.length} ` +
          `(painel de ${fonte.fonte_data}, conferido em ${fonte.verificado_em}; ` +
          `${comEndereco} com endereço completo pelo CNPJ, ${noMapa} no mapa, ` +
          `${divergencias} com divergência entre as fontes)`,
      );

      // Sem o cruzamento por CNPJ o endereço é só o nome da rua, e nome de rua
      // não leva ninguém à porta. Não é erro de dado, é dado pela metade.
      const semEndereco = credenciadas.farmacias.length - comEndereco;
      if (semEndereco > 0) {
        aviso(
          `${id}: ${semEndereco} farmácia(s) sem endereço completo. Rode ` +
            "node scripts/completa-cnpj-farmacias.mjs.",
        );
      }
      if (dadoDesatualizado(fonte.verificado_em)) {
        aviso(
          `${id}: a lista de farmácias credenciadas não é conferida desde ` +
            `${dataPorExtenso(fonte.verificado_em)}. A rede muda com o tempo.`,
        );
      }
    }
  }
} catch (e) {
  erro(e instanceof Error ? e.message : String(e));
}

const cadastro = carregaCadastroMunicipiosIbge();
if (cadastro) {
  console.log(
    `Cadastro de municípios (IBGE): ${cadastro.municipios.length} — universo ` +
      "do seletor de cidade, não é dado de saúde.",
  );
} else {
  aviso("Cadastro de municípios do IBGE ausente — rode node scripts/baixa-municipios-ibge.mjs.");
}

const equivalencias = carregaNomesEquivalentes();
if (equivalencias) {
  const total = equivalencias.equivalencias.length;
  const foraDaRename = equivalencias.equivalencias.filter((e) => e.canonico === null).length;
  console.log(
    `Grafias equivalentes revisadas: ${total} ` +
      `(${total - foraDaRename} casam com a RENAME, ${foraDaRename} conferidas fora dela). ` +
      "Rode npm run revisa-equivalencias para ver o que falta.",
  );
}

const rename = carregaRename();
if (rename) {
  console.log(
    `RENAME (${rename.edicao}): ${rename.itens.length} itens — piso nacional ` +
      "para cidade sem REMUME própria.",
  );
} else {
  aviso(
    "RENAME ausente — cidade sem REMUME própria não responde 'tem no SUS' " +
      "ainda. Ver docs/ROADMAP.md, v2.",
  );
}

console.log(`\n${erros} erro(s), ${avisos} aviso(s).`);
process.exit(erros > 0 ? 1 : 0);
