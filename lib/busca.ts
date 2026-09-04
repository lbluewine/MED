/**
 * A busca precisa perdoar quem digita. Ver docs/STACK.md.
 *
 * O índice é montado no build e enviado pronto para o navegador, para a busca
 * funcionar sem servidor e sem esperar rede. Ele é pequeno: uma linha por
 * medicamento.
 */
import MiniSearch from "minisearch";

export type EntradaBusca = {
  id: string;
  nome: string;
  /** Nome comercial e de balcão. Quem chega digita o nome da caixa. */
  populares: string;
  tem_para_levar: boolean;
};

/** Tira acento e caixa alta. "ácido fólico" e "ACIDO FOLICO" viram o mesmo. */
export function normaliza(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const OPCOES = {
  fields: ["nome", "populares"],
  storeFields: ["nome", "tem_para_levar"],
  processTerm: (termo: string) => normaliza(termo),
  searchOptions: {
    /** "lozartana" acha "losartana": até 2 letras erradas em palavra longa. */
    fuzzy: 0.2,
    prefix: true,
    boost: { nome: 2 },
  },
};

export function montaIndice(entradas: EntradaBusca[]): MiniSearch<EntradaBusca> {
  const indice = new MiniSearch<EntradaBusca>(OPCOES);
  indice.addAll(entradas);
  return indice;
}

/** Recria no navegador o índice serializado no build, sem reindexar tudo. */
export function carregaIndice(serializado: string): MiniSearch<EntradaBusca> {
  return MiniSearch.loadJSON<EntradaBusca>(serializado, OPCOES);
}

export type Sugestao = { slug: string; nome: string; tem_para_levar: boolean };

/** No máximo 5 sugestões: mais que isso vira lista para ler, não atalho. */
export function sugere(
  indice: MiniSearch<EntradaBusca>,
  termo: string,
  limite = 5,
): Sugestao[] {
  if (!termo.trim()) return [];
  return indice
    .search(termo)
    .slice(0, limite)
    .map((r) => ({
      slug: String(r.id),
      nome: r.nome as string,
      tem_para_levar: r.tem_para_levar as boolean,
    }));
}
