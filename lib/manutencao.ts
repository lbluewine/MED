/**
 * O que precisa de atenção humana, calculado no build a partir de `data/`.
 *
 * Alimenta a página `/dev`. Não é uma segunda validação: `npm run valida-dados`
 * continua sendo quem derruba o build. Isto responde outra pergunta — "o que
 * está esperando alguém fazer" —, e para cada resposta entrega o comando que
 * resolve, porque site estático não executa nada.
 */
import {
  carregaCatalogoPrefeituras,
  carregaEstadoDasFontes,
  carregaFarmaciasPopulares,
  carregaMedicamentos,
  carregaMunicipio,
  carregaNomesComerciais,
  carregaRemume,
  carregaRename,
  carregaUnidades,
  carregaUnidadesCnes,
  listaMunicipios,
} from "./dados";
import { dadoDesatualizado, dataPorExtenso } from "./prazos";
import { revisaoValida } from "./clinico";

/**
 * `erro` é dado que pode enganar alguém agora. `atencao` é trabalho pendente
 * que ainda não engana ninguém. `nota` é o que se sabe e se aceita — dívida
 * registrada, não esquecida.
 */
export type Gravidade = "erro" | "atencao" | "nota";

export type Pendencia = {
  id: string;
  gravidade: Gravidade;
  titulo: string;
  detalhe: string;
  /** O comando que resolve. Nulo quando a solução não é um comando. */
  comando: string | null;
};

export type Cobertura = {
  rotulo: string;
  valor: string;
  nota: string | null;
};

const SITUACAO_REMUME: Record<string, { texto: string; grave: boolean }> = {
  mudou_de_lugar: {
    texto: "o endereço respondeu, mas não devolveu a lista — o caminho do arquivo mudou",
    grave: true,
  },
  fora_do_ar: { texto: "o endereço do documento não respondeu", grave: true },
  nao_achado: {
    texto: "a listagem respondeu e nenhum link casou com a regra",
    grave: true,
  },
  so_no_diario: {
    texto: "a lista não está no site da prefeitura; há um ato no diário oficial",
    grave: false,
  },
  sem_pista: {
    texto: "não há link, listagem nem ato no diário — resta pedir pela LAI",
    grave: false,
  },
};

