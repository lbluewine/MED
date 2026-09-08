/**
 * Agrupa a lista do município pela classificação que a própria REMUME publica.
 *
 * O termo fica como a fonte escreve, sem tradução. Trocar "Antihipertensivo"
 * por "para pressão alta" seria escrever indicação terapêutica — conteúdo
 * clínico, que só sai com revisão farmacêutica (docs/CONTEUDO.md). A tela
 * mostra o que a lista diz e deixa a decisão com o médico.
 *
 * Classificação composta ("Antimicrobiano/ Antiparasitário") também fica
 * inteira. Quebrar em duas seria decidir por conta própria que a fonte quis
 * dizer duas coisas.
 */
import { listaRemedios, paraSlug, type Remedio } from "./remedios";

export type Classe = {
  slug: string;
  /** O termo como a REMUME escreve. */
  nome: string;
  remedios: Remedio[];
};

/**
 * Um medicamento entra na classe de cada apresentação sua. Na prática a fonte
 * repete a mesma classificação em todas, mas quando diverge é dado real e as
 * duas classes devem mostrá-lo.
 */
export function listaClasses(municipioId: string): Classe[] {
  const porSlug = new Map<string, { grafias: Set<string>; remedios: Map<string, Remedio> }>();

  for (const remedio of listaRemedios(municipioId)) {
    const termos = new Set(
      remedio.apresentacoes
        .map((a) => a.classificacao)
        .filter((c): c is string => c !== null),
    );
    for (const termo of termos) {
      const slug = paraSlug(termo);
      const atual = porSlug.get(slug) ?? {
        grafias: new Set<string>(),
        remedios: new Map<string, Remedio>(),
      };
      atual.grafias.add(termo);
      atual.remedios.set(remedio.slug, remedio);
      porSlug.set(slug, atual);
    }
  }

  return [...porSlug]
    .map(([slug, { grafias, remedios }]) => ({
      slug,
      // A fonte escreve o mesmo grupo de vários jeitos ("Analgésico Opioide",
      // "Analgésico opióide"). Junta como grafia, igual ao nome do medicamento, e
      // mostra sempre a mesma — senão o título mudaria conforme a ordem de
      // leitura do arquivo.
      nome: [...grafias].sort((a, b) => a.localeCompare(b, "pt-BR"))[0]!,
      remedios: [...remedios.values()],
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function buscaClasse(municipioId: string, slug: string): Classe | null {
  return listaClasses(municipioId).find((c) => c.slug === slug) ?? null;
}

/** Quantos medicamentos da lista a fonte não classificou. A tela precisa admitir isso. */
export function semClassificacao(municipioId: string): Remedio[] {
  return listaRemedios(municipioId).filter((r) =>
    r.apresentacoes.every((a) => a.classificacao === null),
  );
}
