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

export const Proveniencia = z
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

// ---------------------------------------------------------------------------
// Vocabulário compartilhado
// ---------------------------------------------------------------------------

/** Componente da Assistência Farmacêutica. Define quem entrega e como se pede. */
export const Componente = z.enum(["basico", "especializado", "estrategico"]);

export const TipoUnidade = z.enum([
  "farmacia_municipal",
  "dispensario_ubs",
  "farmacia_ceaf",
  "farmacia_caps",
  "farmacia_popular",
]);

/** O que a pessoa precisa levar para retirar. */
export const Exigencia = z.enum([
  "receita_sus_valida",
  "receita_qualquer_origem",
  "documento_com_foto",
  "cartao_sus",
  "comprovante_residencia",
  "receita_controlada_azul",
  "receita_controlada_amarela",
  "laudo_lme",
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
  /** Telefone geral da assistência farmacêutica, usado no aviso de dado velho. */
  telefone_assistencia_farmaceutica: z.string().min(1).nullable(),
  /** Se a REMUME local atende só residentes. Ver docs/PROJETO.md. */
  exige_residencia: z.boolean(),
  /** Centro do mapa. */
  centro: z.object({ lat: z.number(), lng: z.number() }),
  proveniencia: Proveniencia,
});

// ---------------------------------------------------------------------------
// data/municipios/<id>/unidades.json
// ---------------------------------------------------------------------------

export const Horario = z
  .object({
    /** Texto curto e legível: "seg-sex", "sábado". */
    dias: z.string().min(1),
    abre: z.string().regex(/^\d{2}:\d{2}$/),
    fecha: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((h) => h.abre < h.fecha, {
    message: "abre precisa ser antes de fecha",
    path: ["fecha"],
  });

export const Endereco = z.object({
  logradouro: z.string().min(1),
  bairro: z.string().min(1),
  cep: z.string().regex(/^\d{5}-\d{3}$/),
  lat: z.number().min(-34).max(6),
  lng: z.number().min(-74).max(-33),
});

export const Unidade = z.object({
  id: Slug,
  nome: z.string().min(1),
  tipo: TipoUnidade,
  endereco: Endereco,
  telefones: z.array(z.string().min(1)),
  horarios: z.array(Horario).min(1),
  /** Quais componentes esta unidade entrega. */
  dispensa: z.array(Componente).min(1),
  /**
   * Texto quando o atendimento é limitado a um público.
   * Nunca mande alguém para uma unidade sem mostrar isto.
   */
  restricao: z.string().min(1).nullable(),
  observacoes: z.string().min(1).nullable(),
  proveniencia: Proveniencia,
});

export const Unidades = z.array(Unidade).refine(
  (us) => new Set(us.map((u) => u.id)).size === us.length,
  "há unidades com o mesmo id",
);

// ---------------------------------------------------------------------------
// data/municipios/<id>/remume.json
// ---------------------------------------------------------------------------

export const ItemRemume = z.object({
  principio_ativo: z.string().min(1),
  /** Como está escrito na fonte: "50 mg", "25 mg/mL". */
  concentracao: z.string().min(1),
  forma: FormaFarmaceutica,
  componente: Componente,
  onde_retirar: z.array(TipoUnidade).min(1),
  exige: z.array(Exigencia).min(1),
  /** Liga o item à ficha editorial nacional, quando existir. */
  slug_ficha: Slug.nullable(),
  observacoes: z.string().min(1).nullable(),
  proveniencia: Proveniencia,
});

export const Remume = z.array(ItemRemume).refine(
  (itens) =>
    new Set(itens.map((i) => `${i.principio_ativo}|${i.concentracao}|${i.forma}`))
      .size === itens.length,
  "há itens repetidos (mesmo princípio ativo, concentração e forma)",
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

export type Proveniencia = z.infer<typeof Proveniencia>;
export type Componente = z.infer<typeof Componente>;
export type TipoUnidade = z.infer<typeof TipoUnidade>;
export type Exigencia = z.infer<typeof Exigencia>;
export type FormaFarmaceutica = z.infer<typeof FormaFarmaceutica>;
export type Municipio = z.infer<typeof Municipio>;
export type Unidade = z.infer<typeof Unidade>;
export type ItemRemume = z.infer<typeof ItemRemume>;
export type Revisao = z.infer<typeof Revisao>;
export type Medicamento = z.infer<typeof Medicamento>;
