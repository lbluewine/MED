/**
 * Gera data/municipios/<id>/farmacias-populares.json a partir do painel de
 * endereços do Programa Farmácia Popular.
 *
 *     node scripts/extrai-farmacias-pfpb.mjs [--municipio sc-criciuma] [--campos]
 *
 * Por que com navegador, e não com uma requisição:
 *
 * O painel é um Qlik Sense e o dado só sai pela Engine API, por WebSocket. A
 * borda do infoms.saude.gov.br devolve 403 a qualquer handshake que não venha
 * de uma página carregada — testado em 06/09/2026 em todos os caminhos de
 * proxy, com e sem cookie. A planilha equivalente no gov.br está despublicada
 * ("Conteúdo Restrito"), e a API do dados.gov.br exige chave pessoal.
 *
 * Então o script carrega o painel num Chromium e conversa com o Qlik de dentro
 * da própria página, que é onde a sessão é válida. Não burla nada: é o mesmo
 * caminho de quem abre o painel e clica em baixar, feito sem a pessoa.
 *
 * O que ele NÃO faz: coordenada. O app só tem ponto por município, não por
 * farmácia — logo o site publica endereço, e o mapa fica de fora. Pino errado
 * manda alguém à porta errada, e o schema exige pino conferido por gente.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const PAINEL =
  "https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_PFPB_ENDERECOS/index.html";
const NOME_FONTE =
  "Consulta de endereços das farmácias do PFPB — Ministério da Saúde";

/** Os nomes são os que o app declara. Rode com --campos para reconferir. */
const CAMPOS = {
  cnpj: "CNPJ",
  nome: "Farmácia",
  endereco: "Endereço",
  bairro: "Bairro",
  municipio: "Município",
  uf: "UF",
};

const argumentos = process.argv.slice(2);
const valor = (nome, padrao) => {
  const i = argumentos.indexOf(`--${nome}`);
  return i >= 0 && argumentos[i + 1] ? argumentos[i + 1] : padrao;
};
const municipioId = valor("municipio", "sc-criciuma");
const soCampos = argumentos.includes("--campos");

const raiz = process.cwd();
const municipio = JSON.parse(
  readFileSync(join(raiz, "data/municipios", municipioId, "municipio.json"), "utf8"),
);

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

