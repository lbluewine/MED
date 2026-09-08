/**
 * Põe no mapa as farmácias credenciadas, casando o endereço com o cadastro do
 * IBGE.
 *
 *     node scripts/geocodifica-farmacias.mjs [--municipio sc-criciuma] [--refazer]
 *
 * O CNEFE — Cadastro Nacional de Endereços para Fins Estatísticos, do Censo
 * 2022 — tem uma linha por endereço da cidade, com CEP, tipo e nome do
 * logradouro, número e coordenada. É o recenseador que registrou o ponto na
 * porta. Um arquivo por município; o de Criciúma tem 2,2 MB e fica guardado em
 * `data/fontes/nacional/`, como toda fonte deste projeto.
 *
 * Isto só ficou possível depois do cruzamento por CNPJ: o painel do Ministério
 * dá o nome da rua, e sem número não há o que casar.
 *
 * Duas qualidades de resultado, e a tela distingue as duas:
 *
 * - **`numero`**: o cadastro tem aquele número naquela rua. É a porta.
 * - **`aproximada`**: o cadastro não tem aquele número, então o ponto sai
 *   interpolado entre os dois números vizinhos que ele tem. A farmácia está
 *   naquele trecho da rua. Interpolar é bem melhor que pegar o vizinho mais
 *   próximo: na Avenida Universitária o vizinho mais perto do 2210 é o 1711,
 *   meio quilômetro antes, e entre 1711 e 2380 o ponto cai quase no lugar.
 *
 * O que nem interpolado sai — rua que o cadastro não conhece — fica na lista,
 * com endereço, e fora do mapa.
 *
 * Antes disto tentei geocodificar pelo Nominatim e pela coordenada de CEP da
 * BrasilAPI. Deu 1 endereço em 34: o OpenStreetMap não tem numeração de casas
 * na cidade, e a coordenada por CEP cai no centro do município em metade dos
 * casos. Está registrado em `data/fontes/FONTES.md` para ninguém tentar de
 * novo achando que é rápido.
 */
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { spawn } from "node:child_process";

const FONTE = "CNEFE — Cadastro Nacional de Endereços, Censo 2022 (IBGE)";
const URL_FONTE =
  "https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/" +
  "Censo_Demografico_2022/Arquivos_CNEFE/CSV/Municipio/";

/**
 * Palavras que não distinguem uma rua de outra. Sem tirá-las, "RUA GAL.
 * OSVALDO PINTO DA VEIGA" e "GENERAL OSVALDO PINTO DA VEIGA" não se casariam.
 */
