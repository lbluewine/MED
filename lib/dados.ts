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
  Medicamentos,
  Municipio,
  Remume,
  Unidades,
  type ItemRemume,
  type Medicamento as TMedicamento,
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

export function carregaRemume(municipioId: string): ItemRemume[] {
  return leJson(join(pasta(municipioId), "remume.json"), Remume);
}

/** Fichas editoriais, iguais no país inteiro. */
export function carregaMedicamentos(): TMedicamento[] {
  const caminho = join(RAIZ, "nacional", "medicamentos.json");
  if (!existsSync(caminho)) return [];
  return leJson(caminho, Medicamentos);
}
