/**
 * Como alguém avisa que o site está errado.
 *
 * Site estático não recebe formulário, então o relato vai para as issues do
 * repositório, com título e corpo já preenchidos: quem relata não precisa
 * saber descrever onde viu o problema, e quem for corrigir não precisa
 * adivinhar. É o mesmo lugar onde a correção acontece.
 *
 * **Exige conta no GitHub, e isso exclui parte do público deste site.** A
 * escolha foi consciente do mantenedor: é o único canal com custo zero e sem
 * porta de escrita pública para proteger. Enquanto for assim, o texto na tela
 * diz que precisa de conta, em vez de levar a pessoa a um beco.
 */

const REPOSITORIO = "https://github.com/lbluewine/MED";

function url(titulo: string, corpo: string, etiqueta: string): string {
  const p = new URLSearchParams({ title: titulo, body: corpo, labels: etiqueta });
  return `${REPOSITORIO}/issues/new?${p}`;
}

/**
 * Erro num dado que a pessoa viu na tela.
 *
 * `pagina` fica em branco quando o link não sabe de onde a pessoa veio — a
 * página Sobre é estática e não tem como saber. Preencher com "/" ali daria
 * uma pista errada a quem for corrigir, então o corpo pede que ela diga.
 */
export function relatoDeErro(pagina?: string, oQue?: string): string {
  return url(
    oQue ?? pagina ? `Erro no site: ${oQue ?? pagina}` : "Erro no site",
    [
      "**Onde eu vi:** " + (pagina ?? "(diga em que página estava)"),
      "",
      "**O que está errado:**",
      "",
      "",
      "**O certo é:** (se você souber)",
      "",
      "",
      "**Como você sabe:** (link ou documento, se tiver)",
      "",
    ].join("\n"),
    "dado",
  );
}

/** Documento que saiu do lugar: o caso mais comum e o mais fácil de ajudar. */
export function relatoDeLinkQuebrado(fonte: string, endereco?: string | null): string {
  return url(
    `Link quebrado: ${fonte}`,
    [
      "**Fonte:** " + fonte,
      "**Endereço que temos:** " + (endereco ?? "nenhum"),
      "",
      "**Onde o documento está agora:**",
      "",
      "",
      "**Como você achou:** (opcional)",
      "",
    ].join("\n"),
    "fonte",
  );
}

/** Onde uma prefeitura publica a lista dela — o trabalho que não automatiza. */
export function relatoDeRemume(municipio: string): string {
  return url(
    `Onde está a REMUME de ${municipio}`,
    [
      `**Município:** ${municipio}`,
      "",
      "**Endereço da lista de medicamentos publicada pela prefeitura:**",
      "",
      "",
      "**Data da versão, se o documento disser:**",
      "",
    ].join("\n"),
    "remume",
  );
}

export const PRECISA_DE_CONTA =
  "É preciso ter uma conta no GitHub, que é gratuita. O relato fica público, " +
  "junto com a correção.";
