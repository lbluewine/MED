/**
 * A RENAME (Relação Nacional de Medicamentos Essenciais): o piso que todo SUS
 * do Brasil garante, com ou sem lista própria de município.
 *
 * Igual ao elenco da Farmácia Popular, o cruzamento aqui é conservador: na
 * dúvida, não casa. Ver `lib/nomes-medicamentos.ts` para o porquê.
 */
import { carregaRename } from "./dados";
import { conjuntoDePrincipios, semAcento } from "./nomes-medicamentos";
import { paraSlug } from "./remedios";
import type { Componente, ItemRename } from "./schema";

/** A RENAME inteira, ou `null` quando o arquivo ainda não existe. */
export function rename(): ReturnType<typeof carregaRename> {
  return carregaRename();
}

/** Quantos itens a RENAME tem. Serve para rótulo de navegação. */
export function totalRename(): number {
  return carregaRename()?.itens.length ?? 0;
}

/**
 * Os itens da RENAME que têm exatamente os mesmos princípios ativos que este
 * medicamento — de uma REMUME municipal ou de qualquer outra fonte.
 *
 * Igualdade de conjunto, não interseção: mesmo critério de
 * `itensDoPrincipio` em `lib/farmacia-popular.ts`.
 */
export function itensRenameDoPrincipio(principioAtivo: string): ItemRename[] {
  const dado = carregaRename();
  if (!dado) return [];

  const alvo = conjuntoDePrincipios([principioAtivo]);
  if (!alvo) return [];

  return dado.itens.filter((item) => conjuntoDePrincipios(item.principios_ativos) === alvo);
}

/**
 * Busca por texto na RENAME — é a busca inteira de uma cidade sem REMUME
 * própria. Sem tolerância a erro de digitação (não há índice pré-computado
 * por cidade genérica ainda), só sem acento. Mesmo critério de
 * `procuraNoElenco` em `lib/farmacia-popular.ts`.
 */
export function procuraNaRename(termo: string): ItemRename[] {
  const dado = carregaRename();
  const alvo = semAcento(termo).toLowerCase().trim();
  if (!dado || alvo.length < 3) return [];

  return dado.itens.filter((item) =>
    semAcento([item.texto, ...item.principios_ativos].join(" "))
      .toLowerCase()
      .includes(alvo),
  );
}

/**
 * A RENAME agrupada por medicamento, como a REMUME em `lib/remedios.ts`.
 *
 * A unidade de navegação é o princípio ativo: quem chega digita "losartana",
 * não "losartana 50 mg comprimido". As apresentações são detalhes dentro dele.
 */
export type MedicamentoRename = {
  slug: string;
  /** O nome como a RENAME escreve, com acento e maiúscula. */
  nome: string;
  itens: ItemRename[];
  /** Em quais componentes ele aparece — é quem entrega e como se pede. */
  componentes: Componente[];
};

/**
 * O agrupamento é pelo nome sem acento e sem caixa, igual ao da REMUME: a
 * fonte escreve o mesmo medicamento de dois jeitos em alguns pontos, e isso é
 * só grafia.
 */
export function medicamentosRename(): MedicamentoRename[] {
  const dado = carregaRename();
  if (!dado) return [];

  const porSlug = new Map<string, MedicamentoRename>();
  for (const item of dado.itens) {
    const nome = item.principios_ativos.join(" + ");
    const slug = paraSlug(nome);
    if (!slug) continue;

    const atual = porSlug.get(slug);
    if (atual) {
      atual.itens.push(item);
      if (!atual.componentes.includes(item.componente)) {
        atual.componentes.push(item.componente);
      }
    } else {
      porSlug.set(slug, {
        slug,
        nome,
        itens: [item],
        componentes: [item.componente],
      });
    }
  }

  return [...porSlug.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Quantos medicamentos a RENAME tem, contando cada princípio ativo uma vez. */
export function totalMedicamentosRename(): number {
  return medicamentosRename().length;
}

/** Um medicamento da RENAME pelo slug, ou `null` quando não existe. */
export function medicamentoRename(slug: string): MedicamentoRename | null {
  return medicamentosRename().find((m) => m.slug === slug) ?? null;
}
