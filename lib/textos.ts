/**
 * Frases padrão. O site fala sempre igual. Ver docs/CONTEUDO.md.
 *
 * Não escreva variação destas frases em componente nenhum. Se precisar de uma
 * frase nova, ela nasce aqui.
 */

export const AVISO_INDEPENDENTE =
  "Este é um projeto independente, feito por voluntários. Não tem vínculo com " +
  "a Prefeitura de Criciúma, com o Governo de Santa Catarina nem com o " +
  "Ministério da Saúde. As informações são conferidas com frequência, mas " +
  "confirme na unidade antes de sair de casa.";

export const RECUSA_CLINICA =
  "Essa pergunta é para o farmacêutico. Ele atende de graça na sua unidade e " +
  "pode olhar todos os seus medicamentos juntos.";

/** {data} no formato 12/03/2026. {telefone} pode faltar. */
export function dadoDesatualizado(data: string, telefone: string | null): string {
  const onde = telefone ?? "a unidade";
  return (
    `Não conseguimos conferir esta informação desde ${data}. Ela pode ter ` +
    `mudado. Ligue para ${onde} antes de ir.`
  );
}

export function semResultado(municipioNome: string): string {
  return (
    `Não encontramos esse medicamento na lista de ${municipioNome}. Isso pode ` +
    "significar duas coisas: ele não é entregue aqui, ou está cadastrado com outro nome."
  );
}

export const SEM_DADO_AINDA =
  "Ainda não publicamos a lista de nenhuma cidade. Quando publicarmos, cada " +
  "informação vai vir com a data em que foi conferida.";
