/**
 * Agrupa a lista do município por remédio.
 *
 * Quem chega digita "losartana", não "losartana 50 mg comprimido". Então a
 * unidade de navegação do site é o princípio ativo, e as apresentações são
 * detalhes dentro dele.
 */
import { carregaMedicamentos, carregaRemume } from "./dados";
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
  /** Todas as grafias que a fonte usa para este remédio. */
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
 * remédio de dois jeitos em alguns pontos ("Cloreto de sódio" e "Cloreto de
 * Sódio"), e isso é só grafia.
 *
 * O que a fonte escreve diferente de verdade continua separado: "Metronidazol"
 * e "Metronidazol (benzoilmetronidazol)" são remédios distintos, e juntá-los
 * seria decidir por conta própria que são a mesma coisa.
 */
export function listaRemedios(municipioId: string): Remedio[] {
  const fichas = new Map(carregaMedicamentos().map((f) => [f.slug, f]));
  const porSlug = new Map<string, { nomes: Set<string>; itens: ItemRemume[] }>();

  for (const item of carregaRemume(municipioId)) {
    const slug = paraSlug(item.principio_ativo);
    const atual = porSlug.get(slug) ?? { nomes: new Set<string>(), itens: [] };
    atual.nomes.add(item.principio_ativo);
    atual.itens.push(item);
    porSlug.set(slug, atual);
  }

  const remedios: Remedio[] = [];
  for (const [slug, { nomes, itens }] of porSlug) {
    const grafias = [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const ficha = fichas.get(itens[0]?.slug_ficha ?? slug) ?? null;
    remedios.push({
      slug,
      nome: grafias[0]!,
      grafias,
      nomes_populares: ficha?.nomes_populares ?? [],
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
