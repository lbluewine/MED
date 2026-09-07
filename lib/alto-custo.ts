/**
 * O alto custo visto pelo medicamento, e não pela doença.
 *
 * A lista do CEAF é organizada por doença, porque é assim que o estado publica
 * os papéis. Só que quem chega tem o nome do medicamento na receita, não o
 * nome do protocolo — e procurar "adalimumabe" numa lista de 110 doenças não
 * funciona. Aqui a chave é o medicamento, e a doença é o que ele abre.
 *
 * A ligação medicamento → doença vem da RENAME, da coluna "Documento
 * norteador" do Anexo III: cada linha ali é um PCDT, o protocolo do Ministério
 * para aquela doença. Nada aqui deduz para que serve um medicamento — é o que
 * a fonte federal escreve.
 */
import { carregaCeaf } from "./dados";
import { semAcento } from "./nomes-medicamentos";
import { medicamentosRename } from "./rename";
import { paraSlug } from "./remedios";

/** Uma doença que este medicamento atende, e onde ver os papéis dela. */
export type CondicaoDoMedicamento = {
  /** O nome como a RENAME escreve. */
  nome: string;
  /**
   * O slug da condição no CEAF do estado, quando as duas fontes escrevem a
   * doença do mesmo jeito. Nulo quando não dá para casar com segurança: a
   * tela mostra o nome sem link, em vez de mandar a pessoa aos papéis de
   * outra doença.
   */
  slugCeaf: string | null;
};

export type MedicamentoAltoCusto = {
  slug: string;
  nome: string;
  /** As apresentações, já sem o nome na frente. */
  apresentacoes: string[];
  condicoes: CondicaoDoMedicamento[];
};

function chave(nome: string): string {
  return semAcento(nome)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Os medicamentos de alto custo, em ordem alfabética, com as doenças de cada.
 *
 * `uf` serve só para ligar a doença aos papéis do estado. A lista de
 * medicamentos é a federal e não muda de um estado para outro.
 */
export function medicamentosAltoCusto(uf?: string): MedicamentoAltoCusto[] {
  const ceaf = uf ? carregaCeaf(uf.toLowerCase()) : null;

  /*
    Duas formas de casar, as duas conservadoras. A exata resolve a maioria; a
    por prefixo pega o caso em que o estado detalha mais que a lista federal
    ("Anemia na Doença Renal Crônica" vira "... - Alfaepoetina" em SC). Um
    nome que não bate de nenhum dos dois jeitos fica sem link.
  */
  const porNome = new Map<string, string>();
  for (const c of ceaf?.condicoes ?? []) porNome.set(chave(c.nome), c.slug);

  const achaCeaf = (nome: string): string | null => {
    const alvo = chave(nome);
    const exato = porNome.get(alvo);
    if (exato) return exato;
    for (const [nomeCeaf, slug] of porNome) {
      if (nomeCeaf.startsWith(`${alvo} `)) return slug;
    }
    return null;
  };

  const saida: MedicamentoAltoCusto[] = [];
  for (const m of medicamentosRename()) {
    const doAltoCusto = m.itens.filter((i) => i.componente === "especializado");
    if (doAltoCusto.length === 0) continue;

    const nomes: string[] = [];
    for (const item of doAltoCusto) {
      for (const c of item.condicoes) if (!nomes.includes(c)) nomes.push(c);
    }
    if (nomes.length === 0) continue;

    saida.push({
      slug: paraSlug(m.nome),
      nome: m.nome,
      apresentacoes: doAltoCusto.map((i) =>
        i.texto.startsWith(m.nome) ? i.texto.slice(m.nome.length).trim() : i.texto,
      ),
      condicoes: nomes.map((nome) => ({ nome, slugCeaf: achaCeaf(nome) })),
    });
  }
  return saida.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Um medicamento de alto custo pelo slug, ou `null`. */
export function medicamentoAltoCusto(
  slug: string,
  uf?: string,
): MedicamentoAltoCusto | null {
  return medicamentosAltoCusto(uf).find((m) => m.slug === slug) ?? null;
}
