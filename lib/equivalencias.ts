/**
 * O dicionário de grafias, entre a lista de um município e a nacional.
 *
 * ## Por que ele existe
 *
 * Cruzar duas listas de medicamentos por nome só funciona enquanto as duas
 * escrevem igual, e elas nunca escrevem: a RENAME põe o sal na frente
 * ("cloridrato de metformina"), a REMUME de Criciúma põe depois da vírgula
 * ("Metformina, cloridrato de") e às vezes cola a forma farmacêutica no fim.
 * As regras de `lib/nomes-medicamentos.ts` cobrem os padrões que já
 * apareceram, mas cada prefeitura nova traz os seus.
 *
 * Resolver isso aumentando as regras não escala: com uma cidade são 52 nomes
 * sem par; com as 295 de Santa Catarina, seria editar código a cada
 * importação. Aqui a resposta é dado — `data/nacional/nomes-equivalentes.json`
 * —, revisada por gente e válida para todas as cidades de uma vez. Nomes se
 * repetem entre municípios, então o dicionário melhora a cada cidade que
 * entra, em vez de piorar.
 *
 * O que ele **não** faz: adivinhar. Uma grafia que ninguém conferiu não entra
 * aqui; ela sai no relatório de `scripts/revisa-equivalencias.ts` e espera
 * revisão. Dizer que dois medicamentos são o mesmo é decisão de gente.
 */
import { carregaNomesEquivalentes } from "./dados";
import { conjuntoDePrincipios, grafiasDoNome } from "./nomes-medicamentos";

/** Uma decisão já tomada sobre uma grafia. */
export type Decisao =
  | { tipo: "casa"; canonico: string }
  /** Conferido: não está na lista nacional. Não volta ao relatório. */
  | { tipo: "nao-esta-na-rename" };

function indice(): Map<string, Decisao> {
  const mapa = new Map<string, Decisao>();
  for (const e of carregaNomesEquivalentes()?.equivalencias ?? []) {
    const chave = conjuntoDePrincipios([e.grafia]);
    if (!chave) continue;
    mapa.set(
      chave,
      e.canonico ? { tipo: "casa", canonico: e.canonico } : { tipo: "nao-esta-na-rename" },
    );
  }
  return mapa;
}

/**
 * As chaves pelas quais um nome pode casar com a lista nacional.
 *
 * Junta o que as regras automáticas produzem com o que o dicionário decidiu.
 * Devolver várias é de propósito: basta uma bater, e nenhuma delas inventa
 * equivalência — cada uma veio de uma regra explícita ou de uma revisão.
 */
export function chavesDeBusca(nome: string): string[] {
  const doDicionario = indice();
  const chaves = new Set<string>();

  for (const grafia of grafiasDoNome(nome)) {
    const chave = conjuntoDePrincipios([grafia]);
    if (!chave) continue;
    chaves.add(chave);

    const decisao = doDicionario.get(chave);
    if (decisao?.tipo === "casa") {
      const canonica = conjuntoDePrincipios([decisao.canonico]);
      if (canonica) chaves.add(canonica);
    }
  }
  return [...chaves];
}

/** Uma grafia que a revisão já concluiu não estar na lista nacional. */
export function conferidoForaDaRename(nome: string): boolean {
  const doDicionario = indice();
  return grafiasDoNome(nome).some((g) => {
    const chave = conjuntoDePrincipios([g]);
    return chave ? doDicionario.get(chave)?.tipo === "nao-esta-na-rename" : false;
  });
}
