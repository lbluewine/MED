/**
 * Agrupa a lista do município por medicamento.
 *
 * Quem chega digita "losartana", não "losartana 50 mg comprimido". Então a
 * unidade de navegação do site é o princípio ativo, e as apresentações são
 * detalhes dentro dele.
 */
import { carregaMedicamentos, carregaNomesComerciais, carregaRemume } from "./dados";
import type { ItemRemume, Medicamento } from "./schema";

/** "Ácido fólico" -> "acido-folico" */
export function paraSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type Remedio = {
  slug: string;
  /** O nome como a fonte escreve, com acento e maiúscula. */
  nome: string;
  /**
   * O nome sem o sal, para caber ao lado da dose ("Enalapril 10 mg
   * comprimido"). Igual a `nome` sempre que encurtar criaria confusão — ver
   * `nomeCurtoSeguro`.
   */
  nome_curto: string;
  /** Todas as grafias que a fonte usa para este medicamento. */
  grafias: string[];
  /** Nome comercial e de balcão, quando existe ficha editorial. */
  nomes_populares: string[];
  apresentacoes: ItemRemume[];
  /** Existe alguma apresentação que a pessoa leva para casa? */
  tem_para_levar: boolean;
  ficha: Medicamento | null;
};

/**
 * O agrupamento é pelo nome sem acento e sem caixa. A fonte escreve o mesmo
 * medicamento de dois jeitos em alguns pontos ("Cloreto de sódio" e "Cloreto de
 * Sódio"), e isso é só grafia.
 *
 * O que a fonte escreve diferente de verdade continua separado: "Metronidazol"
 * e "Metronidazol (benzoilmetronidazol)" são medicamentos distintos, e juntá-los
 * seria decidir por conta própria que são a mesma coisa.
 */
/**
 * "Enalapril, maleato" -> "Enalapril". Só quando sobra um nome único.
 *
 * A lista tem casos em que o sal é o que separa dois medicamentos diferentes:
 * "Anfotericina B" aparece em três versões (complexo lipídico, desoxicolato e
 * lipossomal), e "Biperideno" em duas (cloridrato e lactato). Cortar ali
 * deixaria dois cartões com o mesmo título e nenhuma forma de saber qual é
 * qual. Nesses casos o nome fica inteiro.
 *
 * O sal grudado no nome, sem vírgula nem parêntese — "Losartana potássica" —
 * não é cortado: separar o que é sal do que é nome exige saber farmácia, e
 * chutar aqui é inventar dado.
 */
function nomeCurtoSeguro(nome: string, todos: string[]): string {
  const curto = nome.split(/[,(]/)[0]!.trim();
  if (curto === nome) return nome;
  const quantos = todos.filter((n) => n.split(/[,(]/)[0]!.trim() === curto).length;
  return quantos === 1 ? curto : nome;
}

export function listaRemedios(municipioId: string): Remedio[] {
  const fichas = new Map(carregaMedicamentos().map((f) => [f.slug, f]));
  const comerciais = new Map(
    (carregaNomesComerciais()?.itens ?? []).map((i) => [i.slug, i.nomes]),
  );
  const porSlug = new Map<string, { nomes: Set<string>; itens: ItemRemume[] }>();

  for (const item of carregaRemume(municipioId)) {
    const slug = paraSlug(item.principio_ativo);
    const atual = porSlug.get(slug) ?? { nomes: new Set<string>(), itens: [] };
    atual.nomes.add(item.principio_ativo);
    atual.itens.push(item);
    porSlug.set(slug, atual);
  }

  // O nome curto de um só depende de todos os outros, então a lista de nomes
  // precisa estar fechada antes.
  const todosOsNomes = [...porSlug.values()].map(
    (v) => [...v.nomes].sort((a, b) => a.localeCompare(b, "pt-BR"))[0]!,
  );

  const remedios: Remedio[] = [];
  for (const [slug, { nomes, itens }] of porSlug) {
    const grafias = [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const ficha = fichas.get(itens[0]?.slug_ficha ?? slug) ?? null;
    remedios.push({
      slug,
      nome: grafias[0]!,
      nome_curto: nomeCurtoSeguro(grafias[0]!, todosOsNomes),
      grafias,
      // O nome da caixa vem de dois lugares: a ficha editorial, quando existe,
      // e a lista de nomes comerciais. Os dois só servem para a busca achar.
      nomes_populares: [
        ...new Set([...(ficha?.nomes_populares ?? []), ...(comerciais.get(slug) ?? [])]),
      ],
      apresentacoes: itens,
      tem_para_levar: itens.some((a) => a.retirada === "leva_para_casa"),
      ficha,
    });
  }

  return remedios.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function buscaRemedio(municipioId: string, slug: string): Remedio | null {
  return listaRemedios(municipioId).find((r) => r.slug === slug) ?? null;
}
