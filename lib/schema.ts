/**
 * Schemas de todo o conteúdo de `data/`.
 *
 * Regra que este arquivo existe para impor: nenhum dado chega à tela sem
 * proveniência declarada. Ver docs/DADOS.md.
 */
import { z } from "zod";

/** Data no formato AAAA-MM-DD, sem hora e sem fuso. */
export const DataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "use o formato AAAA-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), "data inexistente");

/** Identificador em minúsculas, sem acento, separado por hífen. */
export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use minúsculas, números e hífen");

// ---------------------------------------------------------------------------
// Proveniência
// ---------------------------------------------------------------------------

export const Metodo = z.enum(["manual", "ia-assistida", "automatica"]);

export const UmaProveniencia = z
  .object({
    fonte_nome: z.string().min(1),
    fonte_url: z.url(),
    /** Caminho relativo dentro de `data/`, para a cópia do documento de origem. */
    fonte_arquivo: z.string().min(1).nullable(),
    /** Data da versão do documento de origem. */
    fonte_data: DataISO,
    /** Quando o dado foi lido da fonte. */
    extraido_em: DataISO,
    /** Quando alguém conferiu pela última vez que a fonte não mudou. */
    verificado_em: DataISO,
    metodo: Metodo,
  })
  .refine((p) => p.extraido_em >= p.fonte_data, {
    message: "extraido_em não pode ser anterior a fonte_data",
    path: ["extraido_em"],
  })
  .refine((p) => p.verificado_em >= p.extraido_em, {
    message: "verificado_em não pode ser anterior a extraido_em",
    path: ["verificado_em"],
  });

/**
 * Um registro pode vir de mais de uma fonte oficial: o portal da transparência
 * diz onde a farmácia fica, a REMUME diz o que ela entrega. As duas ficam
 * registradas, e a tela mostra as duas.
 */
export const Proveniencia = z.array(UmaProveniencia).min(1);

/**
 * Quando duas fontes oficiais discordam, o site não escolhe uma e esconde a
 * outra. Escreve a divergência em português, para a pessoa decidir se liga
 * antes de sair de casa. Ex.: "A REMUME informa o CEP 88801-530 e o portal
 * da transparência informa 88810-020 para este mesmo endereço."
 */
export const Divergencia = z.string().min(1);

// ---------------------------------------------------------------------------
// Vocabulário compartilhado
// ---------------------------------------------------------------------------

/** Componente da Assistência Farmacêutica. Define quem entrega e como se pede. */
export const Componente = z.enum(["basico", "especializado", "estrategico"]);

/**
 * Os tipos vieram da seção 8 da REMUME de Criciúma. Outro município pode
 * organizar diferente; acrescente aqui em vez de forçar um encaixe errado.
 */
export const TipoUnidade = z.enum([
  /** Farmácia de referência do distrito sanitário. Entrega o básico e os controlados. */
  "farmacia_distrital",
  /** Balcão dentro da UBS. Entrega parte do básico. */
  "dispensario_ubs",
  /** Programas estratégicos: HIV, tuberculose, hanseníase, hepatites. */
  "farmacia_estrategica",
  /** Alto custo (CEAF). Em Criciúma é a Farmácia Escola da UNESC. */
  "farmacia_ceaf",
  /** Fórmulas infantis, dietas enterais e demandas judiciais. */
  "farmacia_alimentar",
  /** Atende só quem é acompanhado no CAPS. */
  "farmacia_caps",
  /** Programa de insumos, como o de automonitoramento da glicemia. */
  "programa_insumos",
  "farmacia_popular",
]);

/** O que a pessoa precisa levar para retirar. */
export const Exigencia = z.enum([
  /** A via original da receita, não uma cópia. */
  "receita_original",
  "documento_com_foto",
  "cartao_sus",
  /** Certidão de nascimento serve quando o paciente é criança. */
  "certidao_nascimento_crianca",
  /** Quem retira no lugar do paciente apresenta o próprio documento. */
  "documento_de_quem_retira",
  /** O laudo que o médico preenche para pedir o remédio de alto custo (LME). */
  "laudo_lme",
]);

/**
 * Tipo de receita e sua validade, conforme a seção "Da validade das receitas"
 * da REMUME de Criciúma. Chegar com a receita vencida é a viagem perdida mais
 * comum, então este dado vai na tela.
 */
export const TipoReceita = z.enum([
  "simples",
  "controle_especial_branca_2_vias",
  "notificacao_b_azul",
  "notificacao_a_amarela",
  "antimicrobiano_2_vias",
]);

export const FormaFarmaceutica = z.enum([
  "comprimido",
  "capsula",
  "solucao_oral",
  "suspensao_oral",
  "xarope",
  "creme",
  "pomada",
  "colirio",
  "injetavel",
  "spray_nasal",
  "aerossol_inalatorio",
  "supositorio",
  "adesivo",
  "po",
  "locao",
  "gel",
  "pasta",
  "oleo",
  "solucao_nasal",
  "solucao_inalatoria",
  "solucao_retal",
]);

