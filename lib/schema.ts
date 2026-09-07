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
  /** O laudo que o médico preenche para pedir o medicamento de alto custo (LME). */
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

/**
 * Coordenada vinda do cadastro de endereços do IBGE, casada pelo CEP, pela rua
 * e pelo número.
 *
 * É um tipo **separado** de `Geo` de propósito. `Geo` é o pino que alguém abriu
 * no mapa e confirmou que cai na porta, e é o que as unidades do SUS exigem.
 * Este aqui ninguém abriu: é o ponto que o recenseador registrou naquele
 * endereço. Erra pouco, mas erra sozinho — e a diferença entre "conferimos" e
 * "casamos o endereço" é o tipo de coisa que este projeto não apaga.
 */
export const GeoDoCadastro = z.object({
  lat: z.number().min(-34).max(6),
  lng: z.number().min(-74).max(-33),
  /** De onde saiu a coordenada. Vai na nota de fonte. */
  fonte: z.string().min(1),
  /**
   * `numero` é o endereço achado igual no cadastro: é a porta.
   *
   * `aproximada` é calculado entre os dois números vizinhos que existem no
   * cadastro — a farmácia está naquele trecho da rua, não naquele ponto. A
   * tela avisa, porque a diferença entre "é aqui" e "é por aqui" é a diferença
   * entre achar a porta e andar procurando.
   */
  precisao: z.enum(["numero", "aproximada"]),
  obtido_em: DataISO,
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
  /** O que a unidade entrega, em linguagem simples. Aparece na tela. */
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

/** O paciente leva para casa, ou o medicamento é usado dentro da unidade? */
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
   * Os medicamentos de uso ambulatorial são aplicados dentro da unidade ou do
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
// data/estados/<uf>/ceaf.json — alto custo
// ---------------------------------------------------------------------------

/** Que papel é esse. Serve para explicar o jargão em português na tela. */
export const TipoDocumentoCeaf = z.enum([
  "protocolo",
  "formulario",
  "termo_responsabilidade",
  "resumo",
  "lme",
  "declaracao",
  "outro",
]);

/** Um papel que o pedido de alto custo precisa. */
export const DocumentoCeaf = z.object({
  nome: z.string().min(1),
  tipo: TipoDocumentoCeaf,
  url: z.url(),
  descricao: z.string().min(1).nullable(),
  /** Como a fonte informa: "143.04 KB". */
  tamanho: z.string().min(1).nullable(),
  publicado_em: DataISO.nullable(),
});

/**
 * Uma doença atendida pelo CEAF e os papéis que o pedido dela exige.
 *
 * É o que falta nas cartilhas, que dizem "traga os exames necessários" sem
 * dizer quais, para qual doença. Ver docs/PROJETO.md.
 */
/**
 * O que o pedido precisa anexar, agrupado pelo medicamento a que se refere.
 *
 * Cada medicamento da mesma doença exige exames diferentes. Juntar tudo numa lista
 * só faria a pessoa achar que precisa de todos. Os textos são citados do
 * Resumo publicado pela SES/SC, sem reescrita: aqui não se resume exigência
 * de processo.
 */
export const GrupoAnexos = z.object({
  medicamentos: z.array(z.string().min(1)),
  itens: z.array(z.string().min(1)).min(1),
});

export const CondicaoCeaf = z.object({
  slug: Slug,
  nome: z.string().min(1),
  /** O nome como o portal do estado escreve. */
  nome_fonte: z.string().min(1),
  url_fonte: z.url(),
  /** Os códigos CID-10 da doença. Vão no laudo do médico. */
  cid10: z.array(z.string().regex(/^[A-Z]\d{2}(\.\d+)?$/)),
  /**
   * Vazio quando o Resumo da fonte não traz a seção, ou quando o PDF não pôde
   * ser lido. Nesse caso a tela diz que não sabe, em vez de ficar em branco.
   */
  anexos_obrigatorios: z.array(GrupoAnexos),
  documentos: z.array(DocumentoCeaf),
});

export const Ceaf = z.object({
  uf: z.string().length(2).regex(/^[A-Z]{2}$/),
  /** Formulários que valem para qualquer doença, como o LME. */
  documentos_gerais: z.array(DocumentoCeaf),
  condicoes: z.array(CondicaoCeaf).refine(
    (cs) => new Set(cs.map((c) => c.slug)).size === cs.length,
    "há condições com o mesmo slug",
  ),
  proveniencia: Proveniencia,
});

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
// data/nacional/nomes-comerciais.json — o nome da caixa
// ---------------------------------------------------------------------------

/**
 * Nome comercial não é conteúdo clínico: não indica, não desaconselha e não
 * dosa. É fato de registro — a Anvisa registra que tal marca contém tal
 * princípio ativo. Por isso mora fora da ficha editorial e não exige revisão
 * farmacêutica.
 *
 * Só alimenta a busca, para quem digita o nome da caixa achar o princípio
 * ativo. Nenhuma tela afirma "este medicamento é vendido como X": enquanto a
 * origem não for a Anvisa, o site não põe a lista na cara de ninguém. O pior
 * caso de um nome errado aqui é uma busca que não encontra.
 */
export const OrigemInformada = z.object({
  /** Quem informou, em português. Não é URL porque não veio de uma. */
  origem: z.string().min(1),
  /** Falso enquanto ninguém bateu a lista contra o cadastro da Anvisa. */
  conferido_na_anvisa: z.boolean(),
  informado_em: DataISO,
  /** O que falta para esta fonte virar fonte de verdade. */
  observacao: z.string().min(1),
});

export const NomesComerciais = z.object({
  proveniencia: OrigemInformada,
  itens: z
    .array(
      z.object({
        /** O mesmo slug que `lib/remedios.ts` gera do princípio ativo. */
        slug: Slug,
        nomes: z.array(z.string().min(1)).min(1),
      }),
    )
    .refine(
      (is) => new Set(is.map((i) => i.slug)).size === is.length,
      "há mais de uma entrada para o mesmo medicamento",
    ),
});

// ---------------------------------------------------------------------------
// data/nacional/farmacia-popular.json — elenco do PFPB
// ---------------------------------------------------------------------------

/**
 * O elenco do Programa Farmácia Popular do Brasil, que é federal: a lista é a
 * mesma no país inteiro, e por isso mora em `nacional/`.
 *
 * `texto` é o item como o Ministério escreve, e é o que a tela mostra. Os
 * princípios ativos são separados só para cruzar com a lista do município —
 * o site nunca afirma que a apresentação do PFPB é a mesma que a da REMUME.
 * Quem confere a dose é a pessoa, olhando a receita.
 */
export const ItemFarmaciaPopular = z.object({
  texto: z.string().min(1),
  principios_ativos: z.array(z.string().min(1)).min(1),
  /** O que a fonte anexa depois do travessão, como "ação prolongada". */
  observacao: z.string().min(1).nullable(),
  /** Absorvente e fralda estão no programa e não são medicamento. */
  insumo: z.boolean(),
});

export const GrupoFarmaciaPopular = z.object({
  /** A indicação como a fonte escreve, em caixa alta: "HIPERTENSÃO". */
  indicacao: z.string().min(1),
  slug: Slug,
  itens: z.array(ItemFarmaciaPopular).min(1),
});

export const FarmaciaPopular = z.object({
  fonte_atualizada_em: DataISO,
  /**
   * As regras de retirada vêm da página do programa, não do PDF do elenco.
   * Fonte diferente, proveniência própria.
   */
  como_retirar: z.object({
    gratuito: z.boolean(),
    documentos: z.array(z.string().min(1)).min(1),
    onde: z.string().min(1),
    proveniencia: Proveniencia,
  }),
  /**
   * O painel oficial de endereços. O site linka em vez de copiar: a rede
   * credenciada muda toda semana, e uma cópia velha manda alguém a uma
   * farmácia que já saiu do programa.
   */
  busca_enderecos: z.object({
    url: z.url(),
    nome: z.string().min(1),
  }),
  grupos: z.array(GrupoFarmaciaPopular).min(1),
  proveniencia: Proveniencia,
});

// ---------------------------------------------------------------------------
// data/municipios/<id>/farmacias-populares.json
// ---------------------------------------------------------------------------

/**
 * Uma drogaria privada credenciada no Programa Farmácia Popular.
 *
 * Não é unidade do SUS, e por isso não entra em `unidades.json`: não tem
 * componente, não tem exigência municipal e não é a prefeitura que responde
 * por ela. O que o site sabe dela é endereço, e de quando é o endereço.
 *
 * A rede credenciada muda com frequência. Por isso a tela mostra a data da
 * conferência ao lado da lista, e o link para o painel oficial, que é sempre
 * o de hoje.
 */
export const FarmaciaCredenciada = z.object({
  /**
   * O que liga o registro do painel ao cadastro da Receita Federal, e o que
   * distingue duas lojas da mesma rede na mesma rua.
   */
  cnpj: z.string().min(1).nullable(),
  /**
   * O nome do CNPJ. O painel do Ministério publica só este — e ninguém procura
   * "CIA LATINO AMERICANA DE MEDICAMENTOS" na rua.
   */
  razao_social: z.string().min(1),
  /**
   * O nome da placa, vindo do cadastro da Receita. É o que a tela mostra.
   * Nulo quando a empresa não declarou nome fantasia; aí vale a razão social.
   */
  nome_fantasia: z.string().min(1).nullable(),
  /**
   * O endereço como a Receita registra, com tipo e número: "RUA SAO FRANCISCO
   * DO SUL, 135". Sem o cruzamento por CNPJ, o painel dá só o nome da rua.
   */
  logradouro: z.string().min(1),
  /** "SALA 01", "LOJA 2". Nulo quando não há. */
  complemento: z.string().min(1).nullable(),
  /**
   * O bairro que o painel do Ministério informa. Fica guardado à parte do que
   * vai à tela para o cruzamento por CNPJ poder ser refeito sem se comparar
   * com o próprio resultado — e para a divergência entre as duas fontes não
   * sumir na segunda execução.
   */
  bairro_painel: z.string().min(1).nullable(),
  /** O bairro que a tela mostra: o da Receita, que combina com o CEP. */
  bairro: z.string().min(1).nullable(),
  cep: z.string().regex(/^\d{5}-\d{3}$/).nullable(),
  /**
   * Onde fica, pelo cadastro de endereços do IBGE. Nula quando o endereço não
   * foi achado lá — aí a farmácia fica na lista e fora do mapa.
   */
  geo: GeoDoCadastro.nullable(),
  /**
   * Onde o painel e a Receita discordam. O site não escolhe uma fonte e
   * esconde a outra: escreve a diferença em português, e quem lê decide.
   */
  divergencias: z.array(Divergencia),
});

export const FarmaciasCredenciadas = z.object({
  municipio_id: Slug,
  farmacias: z.array(FarmaciaCredenciada).min(1),
  proveniencia: Proveniencia,
});

// ---------------------------------------------------------------------------
// data/nacional/rename.json
// ---------------------------------------------------------------------------

/**
 * A RENAME (Relação Nacional de Medicamentos Essenciais) é o piso: o que todo
 * SUS do Brasil garante, em qualquer município, com ou sem lista própria.
 *
 * Serve para responder "tem no SUS" numa cidade sem REMUME cadastrada — sem
 * inventar onde retirar ou qual receita a prefeitura pede, porque isso a
 * RENAME não diz: quem decide isso é cada município. Por isso a página de
 * medicamento em modo RENAME nunca mostra unidade, distrito nem tipo de
 * receita — só "isto é garantido no país inteiro" e o texto explicando que a
 * cidade ainda não tem lista própria aqui.
 */
export const ItemRename = z.object({
  texto: z.string().min(1),
  principios_ativos: z.array(z.string().min(1)).min(1),
  forma_farmaceutica: z.string().min(1),
  componente: Componente,
  /**
   * As doenças para as quais este medicamento é fornecido, como a RENAME
   * escreve na coluna "Documento norteador" — cada uma é um PCDT, o protocolo
   * do Ministério da Saúde.
   *
   * Só o componente especializado (alto custo) tem. Vazio nos outros: o
   * básico e o estratégico não são atrelados a um protocolo por doença.
   */
  condicoes: z.array(z.string().min(1)).default([]),
  /**
   * O código ATC — a classificação internacional do princípio ativo, do
   * Apêndice A da RENAME. É o único identificador estável que a lista publica:
   * cruzar fontes por nome depende de cada prefeitura escrever igual, e
   * nenhuma escreve. Nulo nos poucos que a fonte não classifica (fitoterápicos
   * e alguns insumos).
   */
  codigo_atc: z.string().min(1).nullable().default(null),
});

export const Rename = z.object({
  edicao: z.string().min(1),
  itens: z.array(ItemRename).min(1),
  proveniencia: Proveniencia,
});

// ---------------------------------------------------------------------------
// data/nacional/nomes-equivalentes.json
// ---------------------------------------------------------------------------

/**
 * Uma grafia que alguma fonte usa e a lista nacional escreve de outro jeito.
 *
 * O cruzamento entre a lista de um município e a RENAME é por nome, e cada
 * prefeitura escreve à sua maneira: sal na frente ou depois da vírgula, forma
 * farmacêutica colada, sinônimo entre parênteses. As regras automáticas de
 * `lib/nomes-medicamentos.ts` resolvem a maior parte, mas não todas — e cada
 * cidade nova traz grafias novas.
 *
 * Este arquivo é onde mora o que a regra não resolve. É dado, não código:
 * cresce por revisão humana, vale para todas as cidades de uma vez e cada
 * entrada registra quem conferiu. Ver `docs/DADOS.md` e a regra 3 do
 * `CLAUDE.md` — robô propõe, humano aprova.
 */
export const NomeEquivalente = z.object({
  /** Como a fonte escreve. */
  grafia: z.string().min(1),
  /** Onde essa grafia foi vista: id do município, ou "nacional". */
  onde: z.string().min(1),
  /**
   * O nome do mesmo medicamento na RENAME. Nulo quando a revisão concluiu que
   * ele **não** está na lista nacional — isso também é resposta, e evita que
   * alguém reveja o mesmo nome a cada importação.
   */
  canonico: z.string().min(1).nullable(),
  /** O ATC do canônico, quando a RENAME o classifica. Só para conferência. */
  codigo_atc: z.string().min(1).nullable(),
  /** Quem conferiu. Nome de pessoa, não "automático". */
  revisado_por: z.string().min(1),
  revisado_em: DataISO,
  /** Por que são (ou não são) o mesmo, quando não é óbvio. */
  observacao: z.string().min(1).nullable(),
});

export const NomesEquivalentes = z.object({
  equivalencias: z.array(NomeEquivalente),
});

// ---------------------------------------------------------------------------
// data/nacional/municipios-ibge.json
// ---------------------------------------------------------------------------

/**
 * O cadastro de todos os municípios do Brasil, do IBGE. Só existe para o
 * seletor de cidade saber quais nomes são válidos e para as rotas dinâmicas
 * decidirem se um slug é uma cidade de verdade — não é o dado de saúde em si.
 */
export const MunicipioIbge = z.object({
  codigo_ibge: z.number().int().positive(),
  nome: z.string().min(1),
  uf: z.string().length(2),
  slug: Slug,
});

export const CadastroMunicipiosIbge = z.object({
  municipios: z.array(MunicipioIbge).min(1),
  proveniencia: Proveniencia,
});

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
export type NomesComerciais = z.infer<typeof NomesComerciais>;
export type ItemFarmaciaPopular = z.infer<typeof ItemFarmaciaPopular>;
export type GrupoFarmaciaPopular = z.infer<typeof GrupoFarmaciaPopular>;
export type FarmaciaPopular = z.infer<typeof FarmaciaPopular>;
export type GeoDoCadastro = z.infer<typeof GeoDoCadastro>;
export type FarmaciaCredenciada = z.infer<typeof FarmaciaCredenciada>;
export type FarmaciasCredenciadas = z.infer<typeof FarmaciasCredenciadas>;
export type ItemRename = z.infer<typeof ItemRename>;
export type Rename = z.infer<typeof Rename>;
export type MunicipioIbge = z.infer<typeof MunicipioIbge>;
export type CadastroMunicipiosIbge = z.infer<typeof CadastroMunicipiosIbge>;
export type NomeEquivalente = z.infer<typeof NomeEquivalente>;
export type NomesEquivalentes = z.infer<typeof NomesEquivalentes>;
export type TipoDocumentoCeaf = z.infer<typeof TipoDocumentoCeaf>;
export type DocumentoCeaf = z.infer<typeof DocumentoCeaf>;
export type GrupoAnexos = z.infer<typeof GrupoAnexos>;
export type CondicaoCeaf = z.infer<typeof CondicaoCeaf>;
export type Ceaf = z.infer<typeof Ceaf>;
export type Medicamento = z.infer<typeof Medicamento>;
