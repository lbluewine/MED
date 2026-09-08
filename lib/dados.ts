/**
 * Leitura e validação de `data/`.
 *
 * Roda só no servidor, em tempo de build. Dado inválido derruba o build:
 * é melhor não publicar do que publicar errado.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ZodType } from "zod";
import {
  CadastroMunicipiosIbge,
  CatalogoPrefeituras,
  EstadoDasFontes,
  Ceaf,
  NomesEquivalentes,
  FarmaciaPopular,
  FarmaciasCredenciadas,
  Medicamentos,
  NomesComerciais,
  Municipio,
  Remume,
  Rename,
  Unidades,
  UnidadesCnes,
  type ItemRemume,
  type Medicamento as TMedicamento,
  type Ceaf as TCeaf,
  type CadastroMunicipiosIbge as TCadastroMunicipiosIbge,
  type NomesEquivalentes as TNomesEquivalentes,
  type FarmaciaPopular as TFarmaciaPopular,
  type FarmaciasCredenciadas as TFarmaciasCredenciadas,
  type NomesComerciais as TNomesComerciais,
  type Municipio as TMunicipio,
  type MunicipioIbge,
  type Rename as TRename,
  type Unidade,
  type EstadoDasFontes as TEstadoDasFontes,
  type CatalogoPrefeituras as TCatalogoPrefeituras,
  type UnidadesCnes as TUnidadesCnes,
} from "./schema";

const RAIZ = join(process.cwd(), "data");

function leJson<T>(caminho: string, schema: ZodType<T>): T {
  const bruto = readFileSync(caminho, "utf8");
  const resultado = schema.safeParse(JSON.parse(bruto));
  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((i) => `  ${i.path.join(".") || "(raiz)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Dado inválido em ${caminho}:\n${problemas}`);
  }
  return resultado.data;
}

/** Ids dos municípios publicados. Vazio é um estado válido: ainda não há dado. */
export function listaMunicipios(): string[] {
  const pasta = join(RAIZ, "municipios");
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(pasta, e.name, "municipio.json")))
    .map((e) => e.name)
    .sort();
}

function pasta(municipioId: string): string {
  return join(RAIZ, "municipios", municipioId);
}

export function carregaMunicipio(municipioId: string): TMunicipio {
  return leJson(join(pasta(municipioId), "municipio.json"), Municipio);
}

export function carregaUnidades(municipioId: string): Unidade[] {
  return leJson(join(pasta(municipioId), "unidades.json"), Unidades);
}

/**
 * Uma cidade pode publicar as unidades antes da lista de medicamentos.
 * Sem `remume.json`, a busca não responde e a tela diz isso — em vez de
 * quebrar o site inteiro.
 */
export function carregaRemume(municipioId: string): ItemRemume[] {
  const caminho = join(pasta(municipioId), "remume.json");
  if (!existsSync(caminho)) return [];
  return leJson(caminho, Remume);
}