const VAZIAS = new Set([
  "rua", "avenida", "av", "praca", "rodovia", "travessa", "estrada", "alameda",
  "servidao", "linha", "doutor", "dr", "general", "gal", "coronel", "cel",
  "professor", "prof", "presidente", "sao", "santa", "santo", "nossa",
  "senhora", "de", "da", "do", "dos", "das", "e",
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

const arquivoCnefe = join(
  raiz,
  "data/fontes/nacional",
  `cnefe-${municipio.ibge}-${municipioId.split("-").slice(1).join("-")}.zip`,
);
if (!existsSync(arquivoCnefe)) {
  console.error(
    `Não achei ${arquivoCnefe}.\n\n` +
      `Baixe o CNEFE deste município em:\n  ${URL_FONTE}<UF>/${municipio.ibge}_<NOME>.zip\n` +
      "e guarde com esse nome, junto do .sha256.",
  );
  process.exit(1);
}

const semAcento = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const palavras = (texto) =>
  new Set(
    semAcento(texto)
      .replace(/[^A-Z0-9]+/g, " ")
      .split(" ")
      .filter((p) => p.length >= 3 && !VAZIAS.has(p.toLowerCase())),
  );

/**
 * Quanto duas escritas do mesmo logradouro se parecem.
 *
 * Uma palavra em comum não basta: "Praça Dr. Nereu Ramos" e "Rua Nereu Alfredo
 * Villain" compartilham "NEREU" e são ruas diferentes, a dois quilômetros uma
 * da outra. Esse erro aconteceu aqui antes de existir esta função.
 */
function seParecem(alvo, doCadastro) {
  if (alvo.size === 0 || doCadastro.size === 0) return { alguma: false, todas: false };
  let comuns = 0;
  for (const p of alvo) if (doCadastro.has(p)) comuns++;
  return { alguma: comuns > 0, todas: comuns === alvo.size };
}

/** Número comparável: "07" e "7" são o mesmo; "1.575" e "1575" também. */
const numeroLimpo = (n) => String(n ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");

/** O que procurar. Sem CEP no índice: o CEP da Receita nem sempre é o do IBGE. */
const procurados = [];
for (const farmacia of dados.farmacias) {
  if (farmacia.geo && !refazer) continue;
  const partes = farmacia.logradouro.split(",");
  const numero = partes.length > 1 ? Number(numeroLimpo(partes.pop())) : NaN;
  if (!Number.isFinite(numero)) continue;
  // Refazer é para corrigir: o ponto antigo sai antes, senão um casamento que
  // hoje é recusado continuaria no arquivo por ter passado ontem.
  if (refazer) farmacia.geo = null;
  procurados.push({
    farmacia,
    palavrasDaRua: palavras(partes.join(",")),
    numero,
    cep: (farmacia.cep ?? "").replace(/\D/g, ""),
    /** Endereços do cadastro no mesmo CEP: a rua certa, sem dúvida. */
    doCep: [],
    /** Endereços na mesma rua por nome inteiro, quando o CEP não ajuda. */
    naRua: [],
  });
}

if (procurados.length === 0) {
  console.log("Nada a fazer: todas já têm ponto, ou nenhuma tem número no endereço.");
  process.exit(0);
}

// O zip tem um CSV só, de 17 MB. Ler por linha, sem carregar tudo na memória.
const descompacta = spawn("unzip", ["-p", arquivoCnefe]);
descompacta.on("error", () => {
  console.error("Preciso do unzip para ler o CNEFE.");
  process.exit(1);
});

const linhas = createInterface({ input: descompacta.stdout, crlfDelay: Infinity });

let colunas = null;
const hoje = new Date().toISOString().slice(0, 10);

for await (const linha of linhas) {
  const campos = linha.split(";");
  if (!colunas) {
    colunas = Object.fromEntries(campos.map((c, i) => [c.trim(), i]));
    continue;
  }

  const rua = (campos[colunas.NOM_SEGLOGR] ?? "").trim();
  if (!rua) continue;
  const numero = Number(numeroLimpo(campos[colunas.NUM_ENDERECO]));
  if (!Number.isFinite(numero)) continue;
  const lat = Number(campos[colunas.LATITUDE]);
  const lng = Number(campos[colunas.LONGITUDE]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

  const daLinha = palavras(rua);
  const cep = (campos[colunas.CEP] ?? "").trim();

  for (const alvo of procurados) {
    const parecidas = seParecem(alvo.palavrasDaRua, daLinha);
    if (!parecidas.alguma) continue;

    /*
      Duas portas de entrada, e a segunda é a estrita:

      - Mesmo CEP: o CEP já prova que é a rua certa, então uma palavra em
        comum resolve a diferença de grafia ("VALENTIM" e "VALENTIN").
      - CEP que o cadastro não conhece: aí só entra quem tem **todas** as
        palavras do endereço procurado. É o que separa "Nereu Ramos" de
        "Nereu Alfredo Villain".
    */
    if (cep === alvo.cep) alvo.doCep.push({ numero, lat, lng });
    else if (parecidas.todas) alvo.naRua.push({ numero, lat, lng });
  }
}

let exatas = 0;
let aproximadas = 0;
const semRua = [];

for (const alvo of procurados) {
  // O CEP estreita a busca ao trecho certo da rua. Sem ele, a rua inteira.
  const base = alvo.doCep.length > 0 ? alvo.doCep : alvo.naRua;
  if (base.length === 0) {
    semRua.push(alvo.farmacia);
    continue;
  }

  const exato = base.find((e) => e.numero === alvo.numero);
  if (exato) {
    alvo.farmacia.geo = {
      lat: exato.lat,
      lng: exato.lng,
      fonte: FONTE,
      precisao: "numero",
      obtido_em: hoje,
    };
    exatas++;
    continue;
  }

  // Os dois vizinhos que cercam o número procurado.
  let antes = null;
  let depois = null;
  for (const e of base) {
    if (e.numero < alvo.numero && (!antes || e.numero > antes.numero)) antes = e;
    if (e.numero > alvo.numero && (!depois || e.numero < depois.numero)) depois = e;
  }

  let ponto;
  if (antes && depois) {
    // Interpolação: onde o número cai entre um vizinho e o outro.
    const fracao = (alvo.numero - antes.numero) / (depois.numero - antes.numero);
    ponto = {
      lat: antes.lat + (depois.lat - antes.lat) * fracao,
      lng: antes.lng + (depois.lng - antes.lng) * fracao,
    };
  } else {
    // Só há vizinho de um lado: o mais próximo é o melhor palpite honesto.
    const perto = antes ?? depois;
    ponto = { lat: perto.lat, lng: perto.lng };
  }

  alvo.farmacia.geo = {
    ...ponto,
    fonte: FONTE,
    precisao: "aproximada",
    obtido_em: hoje,
  };
  aproximadas++;
}

const achadas = exatas + aproximadas;

if (achadas > 0 || refazer) {
  const outras = dados.proveniencia.filter((f) => f.fonte_nome !== FONTE);
  dados.proveniencia = [
    ...outras,
    {
      fonte_nome: FONTE,
      fonte_url: URL_FONTE,
      fonte_arquivo: `fontes/nacional/${arquivoCnefe.split("/").pop()}`,
      fonte_data: "2022-08-01",
      extraido_em: hoje,
      verificado_em: hoje,
      metodo: "automatica",
    },
  ];
  writeFileSync(caminho, `${JSON.stringify(dados, null, 2)}\n`, "utf8");
}

const comPonto = dados.farmacias.filter((f) => f.geo).length;
const total = dados.farmacias.length;
console.log(
  `${achadas} endereço(s) localizado(s) agora: ${exatas} no número exato do ` +
    `cadastro, ${aproximadas} interpolado(s) entre os números vizinhos.`,
);
console.log(
  `${comPonto} de ${total} farmácias têm ponto no mapa.`,
);
if (semRua.length > 0) {
  console.log(
    `\n${semRua.length} sem ponto: o cadastro do IBGE não conhece a rua.\n` +
      "Ficam na lista, com endereço.",
  );
  for (const f of semRua) {
    console.log(`  ${f.nome_fantasia ?? f.razao_social} — ${f.logradouro}`);
  }
}