// ---------------------------------------------------------------------------
// data/municipios/<id>/municipio.json
// ---------------------------------------------------------------------------

export const Municipio = z.object({
  /** Ex.: "sc-criciuma". É o segmento de rota. */
  id: Slug,
  nome: z.string().min(1),
  uf: z.string().length(2).regex(/^[A-Z]{2}$/),
  /** Código IBGE de 7 dígitos. */
  ibge: z.string().regex(/^\d{7}$/),
  /** DDD, para completar os telefones que a fonte escreve sem ele. */
  ddd: z.string().regex(/^\d{2}$/),
  /** Telefone geral da assistência farmacêutica, usado no aviso de dado velho. */
  telefone_assistencia_farmaceutica: z.string().min(1).nullable(),
  /**
   * O que a fonte exige de todo mundo, antes de qualquer medicamento.
   * Em Criciúma: morar na cidade e ter cadastro no sistema municipal.
   * Isto vai na tela, não em nota de rodapé.
   */
  exigencias_gerais: z.array(z.string().min(1)),
  /** Centro do mapa. */
  centro: z.object({ lat: z.number(), lng: z.number() }),
  proveniencia: Proveniencia,
});

// ---------------------------------------------------------------------------
// data/municipios/<id>/unidades.json
// ---------------------------------------------------------------------------

