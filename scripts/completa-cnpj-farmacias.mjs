/**
 * Completa as farmácias credenciadas com o cadastro público de CNPJ.
 *
 *     node scripts/completa-cnpj-farmacias.mjs [--municipio sc-criciuma] [--refazer]
 *
 * O painel do Ministério publica só a razão social e o nome da rua. Ninguém
 * procura "CIA LATINO AMERICANA DE MEDICAMENTOS" na esquina, e rua sem número
 * não leva ninguém à porta. O CNPJ que o painel traz resolve as duas coisas:
 * no cadastro da Receita Federal estão o nome de fachada, o tipo do
 * logradouro, o número, o complemento e o CEP.
 *
 * Duas travas, porque endereço errado manda gente ao lugar errado:
 *
 * 1. O cadastro precisa ser do mesmo município e estar ATIVO.
 * 2. A rua da Receita precisa ter alguma palavra em comum com a rua do painel.
 *    Um CNPJ trocado cairia numa rua sem nenhuma palavra em comum, e aí o
 *    registro fica como está, com o aviso na saída.
 *
 * Onde as duas fontes discordam sem ser erro — "GAL." e "GENERAL", "NSA. SRA."
 * e "NOSSA SENHORA" — vale a Receita, que é o endereço de registro e combina
 * com o CEP. Quando discordam de verdade, a diferença vai para `divergencias`
 * e aparece na tela: o site não escolhe uma fonte e esconde a outra.
 *
 * Só consulta o que ainda não foi completado. Com --refazer, consulta tudo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const API = "https://brasilapi.com.br/api/cnpj/v1";
const NOME_FONTE = "Cadastro Nacional da Pessoa Jurídica — Receita Federal";
const URL_FONTE = "https://brasilapi.com.br/docs#tag/CNPJ";
const UA =
  "tem-no-sus/0.0 (projeto voluntario de informacao publica de saude; " +
  "+https://github.com/lbluewine/MED)";

/** Uma consulta por segundo. A API é pública e de graça; não se abusa. */
const INTERVALO = 1200;

/**
 * Palavras que não distinguem um logradouro de outro. Ficam de fora da
 * comparação entre as duas fontes: sem isso, "RUA DOUTOR NEREU RAMOS" e
 * "PRACA DR. NEREU RAMOS" pareceriam ruas diferentes.
 */
const VAZIAS = new Set([
  "rua", "avenida", "av", "praca", "praça", "rodovia", "travessa", "servidao",
  "estrada", "alameda", "doutor", "dr", "general", "gal", "coronel", "cel",
  "professor", "prof", "nossa", "senhora", "nsa", "sra", "santa", "santo",
  "sao", "de", "da", "do", "dos", "das", "e",
]);

const argumentos = process.argv.slice(2);
const valor = (nome, padrao) => {
  const i = argumentos.indexOf(`--${nome}`);
  return i >= 0 && argumentos[i + 1] ? argumentos[i + 1] : padrao;
};
const municipioId = valor("municipio", "sc-criciuma");
const refazer = argumentos.includes("--refazer");

const raiz = process.cwd();
const caminho = join(raiz, "data/municipios", municipioId, "farmacias-populares.json");
const municipio = JSON.parse(
  readFileSync(join(raiz, "data/municipios", municipioId, "municipio.json"), "utf8"),
);
const dados = JSON.parse(readFileSync(caminho, "utf8"));

const semAcento = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const significativas = (texto) =>
  new Set(
    semAcento(texto)
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((p) => p.length >= 3 && !VAZIAS.has(p)),
  );

