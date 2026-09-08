/**
 * Prazos de frescor do dado. Ver docs/DADOS.md e docs/CONTEUDO.md.
 */

/** Passou disso, a página mostra o aviso de dado desatualizado. */
export const DIAS_ATE_DADO_VELHO = 90;

/** Passou disso, o selo de revisão farmacêutica some da página. */
export const MESES_ATE_REVISAO_VENCIDA = 18;

const UM_DIA = 86_400_000;

/** Dias inteiros entre uma data AAAA-MM-DD e hoje. Negativo se for no futuro. */
export function diasDesde(dataISO: string, hoje: Date = new Date()): number {
  return Math.floor((hoje.getTime() - Date.parse(`${dataISO}T00:00:00Z`)) / UM_DIA);
}

/** O dado passou do prazo de conferência? */
export function dadoDesatualizado(verificadoEm: string, hoje?: Date): boolean {
  return diasDesde(verificadoEm, hoje) > DIAS_ATE_DADO_VELHO;
}

/** A revisão farmacêutica venceu? */
export function revisaoVencida(revisadoEm: string, hoje?: Date): boolean {
  return diasDesde(revisadoEm, hoje) > MESES_ATE_REVISAO_VENCIDA * 30.4375;
}

/** "12/03/2026" — a forma que o usuário lê. */
export function dataPorExtenso(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Validade da receita, em dias, conforme a REMUME de Criciúma versão 11/2024.
 *
 * A receita simples é o caso confuso: a validade depende do que está escrito
 * nela, não só do tipo. Por isso o valor é uma faixa e a tela explica.
 */
export const VALIDADE_RECEITA_DIAS = {
  simples: 30,
  controle_especial_branca_2_vias: 30,
  notificacao_b_azul: 30,
  notificacao_a_amarela: 30,
  antimicrobiano_2_vias: 10,
} as const;