export const Horario = z
  .object({
    /**
     * Texto curto e legível: "seg-sex", "sábado".
     * `null` quando a fonte informa o horário mas não diz em quais dias.
     * A tela precisa dizer isso, não chutar "seg-sex".
     */
    dias: z.string().min(1).nullable(),
    abre: z.string().regex(/^\d{2}:\d{2}$/),
    fecha: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((h) => h.abre < h.fecha, {
    message: "abre precisa ser antes de fecha",
    path: ["fecha"],
  });

/**
 * Coordenada do pino no mapa.
 *
 * Só existe depois que uma pessoa abriu o mapa e confirmou que o pino cai na
 * porta certa. Sem isso a unidade aparece na lista, com endereço e telefone,
 * e fica fora do mapa. Pino errado manda alguém para o lugar errado, o que é
 * pior que não ter mapa.
 */
export const Geo = z.object({
  lat: z.number().min(-34).max(6),
  lng: z.number().min(-74).max(-33),
  conferido_por: z.string().min(1),
  conferido_em: DataISO,
});

export const Endereco = z.object({
  logradouro: z.string().min(1),
  /** `null` quando a fonte não informa o bairro. */
  bairro: z.string().min(1).nullable(),
  /**
   * `null` quando a fonte não traz CEP ou traz um CEP inválido.
   * Não adivinhe o CEP certo: registre null e explique em `observacoes`.
   */
  cep: z.string().regex(/^\d{5}-\d{3}$/).nullable(),
  geo: Geo.nullable(),
});

export const Unidade = z.object({
  id: Slug,
  nome: z.string().min(1),
  tipo: TipoUnidade,
  endereco: Endereco,
  /**
   * Como está na fonte, com ou sem DDD. O DDD do município completa o que
   * falta na hora de mostrar. Não reescreva o número aqui.
   */
  telefones: z.array(z.string().regex(/^(\(\d{2}\) )?\d{4,5}-\d{4}$/)),
  /**
   * Pode ser vazio quando a fonte não dá um intervalo, por exemplo "24hrs".
   * Nesse caso a palavra da fonte fica em `observacoes` e a tela mostra ela,
   * em vez de inventar um horário.
   */
  horarios: z.array(Horario),
  /**
   * Quais componentes esta unidade entrega. Pode ser vazio: a farmácia de
   * fórmulas alimentares e o programa de insumos para diabetes não entregam
   * medicamento de nenhum componente.
   */
  dispensa: z.array(Componente),
  /** O que a unidade entrega, na palavra da fonte. Aparece na tela. */
  entrega_descricao: z.string().min(1),
  /**
   * Texto quando o atendimento é limitado a um público.
   * Nunca mande alguém para uma unidade sem mostrar isto.
   */
  restricao: z.string().min(1).nullable(),
  observacoes: z.string().min(1).nullable(),
  /** O que as fontes dizem de diferente sobre esta unidade. */
  divergencias: z.array(Divergencia),
  proveniencia: Proveniencia,
});

export const Unidades = z.array(Unidade).refine(
  (us) => new Set(us.map((u) => u.id)).size === us.length,
  "há unidades com o mesmo id",
);

// ---------------------------------------------------------------------------
// data/municipios/<id>/remume.json
// ---------------------------------------------------------------------------

/** O paciente leva para casa, ou o remédio é usado dentro da unidade? */
export const Retirada = z.enum(["leva_para_casa", "usado_na_unidade"]);

export const ItemRemume = z.object({
  principio_ativo: z.string().min(1),
  /**
   * A apresentação inteira, como está escrita na fonte:
   * "600 mg granulado envelopes com 5g". É isto que a tela mostra.
   */
  apresentacao: z.string().min(1),
  /** Separados da apresentação. Nulos quando não dá para separar com certeza. */
  concentracao: z.string().min(1).nullable(),
  forma: FormaFarmaceutica.nullable(),
  componente: Componente,
  /**
   * Os remédios de uso ambulatorial são aplicados dentro da unidade ou do
   * pronto atendimento. A tela nunca pode mandar alguém ir buscar um deles.
   */
  retirada: Retirada,
  /** Pode ser vazio: nem todo local que a fonte cita é um balcão de entrega. */
  onde_retirar: z.array(TipoUnidade),
  /** Os locais como a fonte escreve. Sempre mostrado, mapeado ou não. */
  locais_texto: z.string().min(1),
  /**
   * Que receita o farmacêutico aceita para este item. Define a validade.
   * Nulo quando a fonte não informa: a tela diz que não sabe e manda perguntar
   * na unidade.
   */
  tipo_receita: TipoReceita.nullable(),
  /** Classe do medicamento como a fonte escreve: "antiviral", "vitamina". */
  classificacao: z.string().min(1).nullable(),
  exige: z.array(Exigencia).min(1),
  /** Liga o item à ficha editorial nacional, quando existir. */
  slug_ficha: Slug.nullable(),
  /**
   * A referência legal que a fonte anexa ao nome, como "Controlado Port.
   * 344/98 - Lista C1". Fica registrada mas não vai para a tela: é jargão, e
   * o que ela significa já está dito no tipo de receita.
   */
  nota_regulatoria: z.string().min(1).nullable(),
  observacoes: z.string().min(1).nullable(),
  proveniencia: Proveniencia,
});

export const Remume = z.array(ItemRemume).refine(
  (itens) =>
    new Set(itens.map((i) => `${i.principio_ativo}|${i.apresentacao}|${i.retirada}`))
      .size === itens.length,
  "há itens repetidos (mesmo princípio ativo, apresentação e forma de retirada)",
);

// ---------------------------------------------------------------------------
// data/nacional/medicamentos.json — ficha editorial
// ---------------------------------------------------------------------------

/**
 * Sem este bloco completo, os campos clínicos não são renderizados.
 * O build não quebra; a página mostra só o que tem fonte. Ver docs/CONTEUDO.md.
 */
export const Revisao = z.object({
  revisor_nome: z.string().min(1),
  revisor_crf: z.string().regex(/^CRF-[A-Z]{2} \d+$/, "use o formato CRF-SC 00000"),
  revisado_em: DataISO,
  escopo: z.string().min(1),
  /** O revisor autorizou por escrito ser nomeado neste conteúdo. */
  autorizacao_registrada: z.boolean(),
});

export const Medicamento = z.object({
  slug: Slug,
  principio_ativo: z.string().min(1),
  /** Nome comercial e nome de balcão. Alimenta a busca. */
  nomes_populares: z.array(z.string().min(1)),
  para_que_serve_simples: z.string().min(1),
  como_tomar: z.string().min(1).nullable(),
  se_esquecer: z.string().min(1).nullable(),
  como_guardar: z.string().min(1).nullable(),
  efeitos_comuns: z.array(z.string().min(1)),
  quando_procurar_ajuda: z.array(z.string().min(1)),
  bula_paciente_url: z.url().nullable(),
  revisao: Revisao.nullable(),
  proveniencia: Proveniencia,
});

export const Medicamentos = z.array(Medicamento).refine(
  (ms) => new Set(ms.map((m) => m.slug)).size === ms.length,
  "há fichas com o mesmo slug",
);

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type UmaProveniencia = z.infer<typeof UmaProveniencia>;
export type Proveniencia = z.infer<typeof Proveniencia>;
export type Componente = z.infer<typeof Componente>;
export type TipoUnidade = z.infer<typeof TipoUnidade>;
export type Exigencia = z.infer<typeof Exigencia>;
export type TipoReceita = z.infer<typeof TipoReceita>;
export type Geo = z.infer<typeof Geo>;
export type FormaFarmaceutica = z.infer<typeof FormaFarmaceutica>;
export type Municipio = z.infer<typeof Municipio>;
export type Unidade = z.infer<typeof Unidade>;
export type Retirada = z.infer<typeof Retirada>;
export type ItemRemume = z.infer<typeof ItemRemume>;
export type Revisao = z.infer<typeof Revisao>;
export type Medicamento = z.infer<typeof Medicamento>;