export function pendencias(): Pendencia[] {
  const lista: Pendencia[] = [];
  const municipios = listaMunicipios();

  // --- fontes -------------------------------------------------------------
  const estado = carregaEstadoDasFontes();
  if (estado === null) {
    lista.push({
      id: "fontes-sem-conferencia",
      gravidade: "atencao",
      titulo: "A conferência automática nunca rodou",
      detalhe:
        "Sem ela, ninguém sabe se os documentos de origem ainda são os que o " +
        "site publica, e a página /fontes fica vazia.",
      comando: "npm run verifica-fontes",
    });
  } else {
    for (const fonte of estado.fontes) {
      if (fonte.situacao === "fora_do_ar") {
        lista.push({
          id: `fonte-fora-do-ar-${fonte.id}`,
          gravidade: "erro",
          titulo: `A fonte “${fonte.descricao}” não respondeu`,
          detalhe:
            "O dado continua no ar sem que se possa confirmar que ainda é o " +
            "válido. Pode ser que a prefeitura tenha mudado o endereço.",
          comando: "npm run verifica-fontes",
        });
      }
      if (fonte.situacao === "mudou") {
        lista.push({
          id: `fonte-mudou-${fonte.id}`,
          gravidade: "atencao",
          titulo: `A fonte “${fonte.descricao}” mudou`,
          detalhe:
            "O documento novo já está guardado. Falta alguém revisar o diff " +
            "item a item e dar merge — robô não publica dado sozinho.",
          comando: null,
        });
      }
      if (
        fonte.conferida_em !== null &&
        dadoDesatualizado(fonte.conferida_em) &&
        fonte.situacao !== "fora_do_ar"
      ) {
        lista.push({
          id: `fonte-velha-${fonte.id}`,
          gravidade: "atencao",
          titulo: `“${fonte.descricao}” não é conferida desde ${dataPorExtenso(fonte.conferida_em)}`,
          detalhe:
            "Passou de 90 dias. As páginas que usam esta fonte já mostram o " +
            "aviso de dado desatualizado a quem lê.",
          comando: "npm run verifica-fontes",
        });
      }
    }
  }

  // --- a REMUME no site de cada prefeitura --------------------------------
  const catalogo = carregaCatalogoPrefeituras();
  if (catalogo === null) {
    lista.push({
      id: "sem-catalogo",
      gravidade: "atencao",
      titulo: "O catálogo de prefeituras ainda não foi montado",
      detalhe:
        "É o mapa de onde cada prefeitura publica a lista dela. Sem ele não há " +
        "como conferir se um link morreu.",
      comando: "npm run catalogo-prefeituras -- --da-prospeccao",
    });
  } else {
    for (const p of catalogo.prefeituras) {
      const situacao = p.remume?.situacao;
      if (!situacao || situacao === "no_lugar") continue;
      const s = SITUACAO_REMUME[situacao];
      if (!s) continue;
      lista.push({
        id: `remume-${p.slug}`,
        gravidade: s.grave ? "erro" : "atencao",
        titulo: `A REMUME de ${p.nome}/${p.uf} saiu do lugar`,
        detalhe: `${s.texto}. ${p.url ?? "Sem site conhecido"}`,
        comando: `npm run acha-remume -- ${p.slug}`,
      });
    }

    const semSite = catalogo.prefeituras.filter((p) => p.confirmacao === "nenhuma");
    if (semSite.length > 0) {
      lista.push({
        id: "prefeituras-sem-site",
        gravidade: "nota",
        titulo: `${semSite.length} prefeitura(s) sem site confirmado`,
        detalhe:
          `O padrão cidade.uf.gov.br não pegou: ` +
          semSite
            .slice(0, 8)
            .map((p) => `${p.nome}/${p.uf}`)
            .join(", ") +
          `${semSite.length > 8 ? ", …" : ""}. ` +
          "Abreviação de prefeitura só uma pessoa resolve — escreva o domínio " +
          "no catálogo com confirmacao: \"manual\".",
        comando: null,
      });
    }
  }

  // --- cada município publicado -------------------------------------------
  for (const id of municipios) {
    const municipio = carregaMunicipio(id);
    const nome = `${municipio.nome}/${municipio.uf}`;

    if (carregaUnidadesCnes(id) === null) {
      lista.push({
        id: `cnes-${id}`,
        gravidade: "atencao",
        titulo: `${nome} não tem a rede de saúde do CNES`,
        detalhe:
          "O cadastro federal traz endereço, telefone e coordenada de toda " +
          "unidade da cidade, e não depende do site da prefeitura.",
        comando: `npm run baixa-cnes -- ${id} && npm run extrai-cnes -- ${id}`,
      });
    }

    if (carregaFarmaciasPopulares(id) === null) {
      lista.push({
        id: `pfpb-${id}`,
        gravidade: "nota",
        titulo: `${nome} não tem a rede credenciada do Farmácia Popular`,
        detalhe:
          "Sem ela a página do programa mostra só o link do painel do " +
          "Ministério, em vez de uma lista pela metade. É opcional de propósito.",
        comando: "node scripts/extrai-farmacias-pfpb.mjs",
      });
    }

    if (carregaRemume(id).length === 0) {
      lista.push({
        id: `remume-vazia-${id}`,
        gravidade: "erro",
        titulo: `${nome} não tem lista de medicamentos`,
        detalhe: "A busca não responde para esta cidade.",
        comando: null,
      });
    }

    if (municipio.telefone_assistencia_farmaceutica === null) {
      lista.push({
        id: `telefone-${id}`,
        gravidade: "nota",
        titulo: `${nome} não tem telefone da assistência farmacêutica`,
        detalhe:
          "É o número que o aviso de dado desatualizado oferece a quem lê. Sem " +
          "ele, o aviso manda a pessoa procurar “a unidade”.",
        comando: null,
      });
    }
  }

  // --- conteúdo e dívidas conhecidas --------------------------------------
  const nomes = carregaNomesComerciais();
  if (nomes && !nomes.proveniencia.conferido_na_anvisa) {
    lista.push({
      id: "nomes-comerciais",
      gravidade: "nota",
      titulo: "Os nomes comerciais não foram conferidos na Anvisa",
      detalhe:
        "Servem só para a busca achar o princípio ativo; nenhuma tela afirma " +
        "que o medicamento é vendido com esses nomes. O pior caso é uma busca " +
        "que não acha.",
      comando: null,
    });
  }

  const fichas = carregaMedicamentos();
  const semRevisao = fichas.filter((f) => !revisaoValida(f.revisao)).length;
  if (fichas.length === 0) {
    lista.push({
      id: "sem-fichas",
      gravidade: "nota",
      titulo: "Nenhuma ficha editorial publicada",
      detalhe:
        "Conteúdo clínico é v1 e exige revisão farmacêutica registrada. " +
        "Até lá, as páginas mostram só o que tem fonte e o link para a bula.",
      comando: null,
    });
  } else if (semRevisao > 0) {
    lista.push({
      id: "fichas-sem-revisao",
      gravidade: "atencao",
      titulo: `${semRevisao} ficha(s) sem revisão farmacêutica válida`,
      detalhe: "Os campos clínicos delas não são renderizados.",
      comando: null,
    });
  }

  const ordem: Record<Gravidade, number> = { erro: 0, atencao: 1, nota: 2 };
  return lista.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);
}

export function cobertura(): Cobertura[] {
  const municipios = listaMunicipios();
  const rename = carregaRename();
  const catalogo = carregaCatalogoPrefeituras();

  const itens = municipios.reduce((n, id) => n + carregaRemume(id).length, 0);
  const unidades = municipios.reduce((n, id) => n + carregaUnidades(id).length, 0);
  const cnesSus = municipios.reduce((n, id) => {
    const c = carregaUnidadesCnes(id);
    return n + (c ? c.unidades.filter((u) => u.atende_sus).length : 0);
  }, 0);
  const comRemumeLocalizada = (catalogo?.prefeituras ?? []).filter(
    (p) => p.remume?.situacao === "no_lugar",
  ).length;

  return [
    {
      rotulo: "Municípios com lista própria",
      valor: String(municipios.length),
      nota: municipios.join(", ") || null,
    },
    { rotulo: "Itens nas listas municipais", valor: String(itens), nota: null },
    {
      rotulo: "Unidades de dispensação",
      valor: String(unidades),
      nota: "de onde retirar — vem da prefeitura",
    },
    {
      rotulo: "Estabelecimentos do SUS no CNES",
      valor: String(cnesSus),
      nota: "que unidades existem — vem do cadastro federal",
    },
    {
      rotulo: "Apresentações na RENAME",
      valor: rename ? String(rename.itens.length) : "0",
      nota: "piso nacional, vale para as 5.570 cidades",
    },
    {
      rotulo: "Prefeituras no catálogo",
      valor: String(catalogo?.prefeituras.length ?? 0),
      nota: `${comRemumeLocalizada} com a REMUME localizada`,
    },
  ];
}