/** Falam do mesmo lugar? Basta uma palavra que importe em comum. */
function mesmoLugar(a, b) {
  const pa = significativas(a);
  const pb = significativas(b);
  if (pa.size === 0 || pb.size === 0) return true;
  for (const p of pa) if (pb.has(p)) return true;
  return false;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const hoje = new Date().toISOString().slice(0, 10);

let completadas = 0;
let recusadas = 0;
const avisos = [];

for (const farmacia of dados.farmacias) {
  if (!farmacia.cnpj) continue;
  const jaTem = farmacia.nome_fantasia || farmacia.cep || farmacia.complemento;
  if (jaTem && !refazer) continue;

  let cadastro;
  try {
    const resposta = await fetch(`${API}/${farmacia.cnpj}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    cadastro = await resposta.json();
  } catch (erro) {
    avisos.push(`${farmacia.razao_social}: não consultei (${erro.message}).`);
    await espera(INTERVALO);
    continue;
  }
  await espera(INTERVALO);

  // Trava 1: é mesmo um estabelecimento desta cidade, e está ativo?
  if (!mesmoLugar(cadastro.municipio, municipio.nome) || cadastro.uf !== municipio.uf) {
    avisos.push(
      `${farmacia.razao_social}: a Receita diz ${cadastro.municipio}/${cadastro.uf}, ` +
        `não ${municipio.nome}/${municipio.uf}. Deixei como estava.`,
    );
    recusadas++;
    continue;
  }
  if (cadastro.descricao_situacao_cadastral !== "ATIVA") {
    avisos.push(
      `${farmacia.razao_social}: CNPJ ${cadastro.descricao_situacao_cadastral} na ` +
        "Receita, mas o painel a lista como credenciada. Confira antes de publicar.",
    );
  }

  // Trava 2: a rua da Receita conversa com a rua do painel?
  if (!mesmoLugar(cadastro.logradouro, farmacia.logradouro)) {
    avisos.push(
      `${farmacia.razao_social}: o painel informa "${farmacia.logradouro}" e a ` +
        `Receita "${cadastro.logradouro}". Nada em comum — deixei como estava.`,
    );
    recusadas++;
    continue;
  }

  const enderecoAntes = farmacia.logradouro;
  const tipo = (cadastro.descricao_tipo_de_logradouro ?? "").trim();
  const rua = [tipo, cadastro.logradouro].filter(Boolean).join(" ").trim();
  // A Receita às vezes devolve o número com separador de milhar ("3.420").
  // Tirar o ponto é formatação, não mudança de dado.
  const numero = String(cadastro.numero ?? "")
    .trim()
    .replace(/^(\d{1,3})(?:\.(\d{3}))+$/, (todo) => todo.replace(/\./g, ""));

  const divergencias = [];
  // Sempre o valor do painel, nunca o resultado da última execução: senão
  // rodar de novo compararia a Receita com ela mesma e apagaria a divergência.
  const bairroPainel = farmacia.bairro_painel ?? farmacia.bairro;
  const bairroReceita = (cadastro.bairro ?? "").trim() || null;
  if (bairroPainel && bairroReceita && !mesmoLugar(bairroPainel, bairroReceita)) {
    divergencias.push(
      `O painel do Ministério informa este endereço no bairro ${bairroPainel}, ` +
        `e a Receita Federal no bairro ${bairroReceita}.`,
    );
  }

  farmacia.razao_social = cadastro.razao_social ?? farmacia.razao_social;
  farmacia.nome_fantasia = (cadastro.nome_fantasia ?? "").trim() || null;
  farmacia.logradouro = numero ? `${rua}, ${numero}` : rua;
  const mudouEndereco = farmacia.logradouro !== enderecoAntes;
  farmacia.complemento = (cadastro.complemento ?? "").trim() || null;
  farmacia.bairro = bairroReceita ?? bairroPainel;
  const cep = String(cadastro.cep ?? "").replace(/\D/g, "");
  farmacia.cep = cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : null;
  farmacia.divergencias = divergencias;
  // Endereço novo invalida a coordenada antiga: quem geocodifica é o outro
  // script, e ele precisa saber que este registro mudou de lugar.
  if (mudouEndereco) farmacia.geo = null;
  completadas++;
}

if (completadas > 0) {
  const outras = dados.proveniencia.filter((f) => f.fonte_nome !== NOME_FONTE);
  dados.proveniencia = [
    ...outras,
    {
      fonte_nome: NOME_FONTE,
      fonte_url: URL_FONTE,
      fonte_arquivo: null,
      fonte_data: hoje,
      extraido_em: hoje,
      verificado_em: hoje,
      metodo: "automatica",
    },
  ];
  writeFileSync(caminho, `${JSON.stringify(dados, null, 2)}\n`, "utf8");
}

console.log(
  `${completadas} farmácia(s) completada(s) pelo CNPJ, ${recusadas} recusada(s).`,
);
if (avisos.length > 0) {
  console.log("\nO que precisa de olho humano:\n");
  for (const a of avisos) console.log(`  ${a}`);
}

const semFachada = dados.farmacias.filter((f) => !f.nome_fantasia);
if (semFachada.length > 0) {
  console.log(
    `\n${semFachada.length} sem nome de fachada na Receita — a tela mostra a ` +
      "razão social nessas:",
  );
  for (const f of semFachada) console.log(`  ${f.razao_social}`);
}
