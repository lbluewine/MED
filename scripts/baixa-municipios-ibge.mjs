#!/usr/bin/env node
/**
 * Baixa o cadastro de todos os municípios do Brasil, da API pública do IBGE,
 * e grava `data/nacional/municipios-ibge.json`.
 *
 * Não é dado de saúde: é só o universo de nomes válidos para o seletor de
 * cidade e para as rotas dinâmicas saberem se um slug é um município de
 * verdade. O slug usa o mesmo formato de `data/municipios/<uf>-<cidade>`, pra
 * uma cidade já publicada (como `sc-criciuma`) resolver pro mesmo id nos dois
 * lugares.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const URL_API = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome";
const DESTINO = join(process.cwd(), "data", "nacional", "municipios-ibge.json");

function paraSlug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const resposta = await fetch(URL_API);
  if (!resposta.ok) {
    throw new Error(`IBGE respondeu ${resposta.status}`);
  }
  const bruto = await resposta.json();
  const hoje = new Date().toISOString().slice(0, 10);

  const municipios = bruto
    .map((m) => {
      const uf = m["microrregiao"]?.["mesorregiao"]?.["UF"]?.["sigla"];
      if (!uf) return null;
      return {
        codigo_ibge: m.id,
        nome: m.nome,
        uf,
        slug: `${uf.toLowerCase()}-${paraSlug(m.nome)}`,
      };
    })
    .filter((m) => m !== null)
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const semDuplicata = new Set(municipios.map((m) => m.slug));
  if (semDuplicata.size !== municipios.length) {
    throw new Error("Slug duplicado no cadastro do IBGE — revisar antes de gravar.");
  }

  const dado = {
    municipios,
    proveniencia: [
      {
        fonte_nome: "API de Localidades do IBGE",
        fonte_url: URL_API,
        fonte_arquivo: null,
        fonte_data: hoje,
        extraido_em: hoje,
        verificado_em: hoje,
        metodo: "automatica",
      },
    ],
  };

  writeFileSync(DESTINO, JSON.stringify(dado, null, 2) + "\n", "utf8");
  console.log(`Gravado ${municipios.length} municípios em ${DESTINO}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