/** A lista de alto custo do estado, com os papéis de cada doença. */
export function carregaCeaf(uf: string): TCeaf | null {
  const caminho = join(RAIZ, "estados", uf, "ceaf.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, Ceaf);
}

/**
 * O nome da caixa, por princípio ativo. Só alimenta a busca.
 *
 * Arquivo opcional: sem ele a busca funciona igual, só não acha por marca.
 */
export function carregaNomesComerciais(): TNomesComerciais | null {
  const caminho = join(RAIZ, "nacional", "nomes-comerciais.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, NomesComerciais);
}

/**
 * O elenco do Programa Farmácia Popular. É federal: vale para o país inteiro.
 *
 * Arquivo opcional. Sem ele, nenhuma tela cita o programa — em vez de citar
 * pela metade.
 */
export function carregaFarmaciaPopular(): TFarmaciaPopular | null {
  const caminho = join(RAIZ, "nacional", "farmacia-popular.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, FarmaciaPopular);
}

/**
 * As drogarias credenciadas no Programa Farmácia Popular nesta cidade.
 *
 * Arquivo opcional, e assim deve ser: enquanto ninguém exportou a lista do
 * painel do Ministério para esta cidade, a tela mostra só o link do painel,
 * em vez de uma lista pela metade.
 */
export function carregaFarmaciasPopulares(
  municipioId: string,
): TFarmaciasCredenciadas | null {
  const caminho = join(pasta(municipioId), "farmacias-populares.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, FarmaciasCredenciadas);
}

/**
 * Os estabelecimentos de saúde da cidade, pelo cadastro federal (CNES).
 *
 * Arquivo opcional e **separado de `unidades.json`**, que é o que responde
 * "onde retirar este medicamento". O CNES responde outra coisa: que unidades
 * existem, onde ficam e qual o telefone. Ele não sabe o que cada uma entrega,
 * e o site não pode deduzir isso da existência da unidade.
 */
export function carregaUnidadesCnes(
  municipioId: string,
): TUnidadesCnes | null {
  const caminho = join(pasta(municipioId), "unidades-cnes.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, UnidadesCnes);
}

/**
 * O estado da manutenção: o que o robô conferiu, quando, e o que quebrou.
 *
 * Nulo antes da primeira execução de `scripts/verifica_fontes.py` — aí a
 * página de fontes diz que ainda não houve conferência, em vez de sumir.
 */
export function carregaEstadoDasFontes(): TEstadoDasFontes | null {
  const caminho = join(RAIZ, "fontes", "estado.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, EstadoDasFontes);
}

/**
 * Onde fica o site de cada prefeitura e onde a REMUME dela é publicada.
 *
 * Nulo antes de `scripts/monta_catalogo_prefeituras.py` rodar. Não é dado de
 * saúde: é o mapa de onde procurar, e o que alimenta o aviso de link quebrado
 * na página de estado das fontes.
 */
export function carregaCatalogoPrefeituras(): TCatalogoPrefeituras | null {
  const caminho = join(RAIZ, "fontes", "prefeituras.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, CatalogoPrefeituras);
}

/** Fichas editoriais, iguais no país inteiro. */
export function carregaMedicamentos(): TMedicamento[] {
  const caminho = join(RAIZ, "nacional", "medicamentos.json");
  if (!existsSync(caminho)) return [];
  return leJson(caminho, Medicamentos);
}

/**
 * A RENAME: o piso nacional, igual em qualquer município do Brasil.
 *
 * Arquivo opcional. Sem ele, uma cidade sem REMUME própria não tem resposta
 * nenhuma — em vez de uma resposta inventada.
 */
export function carregaRename(): TRename | null {
  const caminho = join(RAIZ, "nacional", "rename.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, Rename);
}

/**
 * O cadastro de municípios do IBGE. Só diz quais nomes de cidade existem —
 * não é dado de saúde, é o universo válido para o seletor e as rotas.
 *
 * Arquivo opcional. Sem ele, o site continua respondendo só pelas cidades já
 * publicadas em `data/municipios/`.
 */
export function carregaCadastroMunicipiosIbge(): TCadastroMunicipiosIbge | null {
  const caminho = join(RAIZ, "nacional", "municipios-ibge.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, CadastroMunicipiosIbge);
}

/**
 * O dicionário de grafias entre a lista de um município e a nacional.
 *
 * Arquivo opcional: sem ele o cruzamento usa só as regras automáticas, que é
 * como o site funcionava antes. Ver `lib/equivalencias.ts`.
 */
export function carregaNomesEquivalentes(): TNomesEquivalentes | null {
  const caminho = join(RAIZ, "nacional", "nomes-equivalentes.json");
  if (!existsSync(caminho)) return null;
  return leJson(caminho, NomesEquivalentes);
}

/**
 * As siglas de estado que existem no cadastro, em ordem alfabética.
 *
 * Lista vazia quando não há cadastro: a tela de escolher cidade some inteira,
 * em vez de mostrar um estado que não leva a lugar nenhum.
 */
export function listaUfsIbge(): string[] {
  const cadastro = carregaCadastroMunicipiosIbge();
  if (!cadastro) return [];
  return [...new Set(cadastro.municipios.map((m) => m.uf))].sort();
}

/**
 * Os municípios de um estado, em ordem alfabética.
 *
 * A tela de cidade é por estado de propósito: mandar as 5.570 cidades do país
 * para o navegador seriam centenas de KB em cima de quem tem internet ruim, e
 * uma lista desse tamanho não se percorre no celular. Um estado são algumas
 * centenas de nomes.
 */
export function municipiosDaUf(uf: string): MunicipioIbge[] {
  const cadastro = carregaCadastroMunicipiosIbge();
  if (!cadastro) return [];
  const alvo = uf.toUpperCase();
  return cadastro.municipios
    .filter((m) => m.uf === alvo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/**
 * Um município "genérico": está no cadastro do IBGE, mas ninguém ainda
 * publicou a REMUME dele aqui. A pessoa só recebe o piso da RENAME — nunca
 * endereço de unidade, distrito ou receita, porque isso quem decide é a
 * prefeitura, e essa parte a gente não tem.
 */
export type MunicipioGenerico = {
  id: string;
  nome: string;
  uf: string;
  temRemume: false;
};

/**
 * Resolve um slug de município para uma cidade com REMUME publicada, para uma
 * cidade genérica (só o piso da RENAME) ou para `null` quando o slug não
 * corresponde a nenhum município do Brasil.
 */
export function resolveMunicipio(
  slug: string,
): { temRemume: true; municipio: TMunicipio } | { temRemume: false; municipio: MunicipioGenerico } | null {
  if (existsSync(join(pasta(slug), "municipio.json"))) {
    return { temRemume: true, municipio: carregaMunicipio(slug) };
  }
  const cadastro = carregaCadastroMunicipiosIbge();
  const achado = cadastro?.municipios.find((m) => m.slug === slug);
  if (!achado) return null;
  return {
    temRemume: false,
    municipio: { id: achado.slug, nome: achado.nome, uf: achado.uf, temRemume: false },
  };
}
