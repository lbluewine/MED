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
  Ceaf,
  Medicamentos,
  NomesComerciais,
  Municipio,
  Remume,
  Unidades,
  type ItemRemume,
  type Medicamento as TMedicamento,
  type Ceaf as TCeaf,
  type NomesComerciais as TNomesComerciais,
  type Municipio as TMunicipio,
  type Unidade,
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

/** Fichas editoriais, iguais no país inteiro. */
export function carregaMedicamentos(): TMedicamento[] {
  const caminho = join(RAIZ, "nacional", "medicamentos.json");
  if (!existsSync(caminho)) return [];
  return leJson(caminho, Medicamentos);
}
