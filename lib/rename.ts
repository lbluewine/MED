/**
 * A RENAME (Relação Nacional de Medicamentos Essenciais): o piso que todo SUS
 * do Brasil garante, com ou sem lista própria de município.
 *
 * Igual ao elenco da Farmácia Popular, o cruzamento aqui é conservador: na
 * dúvida, não casa. Ver `lib/nomes-medicamentos.ts` para o porquê.
 */
import { carregaRename } from "./dados";
import { conjuntoDePrincipios, semAcento } from "./nomes-medicamentos";
import type { ItemRename } from "./schema";

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
