/**
 * Traduz o vocabulário técnico da fonte para o jeito que a pessoa fala.
 * Ver a tabela de tradução obrigatória em docs/CONTEUDO.md.
 *
 * Todo termo técnico que precisa aparecer vem explicado na mesma frase.
 */
import type {
  Componente,
  Exigencia,
  TipoDocumentoCeaf,
  TipoReceita,
  TipoUnidade,
} from "./schema";
import { VALIDADE_RECEITA_DIAS } from "./prazos";

/**
 * Frase inteira, com o artigo dentro. Montar "Na " + rótulo dá "Na posto de
 * saúde", que está errado e soa como texto de robô.
 */
export const ONDE_RETIRAR: Record<TipoUnidade, string> = {
  farmacia_distrital: "Na farmácia do seu distrito",
  dispensario_ubs: "No posto de saúde do seu bairro (UBS)",
  farmacia_estrategica: "Na Farmácia Estratégica",
  farmacia_ceaf: "Na Farmácia Escola, que entrega os medicamentos de alto custo",
  farmacia_alimentar: "Na farmácia de fórmulas e dietas",
  farmacia_caps: "Na farmácia do CAPS onde você faz tratamento",
  programa_insumos: "No programa de medida de glicemia",
  farmacia_popular: "Na Farmácia Popular",
};

/** Título curto, para lista e cabeçalho. */
export const NOME_UNIDADE_CURTO: Record<TipoUnidade, string> = {
  farmacia_distrital: "Farmácia do distrito",
  dispensario_ubs: "Posto de saúde (UBS)",
  farmacia_estrategica: "Farmácia Estratégica",
  farmacia_ceaf: "Farmácia de alto custo",
  farmacia_alimentar: "Fórmulas e dietas",
  farmacia_caps: "Farmácia do CAPS",
  programa_insumos: "Programa de glicemia",
  farmacia_popular: "Farmácia Popular",
};

/** Nenhum texto do site pode ter o nome de um município escrito fixo. */
export function quemEntrega(componente: Componente, municipio: string): string {
  if (componente === "basico") {
    return `A prefeitura de ${municipio} disponibiliza este medicamento.`;
  }
  if (componente === "estrategico") {
    return (
      "Este medicamento vem de um programa do Ministério da Saúde e é entregue " +
      "aqui na cidade."
    );
  }
  return (
    "Este é um medicamento de alto custo, que quem entrega é o governo do estado " +
    "(CEAF). Precisa de um pedido feito pelo médico."
  );
}

export const EXIGENCIA: Record<Exigencia, string> = {
  receita_original: "A receita original, não uma cópia",
  documento_com_foto: "Um documento com foto (RG ou CNH)",
  cartao_sus: "O Cartão do SUS",
  certidao_nascimento_crianca: "Se for criança, serve a certidão de nascimento",
  documento_de_quem_retira:
    "Se outra pessoa for buscar, o documento com foto dela",
  laudo_lme: "O laudo que o médico preenche para pedir o medicamento (LME)",
};

export const NOME_RECEITA: Record<TipoReceita, string> = {
  simples: "receita comum",
  controle_especial_branca_2_vias: "receita branca de controle especial, em duas vias",
  notificacao_b_azul: "receita azul",
  notificacao_a_amarela: "receita amarela",
  antimicrobiano_2_vias: "receita de antibiótico, em duas vias",
};

/**
 * O que dizer sobre a validade da receita.
 *
 * A receita comum é o caso confuso: vale 30 dias, mas se o médico escreveu
 * "uso contínuo" o prazo é bem maior e depende do medicamento. Por isso a frase
 * não afirma um número só.
 */
export function validadeDaReceita(tipo: TipoReceita): string {
  const dias = VALIDADE_RECEITA_DIAS[tipo];
  if (tipo === "simples") {
    return (
      `A receita comum vale ${dias} dias. Se o médico escreveu "uso contínuo" ` +
      "na receita, ela vale por mais tempo. Pergunte na farmácia."
    );
  }
  if (tipo === "antimicrobiano_2_vias") {
    return (
      `Essa receita vale ${dias} dias. Se o médico escreveu "uso contínuo", ` +
      "vale 90 dias."
    );
  }
  return `Essa receita vale ${dias} dias, contados da data que está escrita nela.`;
}