try {
  await pagina.goto(PAINEL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await pagina.waitForFunction(() => globalThis.qlik?.currApp?.(), null, {
    timeout: 120000,
  });

  if (soCampos) {
    const campos = await pagina.evaluate(
      () =>
        new Promise((ok, falha) => {
          setTimeout(() => falha(new Error("tempo esgotado")), 60000);
          globalThis.qlik
            .currApp()
            .getList("FieldList", (r) =>
              ok(r.qFieldList.qItems.map((i) => `${String(i.qCardinal).padStart(7)}  ${i.qName}`)),
            );
        }),
    );
    console.log(`Campos do app:\n${campos.join("\n")}`);
    process.exit(0);
  }

  const resultado = await pagina.evaluate(
    async ({ campos, nomeMunicipio, uf }) => {
      const app = globalThis.qlik.currApp();
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));

      // Estado limpo antes de filtrar: o painel guarda seleção entre sessões,
      // e uma seleção herdada devolveria a lista de outra cidade.
      app.clearAll();
      await espera(1500);
      app.field(campos.uf).selectValues([{ qText: uf }], false, true);
      await espera(1500);
      app.field(campos.municipio).selectValues([{ qText: nomeMunicipio }], false, true);
      await espera(2500);

      const colunas = [campos.cnpj, campos.nome, campos.endereco, campos.bairro];
      // O motor limita a página a 10 mil células. Com 4 colunas, 2 mil linhas.
      const porPagina = 2000;

      const { modelo, primeira, total } = await new Promise((ok, falha) => {
        setTimeout(() => falha(new Error("o cubo não respondeu")), 90000);
        let entregue = false;
        app.createCube(
          {
            qDimensions: colunas.map((campo) => ({
              qDef: { qFieldDefs: [campo] },
              qNullSuppression: false,
            })),
            qMeasures: [],
            qInitialDataFetch: [
              { qTop: 0, qLeft: 0, qWidth: colunas.length, qHeight: porPagina },
            ],
            qSuppressZero: false,
            qSuppressMissing: false,
          },
          function (resposta) {
            if (entregue) return;
            entregue = true;
            ok({
              modelo: this,
              primeira: resposta.qHyperCube.qDataPages ?? [],
              total: resposta.qHyperCube.qSize.qcy,
            });
          },
        );
      });

      const linhas = [];
      const guarda = (paginas) => {
        for (const pagina of paginas)
          for (const matriz of pagina.qMatrix)
            linhas.push(
              matriz.map((c) => (c.qIsNull ? "" : String(c.qText ?? "").trim())),
            );
      };
      guarda(primeira);

      while (linhas.length < total) {
        const paginas = await modelo.getHyperCubeData("/qHyperCubeDef", [
          {
            qTop: linhas.length,
            qLeft: 0,
            qWidth: colunas.length,
            qHeight: Math.min(porPagina, total - linhas.length),
          },
        ]);
        const antes = linhas.length;
        guarda(paginas);
        if (linhas.length === antes) break;
      }

      // A data que o próprio painel anuncia como a do dado mais recente.
      const ate = await app.model.evaluateExpression(
        "Date(max(all [Data do Registro]), 'YYYY-MM-DD')",
      );

      return { linhas, total, ate: typeof ate === "string" ? ate : ate?.qReturn };
    },
    { campos: CAMPOS, nomeMunicipio: municipio.nome, uf: municipio.uf },
  );

  if (resultado.linhas.length === 0) {
    throw new Error(
      `o painel não devolveu nenhuma farmácia para ${municipio.nome}/${municipio.uf}. ` +
        "Rode com --campos: os nomes dos campos podem ter mudado.",
    );
  }

  // Uma rede pode ter o mesmo nome em endereços diferentes, e o mesmo CNPJ
  // não se repete. A chave é o CNPJ; sem ele, nome e endereço.
  const vistas = new Set();
  const farmacias = [];
  for (const [cnpj, nome, endereco, bairro] of resultado.linhas) {
    if (!nome || !endereco) continue;
    const chave = cnpj || `${nome}|${endereco}`;
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    farmacias.push({
      // O CNPJ é a chave: distingue duas lojas da mesma rede na mesma rua, e
      // é por ele que scripts/completa-cnpj-farmacias.mjs busca na Receita o
      // nome da placa e o endereço com número. O painel não dá nenhum dos dois.
      cnpj: cnpj || null,
      razao_social: nome,
      nome_fantasia: null,
      logradouro: endereco,
      complemento: null,
      bairro_painel: bairro || null,
      bairro: bairro || null,
      cep: null,
      geo: null,
      divergencias: [],
    });
  }

  // Por bairro, porque quem lê procura o mais perto de casa, não a ordem
  // alfabética da razão social.
  farmacias.sort(
    (a, b) =>
      (a.bairro ?? "").localeCompare(b.bairro ?? "", "pt-BR") ||
      a.razao_social.localeCompare(b.razao_social, "pt-BR") ||
      a.logradouro.localeCompare(b.logradouro, "pt-BR"),
  );

  const hoje = new Date().toISOString().slice(0, 10);
  const saida = join(raiz, "data/municipios", municipioId, "farmacias-populares.json");

  /*
    Quando a lista da cidade não mudou, só a data de conferência avança.

    Não é economia de diff: é o que os campos significam. `fonte_data` é a
    data da versão do dado, e a versão continua a mesma se nenhuma farmácia
    entrou nem saiu — mesmo que o painel nacional tenha registrado movimento
    em outro município. `verificado_em` é o que responde "isto ainda vale
    hoje", e esse sim avança toda semana. Ver docs/DADOS.md.

    O efeito prático é que o job semanal só abre pull request quando alguma
    farmácia de verdade entrou ou saiu.
  */
  const anterior = existsSync(saida)
    ? JSON.parse(readFileSync(saida, "utf8"))
    : null;
  /*
    A comparação é só do que vem do painel. O que a Receita completou
    (nome de fachada, número, CEP) fica de fora daqui e é preservado abaixo —
    senão toda semana o painel apagaria o cruzamento por CNPJ.
  */
  const doPainelSo = (lista) =>
    JSON.stringify(
      (lista ?? []).map((f) => [f.cnpj, f.razao_social, f.bairro_painel]),
    );
  const igual =
    anterior !== null && doPainelSo(anterior.farmacias) === doPainelSo(farmacias);

  if (anterior) {
    const jaCompletadas = new Map(
      anterior.farmacias.filter((f) => f.cnpj).map((f) => [f.cnpj, f]),
    );
    for (const f of farmacias) {
      const antes = f.cnpj ? jaCompletadas.get(f.cnpj) : undefined;
      if (!antes?.nome_fantasia && !antes?.complemento && !antes?.cep) continue;
      f.nome_fantasia = antes.nome_fantasia;
      f.logradouro = antes.logradouro;
      f.complemento = antes.complemento;
      f.bairro = antes.bairro;
      // bairro_painel é sempre o desta extração: é o dado de agora.
      f.cep = antes.cep;
      f.geo = antes.geo ?? null;
      f.divergencias = antes.divergencias ?? [];
    }
  }

  const doPainel = /^\d{4}-\d{2}-\d{2}$/.test(resultado.ate ?? "")
    ? resultado.ate
    : hoje;
  const fonteAnterior = anterior?.proveniencia?.[0];

  const dados = {
    municipio_id: municipioId,
    farmacias,
    proveniencia: [
      {
        fonte_nome: NOME_FONTE,
        fonte_url: PAINEL,
        fonte_arquivo: null,
        fonte_data: igual ? fonteAnterior.fonte_data : doPainel,
        extraido_em: igual ? fonteAnterior.extraido_em : hoje,
        verificado_em: hoje,
        metodo: "automatica",
      },
    ],
  };

  writeFileSync(saida, `${JSON.stringify(dados, null, 2)}\n`, "utf8");

  console.log(
    `data/municipios/${municipioId}/farmacias-populares.json: ` +
      `${farmacias.length} farmácias em ${municipio.nome}/${municipio.uf} ` +
      `(${resultado.total} linhas no painel, dados de ${dados.proveniencia[0].fonte_data})`,
  );

  if (igual) {
    console.log("\nNada mudou desde a última vez. Só a data de conferência avançou.");
  } else {
    const antes = new Set(
      (anterior?.farmacias ?? []).map((f) => `${f.razao_social}|${f.cnpj}`),
    );
    const agora = new Set(farmacias.map((f) => `${f.razao_social}|${f.cnpj}`));
    const entraram = [...agora].filter((c) => !antes.has(c));
    const sairam = [...antes].filter((c) => !agora.has(c));
    if (anterior) {
      console.log(`\nEntraram: ${entraram.length}. Saíram: ${sairam.length}.`);
      for (const c of entraram) console.log(`  + ${c.replace("|", " — ")}`);
      for (const c of sairam) console.log(`  - ${c.replace("|", " — ")}`);
    }
    console.log("\nConfira antes de aprovar:\n");
    for (const f of farmacias) {
      console.log(
        `  ${f.nome_fantasia ?? f.razao_social}\n      ${f.logradouro}` +
          `${f.bairro ? ` — ${f.bairro}` : ""}`,
      );
    }
  }
} finally {
  await navegador.close();
}
