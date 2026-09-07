import { notFound } from "next/navigation";
import Cartao, { Rotulo } from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";
import { itensDoPrincipio, type ItemPFPB } from "@/lib/farmacia-popular";
import { buscaRemedio, listaRemedios, paraSlug } from "@/lib/remedios";
import {
  EXIGENCIA,
  NOME_RECEITA,
  ONDE_RETIRAR,
  quemEntrega,
  validadeDaReceita,
} from "@/lib/rotulos";
import type { ItemRemume } from "@/lib/schema";

export function generateStaticParams() {
  return listaMunicipios().flatMap((municipio) =>
    listaRemedios(municipio).map((r) => ({ municipio, slug: r.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { municipio, slug } = await params;
  const remedio = buscaRemedio(municipio, slug);
  return { title: remedio ? `${remedio.nome} — Tem no SUS?` : "Tem no SUS?" };
}

/**
 * Apresentações que se retiram do mesmo jeito, num cartão só.
 *
 * Quando duas doses do mesmo medicamento saem no mesmo lugar e pedem a mesma
 * receita, dois cartões idênticos não ajudam ninguém a decidir nada — só fazem
 * a pessoa ler duas vezes para descobrir que era igual. O que muda entre elas
 * é a dose, e é isso que fica em destaque.
 *
 * Onde retirar e qual receita levar continuam abertos, nunca dobrados atrás de
 * clique: são eles que evitam a viagem perdida. Ver docs/LAYOUT.md.
 */
function Apresentacao({
  itens,
  municipioId,
  nomeCurto,
}: {
  /** Uma ou mais apresentações com exatamente a mesma forma de retirada. */
  itens: ItemRemume[];
  municipioId: string;
  /** Vai junto da dose para o cartão ser legível sozinho, e ao imprimir. */
  nomeCurto: string;
}) {
  const item = itens[0]!;
  const naUnidade = item.retirada === "usado_na_unidade";

  return (
    <Cartao as="article" className="px-6 py-6">
      {itens.length === 1 ? (
        <h3 className="text-xl font-bold">
          {nomeCurto} {item.apresentacao}
        </h3>
      ) : (
        <>
          <h3 className="text-xl font-bold">{nomeCurto}</h3>
          <ul className="mt-2.5">
            {itens.map((i) => (
              <li
                key={i.apresentacao}
                className="border-t border-divisoria py-2 text-[17px] font-semibold text-marca"
              >
                {i.apresentacao}
              </li>
            ))}
          </ul>
        </>
      )}

      {naUnidade ? (
        <p className="mt-4 rounded-r-lg border-l-4 border-[#b57505] bg-[#fdf5e6] px-4 py-3.5 leading-normal text-[#5a4413]">
          Não é para levar para casa. É aplicado dentro da unidade de saúde ou
          do pronto atendimento, quando o profissional decide que precisa. A
          fonte informa estes locais: {item.locais_texto}.
        </p>
      ) : (
        <div className="mt-4 grid gap-5 border-t border-divisoria pt-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          <div>
            <Rotulo>Onde retirar</Rotulo>
            {item.onde_retirar.length > 0 ? (
              <ul className="mt-1 leading-normal">
                {item.onde_retirar.map((tipo) => (
                  <li key={tipo} className="mt-1">
                    <a href={`/${municipioId}/onde-pegar#${tipo}`}>
                      {ONDE_RETIRAR[tipo]}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 leading-normal">
                A lista informa estes locais: {item.locais_texto}. Ligue antes
                de ir, para confirmar.
              </p>
            )}
          </div>
          <div>
            <Rotulo>Qual receita levar</Rotulo>
            {item.tipo_receita ? (
              <p className="mt-1 leading-normal">
                Uma {NOME_RECEITA[item.tipo_receita]} assinada pelo seu médico.{" "}
                {validadeDaReceita(item.tipo_receita)}
              </p>
            ) : (
              <p className="mt-1 leading-normal">
                A lista não diz qual receita esta apresentação precisa. Pergunte
                na farmácia antes de ir.
              </p>
            )}
          </div>
        </div>
      )}

      {item.observacoes && (
        <p className="mt-4 rounded-r-lg border-l-4 border-[#b57505] bg-[#fdf5e6] px-4 py-3.5 leading-normal text-[#5a4413]">
          <span aria-hidden="true">! </span>
          Tem uma regra a mais. A lista informa: {item.observacoes}. Pergunte na
          sua unidade de saúde o que precisa ser feito antes de retirar.
        </p>
      )}
    </Cartao>
  );
}

/**
 * O mesmo princípio ativo no elenco do Programa Farmácia Popular.
 *
 * Mostra o item **como o Ministério escreve**, com a dose. A pessoa compara
 * com a receita dela; o site não afirma que a apresentação daqui é a mesma
 * que a do posto, porque muitas vezes não é.
 */
function NaFarmaciaPopular({
  itens,
  /** A cidade também entrega? Muda o título e o que a pessoa precisa entender. */
  temNaCidade,
  /** A cidade aberta, para os links levarem as drogarias certas junto. */
  municipioId,
}: {
  itens: ItemPFPB[];
  temNaCidade: boolean;
  municipioId: string;
}) {
  return (
    <Cartao as="section" className="mt-4 border-[#ddd0f5] bg-[#faf7ff] px-6 py-5">
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#5b3aa6]">
        Programa federal
      </p>
      <h2 className="mt-1.5 text-[22px] font-bold text-marca">
        {temNaCidade
          ? "Também tem na Farmácia Popular"
          : "Tem na Farmácia Popular"}
      </h2>
      <p className="mt-2 max-w-[65ch] leading-normal text-[#33506f]">
        {temNaCidade
          ? "Fora do posto, este medicamento sai de graça na farmácia da rua que tenha o selo “Aqui Tem Farmácia Popular”. Leve a receita dentro da validade e um documento com foto e CPF."
          : "Para levar para casa, este medicamento sai de graça na farmácia da rua que tenha o selo “Aqui Tem Farmácia Popular”. Leve a receita dentro da validade e um documento com foto e CPF."}
      </p>
      <p className="mt-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-marca-fraca">
        No elenco do programa
      </p>
      <ul className="mt-1">
        {itens.map((item) => (
          <li
            key={item.texto}
            className="border-t border-divisoria py-2 leading-normal"
          >
            {item.texto}
          </li>
        ))}
      </ul>
      <p className="mt-3 max-w-[65ch] leading-normal text-texto-suave">
        Confira a dose na sua receita: a lista do programa é federal, e as
        apresentações nem sempre são as mesmas que a cidade entrega.
      </p>
      {/* Um por linha: dois links juntos numa frase viram um alvo só. */}
      <ul className="nao-imprime mt-4 leading-normal">
        <li className="border-t border-divisoria py-2">
          <a href={`/${municipioId}/farmacia-popular`}>Como funciona o programa</a>
        </li>
        <li className="border-t border-divisoria py-2">
          <a href={`/${municipioId}/farmacia-popular/farmacias`}>
            Onde tem farmácia credenciada
          </a>
        </li>
      </ul>
    </Cartao>
  );
}

function Visto() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-1 flex-none"
    >
      <circle cx="12" cy="12" r="9" fill="#e7f0fd" />
      <path d="m8 12.4 2.7 2.6L16 9.8" stroke="#1351b4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function PaginaRemedio({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { municipio: id, slug } = await params;
  if (!listaMunicipios().includes(id)) notFound();

  const remedio = buscaRemedio(id, slug);
  if (!remedio) notFound();

  const municipio = carregaMunicipio(id);
  const paraLevar = remedio.apresentacoes.filter((a) => a.retirada === "leva_para_casa");
  const tem = paraLevar.length > 0;

  // A exigência do item e a do município podem dizer a mesma coisa. Repetir
  // "leve a receita original" duas vezes na mesma lista confunde.
  const levar = [
    ...new Set([
      ...remedio.apresentacoes.flatMap((a) => a.exige).map((e) => EXIGENCIA[e]),
      ...municipio.exigencias_gerais,
    ]),
  ];
  const componentes = [...new Set(remedio.apresentacoes.map((a) => a.componente))];

  // O grupo em que a lista põe este medicamento. Quase sempre um só; quando a
  // fonte diverge entre apresentações, os dois aparecem: os dois são o dado.
  const classes = [
    ...new Map(
      remedio.apresentacoes
        .map((a) => a.classificacao)
        .filter((c): c is string => c !== null)
        .map((c) => [paraSlug(c), c]),
    ),
  ];

  const fontes = [
    ...new Map(
      remedio.apresentacoes.flatMap((a) => a.proveniencia).map((f) => [f.fonte_nome, f]),
    ).values(),
  ];

  /*
    Apresentações que se retiram do mesmo jeito vão para o mesmo cartão. A
    chave é tudo o que o cartão mostra: se dois itens têm o mesmo local, a
    mesma receita e a mesma observação, o cartão sairia idêntico duas vezes.

    A ordem da lista é preservada — a fonte já vem ordenada por dose, e é assim
    que a pessoa acha a linha da receita dela.
  */
  const grupos: ItemRemume[][] = [];
  const porForma = new Map<string, ItemRemume[]>();
  for (const item of remedio.apresentacoes) {
    const chave = JSON.stringify([
      item.retirada,
      [...item.onde_retirar].sort(),
      item.locais_texto,
      item.tipo_receita,
      item.observacoes,
    ]);
    const grupo = porForma.get(chave);
    if (grupo) grupo.push(item);
    else {
      const novo = [item];
      porForma.set(chave, novo);
      grupos.push(novo);
    }
  }

  const umCartao = grupos.length === 1;

  // O mesmo princípio ativo no programa federal. Vazio quando não há par: o
  // cruzamento só casa quando os princípios ativos batem exatamente.
  const noPopular = itensDoPrincipio(remedio.nome);

  return (
    <Pagina municipioId={id} atual="remedios">
      <Migalha
        itens={[
          { texto: "Início", href: "/" },
          { texto: "Medicamentos", href: `/${id}/remedios` },
          { texto: remedio.nome },
        ]}
      />

      <section
        className={`flex flex-wrap items-center justify-between gap-x-7 gap-y-5 rounded-2xl border px-8 py-7 ${
          tem ? "border-[#bfe3d0] bg-[#eaf7f0]" : "border-[#f0dcc0] bg-[#fdf5e6]"
        }`}
      >
        <div className="min-w-0 flex-1 basis-[340px]">
          {classes.length > 0 && (
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-marca-fraca">
              {classes.map(([slugClasse, nome], n) => (
                <span key={slugClasse}>
                  {n > 0 && " · "}
                  <a href={`/${id}/remedios/tipo/${slugClasse}`}>{nome}</a>
                </span>
              ))}
            </p>
          )}
          <h1 className="mt-2 text-[32px] font-bold leading-[1.1] tracking-tight text-marca md:text-[38px]">
            {remedio.nome}
          </h1>
          {remedio.grafias.length > 1 && (
            <p className="mt-2 text-[#33506f]">
              Também aparece na lista como {remedio.grafias.slice(1).join(", ")}.
            </p>
          )}
        </div>
        <div className="flex-none">
          <p
            className={`text-[38px] font-bold leading-none tracking-tight md:text-[44px] ${
              tem ? "text-tem" : "text-processo"
            }`}
          >
            <span aria-hidden="true">{tem ? "✓ " : "! "}</span>
            {tem ? "TEM" : "NA UNIDADE"}
          </p>
          <p className="mt-2 max-w-[30ch] text-[13.5px] font-semibold uppercase tracking-[0.08em] text-[#33506f]">
            {tem
              ? `no SUS em ${municipio.nome}`
              : "aplicado no posto, você não retira"}
          </p>
        </div>
      </section>

      <p className="mt-4 max-w-[70ch] text-texto-suave">
        {tem
          ? componentes.map((c) => quemEntrega(c, municipio.nome)).join(" ")
          : "Na unidade de saúde, este medicamento é aplicado ali mesmo: a lista da cidade não o entrega para levar para casa."}
      </p>

      {/*
        Quando a cidade só aplica na unidade, este cartão vem antes de tudo.
        Sem ele no topo, a pessoa lê "NA UNIDADE, você não retira" e vai embora
        achando que não tem jeito — quando tem, de graça, na farmácia da rua.
      */}
      {!tem && noPopular.length > 0 && (
        <div className="mt-4">
          <NaFarmaciaPopular itens={noPopular} temNaCidade={false} municipioId={id} />
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-start gap-7">
        <div className="min-w-0 flex-1 basis-[460px]">
          <h2 className="mb-3.5 text-[22px] font-bold text-marca">
            Forma de apresentação
          </h2>
          {tem && !umCartao && (
            <p className="mb-3.5 max-w-[65ch] text-texto-suave">
              A lista tem {remedio.apresentacoes.length}. Ache na sua receita
              qual é a sua — cada uma pode ser retirada num lugar diferente. A
              dose e a forma quem decide é o seu médico.
            </p>
          )}
          <div className="flex flex-col gap-3.5">
            {grupos.map((itens) => (
              <Apresentacao
                key={itens.map((i) => i.apresentacao).join("|")}
                itens={itens}
                municipioId={id}
                nomeCurto={remedio.nome_curto}
              />
            ))}
          </div>

          {tem && noPopular.length > 0 && (
            <NaFarmaciaPopular itens={noPopular} temNaCidade municipioId={id} />
          )}
        </div>

        {tem && (
          <aside className="min-w-0 flex-1 basis-[290px]">
            <Cartao className="px-6 py-5">
              <h2 className="mb-3 text-[18.5px] font-bold text-marca">O que levar</h2>
              <ul>
                {levar.map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-3 border-t border-divisoria py-2.5 leading-normal text-[#33506f]"
                  >
                    <Visto />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Cartao>
          </aside>
        )}
      </div>

      {/* No fim da página, não na lateral: é rodapé de procedência, não conteúdo. */}
      <NotaFonte
        proveniencia={fontes}
        telefone={municipio.telefone_assistencia_farmaceutica}
      />
    </Pagina>
  );
}
