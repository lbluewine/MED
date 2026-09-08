/**
 * Comparação de princípio ativo entre fontes que escrevem o mesmo remédio de
 * jeitos diferentes: a REMUME municipal, o elenco da Farmácia Popular e a
 * RENAME (piso nacional) cada uma tem sua convenção de escrita.
 *
 * O cruzamento é conservador de propósito: na dúvida, não casa. Um casamento
 * errado manda alguém atrás de um medicamento que não é o dele.
 */

/**
 * Sais e ésteres que a fonte prende ao nome. "Cloridrato de metformina" e
 * "Metformina, cloridrato de" são o mesmo princípio ativo escrito de dois
 * jeitos: a lista federal põe o sal na frente, a REMUME põe depois da vírgula.
 */
const SAIS = [
  "sulfato",
  "cloridrato",
  "dicloridrato",
  "bromidrato",
  "maleato",
  "besilato",
  "succinato",
  "acetato",
  "valerato",
  "enantato",
  "cipionato",
  "dipropionato",
  "propionato",
  "brometo",
  "tartarato",
  "mesilato",
  "fosfato",
  "nitrato",
  "citrato",
  "oxalato",
  "fumarato",
  "nicotinato",
];

/**
 * Siglas que a REMUME anexa ao nome para distinguir a apresentação, não o
 * princípio ativo: "Levodopa + Benserazida BD" e "... HBS" têm os mesmos dois
 * princípios ativos.
 *
 * A lista é curta e explícita porque ela decide um casamento. Sigla que não
 * está aqui bloqueia o casamento, e é assim que deve ser: "Insulina humana
 * NPH" não casa com "insulina humana", porque NPH e regular são insulinas
 * diferentes e a própria fonte federal lista as duas em separado.
 */
const SIGLAS_DE_APRESENTACAO = ["bd", "hbs"];

/**
 * Formas farmacêuticas que a REMUME às vezes prende ao fim do nome:
 * "Dipropionato de Betametasona + Fosfato Dissódico de Betametasona Suspensão
 * Injetável". A forma já vem em campo próprio (`forma`), e no nome ela só
 * atrapalha — foi o que impediu esse item de casar com o da RENAME, que
 * escreve o mesmo princípio sem a forma.
 *
 * A lista é explícita pelo mesmo motivo das siglas acima: cada entrada decide
 * um casamento. As mais longas vêm primeiro, para "suspensão injetável" ser
 * cortada inteira antes de "injetável".
 */
const FORMAS_NO_NOME = [
  "suspensao injetavel",
  "solucao injetavel",
  "solucao inalatoria",
  "solucao oral",
  "suspensao oral",
  "solucao nasal",
  "solucao retal",
  "spray nasal",
  "po para solucao injetavel",
  "comprimido",
  "capsula",
  "xarope",
  "creme",
  "pomada",
  "colirio",
  "injetavel",
  "supositorio",
  "adesivo",
  "locao",
  "pasta",
];

/** Nomes próprios que a fonte escreve em caixa alta e a tela precisa preservar. */
export const NOMES_PROPRIOS: Record<string, string> = { parkinson: "Parkinson" };

export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Reduz um princípio ativo ao nome base, para comparar as fontes entre si.
 * "Brometo de ipratrópio" e "Ipratrópio, Brometo de" viram "ipratropio".
 */
export function nomeBase(nome: string): string {
  let base = semAcento(nome)
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // A REMUME inverte: "Metformina, cloridrato de". O que vem antes da vírgula
  // é o princípio ativo; o resto é o sal.
  const virgula = base.indexOf(",");
  if (virgula > 0) base = base.slice(0, virgula).trim();

  // A lista federal põe o sal na frente: "cloridrato de metformina".
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const sal of SAIS) {
      const prefixo = `${sal} de `;
      if (base.startsWith(prefixo) && base.length > prefixo.length) {
        base = base.slice(prefixo.length).trim();
        mudou = true;
      }
    }
  }

  // Corta a forma farmacêutica quando ela vem colada no fim do nome.
  let cortou = true;
  while (cortou) {
    cortou = false;
    for (const forma of FORMAS_NO_NOME) {
      const sufixo = ` ${forma}`;
      if (base.endsWith(sufixo) && base.length > sufixo.length) {
        base = base.slice(0, -sufixo.length).trim();
        cortou = true;
        break;
      }
    }
  }

  const partes = base.split(" ");
  while (partes.length > 1 && SIGLAS_DE_APRESENTACAO.includes(partes[partes.length - 1]!)) {
    partes.pop();
  }
  return partes.join(" ");
}

/**
 * As grafias pelas quais um medicamento pode ser reconhecido.
 *
 * A REMUME declara sinônimo entre parênteses — "Folinato de cálcio (ácido
 * folínico)" — e a RENAME lista os dois nomes como itens separados. Sem ler o
 * parêntese, o site mostrava "ácido folínico" como se a cidade não tivesse,
 * quando é o mesmo item que ela entrega.
 *
 * Só o que a própria fonte escreve. Nada aqui inventa equivalência.
 */
export function grafiasDoNome(nome: string): string[] {
  const grafias = [nome];
  for (const achado of nome.matchAll(/\(([^)]+)\)/g)) {
    const limpo = (achado[1] ?? "").trim();
    // Um parêntese com "+" ou com nome científico não é sinônimo do princípio;
    // só entra o que parece um nome de medicamento sozinho.
    if (limpo && !limpo.includes("+") && limpo.split(/\s+/).length <= 4) {
      grafias.push(limpo);
    }
  }
  return grafias;
}

/**
 * O conjunto de princípios ativos de um nome, já reduzido à base.
 * Uma associação vira um conjunto de dois: "Levodopa + Benserazida BD".
 */
export function conjuntoDePrincipios(nomes: string[]): string {
  const bases = nomes
    .flatMap((n) => n.split(/\s*\+\s*/))
    .map(nomeBase)
    .filter((b) => b.length > 0);
  return [...new Set(bases)].sort().join(" + ");
}

/**
 * "HIPERTENSÃO" vira "Hipertensão". Fontes federais escrevem tudo em caixa
 * alta, o que numa tela vira grito. O dado guardado continua o da fonte;
 * isto é só tipografia.
 */
export function rotuloCaixaAlta(texto: string): string {
  const minusculo = texto.toLocaleLowerCase("pt-BR");
  const comProprios = minusculo
    .split(" ")
    .map((palavra) => NOMES_PROPRIOS[palavra] ?? palavra)
    .join(" ");
  return comProprios.charAt(0).toLocaleUpperCase("pt-BR") + comProprios.slice(1);
}
