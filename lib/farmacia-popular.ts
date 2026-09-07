/**
 * O elenco do Programa Farmácia Popular, e como ele cruza com a lista do
 * município.
 *
 * O que este arquivo pode afirmar: "o elenco federal traz este princípio
 * ativo". O que ele nunca afirma: que a apresentação da Farmácia Popular é a
 * mesma que a da REMUME, ou que a farmácia da esquina tem hoje. Por isso toda
 * tela mostra o item **como o Ministério escreve**, para a pessoa comparar com
 * a receita dela.
 *
 * O cruzamento é conservador de propósito: na dúvida, não casa. Um casamento
 * errado manda alguém à farmácia atrás de um medicamento que não está lá.
 */
import { carregaFarmaciaPopular, listaMunicipios } from "./dados";
import { conjuntoDePrincipios, rotuloCaixaAlta, semAcento } from "./nomes-medicamentos";
import { listaRemedios, paraSlug } from "./remedios";
import type { FarmaciaPopular, ItemFarmaciaPopular } from "./schema";

export type ItemPFPB = ItemFarmaciaPopular & { indicacao: string };

/** O elenco inteiro, ou `null` quando o arquivo não existe. */
export function elencoFarmaciaPopular(): FarmaciaPopular | null {
  return carregaFarmaciaPopular();
}

/** Quantos itens o elenco tem. Serve para os rótulos de navegação. */
export function totalFarmaciaPopular(): number {
  const elenco = carregaFarmaciaPopular();
  if (!elenco) return 0;
  return elenco.grupos.reduce((soma, g) => soma + g.itens.length, 0);
}

/**
 * Os itens do elenco federal que têm exatamente os mesmos princípios ativos
 * que este medicamento da lista municipal.
 *
 * Igualdade de conjunto, não interseção: "carbidopa + levodopa" não casa com
 * "levodopa + benserazida", ainda que as duas tenham levodopa. São
 * medicamentos diferentes e mandariam a pessoa buscar a caixa errada.
 */
export function itensDoPrincipio(principioAtivo: string): ItemPFPB[] {
  const elenco = carregaFarmaciaPopular();
  if (!elenco) return [];

  const alvo = conjuntoDePrincipios([principioAtivo]);
  if (!alvo) return [];

  const achados: ItemPFPB[] = [];
  for (const grupo of elenco.grupos) {
    for (const item of grupo.itens) {
      if (conjuntoDePrincipios(item.principios_ativos) === alvo) {
        achados.push({ ...item, indicacao: grupo.indicacao });
      }
    }
  }
  return achados;
}

/**
 * Um medicamento do programa, com todas as suas apresentações.
 *
 * A fonte lista uma linha por dose. Aqui as doses do mesmo princípio ativo
 * viram um item só, que é como a pessoa procura: ela quer "budesonida", não
 * "budesonida 32mcg" e "budesonida 50mcg" em separado.
 */
export type ItemDoPrograma = {
  slug: string;
  /** Os princípios ativos como a fonte escreve, juntos por "+". */
  nome: string;
  apresentacoes: ItemPFPB[];
  indicacoes: string[];
  /** Absorvente e fralda estão no programa e não são medicamento. */
  insumo: boolean;
};

/** Tudo o que o programa tem, um por princípio ativo. */
export function itensDoPrograma(): ItemDoPrograma[] {
  const elenco = carregaFarmaciaPopular();
  if (!elenco) return [];

  const porNome = new Map<string, ItemDoPrograma>();
  for (const grupo of elenco.grupos) {
    for (const item of grupo.itens) {
      const nome = item.principios_ativos.join(" + ");
      const slug = paraSlug(nome);
      const jaVisto = porNome.get(slug);
      if (jaVisto) {
        jaVisto.apresentacoes.push({ ...item, indicacao: grupo.indicacao });
        if (!jaVisto.indicacoes.includes(grupo.indicacao)) {
          jaVisto.indicacoes.push(grupo.indicacao);
        }
        continue;
      }
      porNome.set(slug, {
        slug,
        nome,
        apresentacoes: [{ ...item, indicacao: grupo.indicacao }],
        indicacoes: [grupo.indicacao],
        insumo: item.insumo,
      });
    }
  }
  return [...porNome.values()];
}

export function itemDoPrograma(slug: string): ItemDoPrograma | null {
  return itensDoPrograma().find((i) => i.slug === slug) ?? null;
}

/**
 * O que o programa tem e nenhuma cidade publicada tem na própria lista.
 *
 * São estes que ganham página própria: quem está na lista de um município já
 * tem a dele, com os locais de retirada e a receita que a cidade pede — e duas
 * páginas para o mesmo medicamento só dividiriam a atenção de quem procura.
 */
export function itensSemListaMunicipal(): ItemDoPrograma[] {
  const nasCidades = new Set<string>();
  for (const municipio of listaMunicipios()) {
    for (const remedio of listaRemedios(municipio)) {
      for (const item of itensDoPrincipio(remedio.nome)) nasCidades.add(item.texto);
    }
  }
  return itensDoPrograma().filter((i) =>
    i.apresentacoes.every((a) => !nasCidades.has(a.texto)),
  );
}

/**
 * Itens do elenco federal cujo nome bate com o que a pessoa digitou.
 *
 * Existe para o pior caso da busca: a pessoa procura um medicamento que a
 * cidade não tem, a tela diz "não achei" e ela vai embora — sem saber que o
 * programa federal tem. Aqui a comparação é por texto mesmo, sem tolerância a
 * erro de digitação: é uma segunda chance, não a busca principal.
 */
export function procuraNoElenco(termo: string): ItemPFPB[] {
  const elenco = carregaFarmaciaPopular();
  const alvo = semAcento(termo).toLowerCase().trim();
  if (!elenco || alvo.length < 3) return [];

  const achados: ItemPFPB[] = [];
  for (const grupo of elenco.grupos) {
    for (const item of grupo.itens) {
      const onde = semAcento(
        [item.texto, ...item.principios_ativos].join(" "),
      ).toLowerCase();
      if (onde.includes(alvo)) achados.push({ ...item, indicacao: grupo.indicacao });
    }
  }
  return achados;
}

/**
 * "HIPERTENSÃO" vira "Hipertensão". A fonte escreve tudo em caixa alta, o que
 * numa tela vira grito. O dado guardado continua o da fonte; isto é tipografia.
 */
export const rotuloIndicacao = rotuloCaixaAlta;