/**
 * O que cada papel do alto custo é, dito em português.
 *
 * Os nomes que o portal do estado usa são jargão: "TER Asma", "Portaria
 * Conjunta SAES/SCTIE". A pessoa precisa saber o que é aquilo e quem preenche.
 */
export const TIPO_DOCUMENTO: Record<
  TipoDocumentoCeaf,
  { titulo: string; explicacao: string }
> = {
  protocolo: {
    titulo: "As regras desta doença",
    explicacao:
      "São as regras do Ministério da Saúde para essa doença (PCDT). Quem " +
      "usa é o médico, para saber o que pedir.",
  },
  formulario: {
    titulo: "Formulário desta doença",
    explicacao: "O médico preenche na consulta.",
  },
  termo_responsabilidade: {
    titulo: "Termo de responsabilidade",
    explicacao:
      "O papel em que você assina dizendo que o médico explicou o " +
      "tratamento (TER).",
  },
  resumo: {
    titulo: "Resumo das regras",
    explicacao: "Versão curta das regras, para o médico consultar.",
  },
  lme: {
    titulo: "O laudo do médico (LME)",
    explicacao:
      "É o pedido em si. Sem ele o processo não anda, e quem preenche é o " +
      "médico.",
  },
  declaracao: {
    titulo: "Declaração",
    explicacao: "Papel que você ou o médico assina. Nem todos servem para o seu caso.",
  },
  outro: { titulo: "Documento", explicacao: "" },
};

/** "(48) 3445-8730" a partir do que a fonte escreve e do DDD do município. */
export function telefoneCompleto(telefone: string, ddd: string): string {
  return telefone.startsWith("(") ? telefone : `(${ddd}) ${telefone}`;
}

/** O href de ligação, com o DDI e o DDD que a fonte às vezes omite. */
export function telefoneHref(telefone: string, ddd: string): string {
  return `tel:+55${ddd}${telefone.replace(/\D/g, "").slice(-9)}`;
}

/**
 * O nome de cada estado, pela sigla.
 *
 * Não é dado de saúde: é a nomenclatura oficial das unidades da federação,
 * a mesma do cadastro do IBGE em `data/nacional/municipios-ibge.json`, que
 * traz só a sigla. Serve para a tela de escolher cidade poder dizer
 * "Santa Catarina" em vez de "SC" para quem não decora sigla.
 */
export const NOME_UF: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
};

/**
 * Quem entrega, em duas palavras. Serve para linha de lista, onde a frase
 * inteira de `quemEntrega` não cabe.
 */
export const COMPONENTE_CURTO: Record<Componente, string> = {
  basico: "na cidade",
  estrategico: "programa do Ministério",
  especializado: "alto custo, pelo estado",
};

/**
 * A marca de um medicamento do piso nacional que a lista do município não
 * traz. Diz **por onde ele vem**, porque isso muda o que a pessoa tem de
 * fazer: quem procura um de alto custo precisa abrir processo no estado, e
 * mandá-la "perguntar na sua unidade de saúde" é fazer perder a viagem.
 *
 * Todas as três descrevem a via, e nenhuma descreve a ausência — o título da
 * seção já diz que nada ali está na lista da prefeitura. Isso importa porque
 * 22 medicamentos estão em mais de um componente e recebem duas marcas: "não
 * está na lista daqui" ao lado de outra marca se lia como contradição.
 * Agora cada uma nomeia o balcão onde o medicamento sai, os mesmos nomes da
 * página "onde pegar" — e dois balcões diferentes no mesmo item se leem como
 * o que são: muda conforme o tratamento.
 */
export const FORA_DA_LISTA_MUNICIPAL: Record<
  Componente,
  { marca: string; explicacao: string }
> = {
  basico: {
    marca: "unidades de saúde",
    explicacao:
      "Sai no posto de saúde ou na farmácia do distrito, como o resto da " +
      "lista da prefeitura. Pergunte na sua unidade.",
  },
  estrategico: {
    marca: "farmácia estratégica",
    explicacao:
      "Vem de um programa do Ministério da Saúde e sai na Farmácia " +
      "Estratégica da cidade.",
  },
  especializado: {
    marca: "farmácia de alto custo",
    explicacao:
      "Sai na farmácia do alto custo: quem entrega é o governo do estado, " +
      "não o posto, e o pedido é aberto com papéis que o médico preenche.",
  },
};
