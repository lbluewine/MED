import { notFound } from "next/navigation";
import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import Pagina from "@/components/Pagina";
import { listaClasses } from "@/lib/classes";
import { FORA_DA_LISTA_MUNICIPAL, NOME_UNIDADE_CURTO } from "@/lib/rotulos";
import type { Remedio } from "@/lib/remedios";
import type { TipoUnidade } from "@/lib/schema";

/**
 * Em que balcões da cidade este medicamento sai.
 *
 * Sem repetir: a fonte informa por apresentação, e quase sempre todas saem nos
 * mesmos lugares. A ordem é a mesma do resto do site — ver `ORDEM_UNIDADES` em
 * `components/MenuLateral.tsx`.
 */
function balcoesDe(remedio: Remedio): TipoUnidade[] {
  const vistos = new Set<TipoUnidade>();
  for (const a of remedio.apresentacoes) {
    for (const tipo of a.onde_retirar) vistos.add(tipo);
  }
  return [...vistos];
}
import { carregaMunicipio, carregaRemume, listaMunicipios, resolveMunicipio } from "@/lib/dados";
import { listaCidadeComPisoNacional, listaRemedios } from "@/lib/remedios";
import { medicamentosRename } from "@/lib/rename";
import RemediosRename from "@/components/RemediosRename";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

// Cidade sem lista própria também tem A–Z: o piso da RENAME. Ver a nota em
// `RemediosRename`.
export const dynamicParams = true;

/** Lista A a Z. É o caminho de quem está sem JavaScript ou prefere olhar tudo. */
export default async function Remedios({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio: id } = await params;

  if (!listaMunicipios().includes(id)) {
    // Sem REMUME própria, a lista que existe é a nacional. Só cidade que
    // existe no cadastro do IBGE chega aqui; o resto é 404.
    const resolvido = resolveMunicipio(id);
    if (!resolvido) notFound();
    const medicamentos = medicamentosRename();
    if (medicamentos.length === 0) notFound();
    return (
      <RemediosRename
        municipioId={id}
        municipioNome={resolvido.municipio.nome}
        medicamentos={medicamentos}
      />
    );
  }

  const municipio = carregaMunicipio(id);
  const remedios = listaRemedios(id);
  const classes = listaClasses(id);
  const apresentacoes = carregaRemume(id).length;

  /*
    A lista da prefeitura mais o piso nacional, numa lista só. Quem procura um
    medicamento quer saber se tem, e obrigar a olhar duas telas faz desistir.
    A marca ao lado do nome é que diz o que esperar de cada um.
  */
  const itens = listaCidadeComPisoNacional(id);
  const soNacionais = itens.filter((i) => i.tipo === "nacional").length;

  const porLetra = new Map<string, typeof itens>();
  for (const item of itens) {
    const letra = item.slug[0]!.toUpperCase();
    porLetra.set(letra, [...(porLetra.get(letra) ?? []), item]);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <Pagina municipioId={id} atual="remedios">
      <Migalha
        itens={[{ texto: "Início", href: "/" }, { texto: "Medicamentos A–Z" }]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Medicamentos de A a Z
      </h1>
      <p className="mt-1.5 max-w-[70ch] text-texto-suave">
        Os {remedios.length} medicamentos da lista de {municipio.nome}, em{" "}
        {apresentacoes} apresentações, mais {soNacionais} que o SUS garante em
        qualquer cidade do Brasil e a lista daqui não traz. Se preferir olhar
        por grupo, veja <a href={`/${id}/remedios/tipos`}>os {classes.length} tipos</a>.
      </p>

      {soNacionais > 0 && (
        <Cartao as="section" className="mt-5 px-6 py-5">
          <h2 className="text-[19px] font-bold text-marca">
            O que a marca ao lado do nome quer dizer
          </h2>
          <p className="mt-1.5 max-w-[70ch] leading-normal text-texto-suave">
            A marca diz onde o medicamento sai. Em{" "}
            <span className="mx-0.5 whitespace-nowrap rounded-full bg-[#eaf3ec] px-2 py-0.5 text-[12px] font-semibold text-[#1a6b45]">
              verde
            </span>{" "}
            estão os balcões de {municipio.nome}, para o que está na lista da
            prefeitura — e{" "}
            <span className="mx-0.5 whitespace-nowrap rounded-full bg-marca-veu px-2 py-0.5 text-[12px] font-semibold text-texto-suave">
              usado na unidade
            </span>{" "}
            quer dizer que ele é aplicado lá mesmo, não é para levar para casa.
            Em azul e laranja, os que o SUS garante em qualquer cidade do Brasil
            mas a lista daqui não traz:
          </p>
          <ul className="mt-3 max-w-[70ch]">
            {(["basico", "estrategico", "especializado"] as const).map((c) => (
              <li
                key={c}
                className="border-t border-divisoria py-2.5 leading-normal"
              >
                <span
                  className={`mr-2 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                    c === "especializado"
                      ? "bg-[#fdf0dc] text-[#8a5a10]"
                      : "bg-marca-suave text-marca-link"
                  }`}
                >
                  {FORA_DA_LISTA_MUNICIPAL[c].marca}
                </span>
                {FORA_DA_LISTA_MUNICIPAL[c].explicacao}
                {c === "especializado" && (
                  <>
                    {" "}
                    <a href={`/${id}/alto-custo`}>Veja como abrir o pedido</a>.
                  </>
                )}
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <Cartao className="nao-imprime mb-5 mt-5 flex flex-wrap gap-1.5 px-4 py-3.5">
        {letras.map((l) => (
          <a
            key={l}
            href={`#letra-${l}`}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg font-semibold text-marca-link no-underline hover:bg-marca-link hover:text-white"
          >
            {l}
          </a>
        ))}
      </Cartao>

      <div className="flex flex-col gap-3.5">
        {letras.map((l) => (
          <Cartao
            as="section"
            key={l}
            className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-4 px-6 pb-2 pt-5"
          >
            <h2
              id={`letra-${l}`}
              aria-label={`Letra ${l}`}
              className="scroll-mt-6 text-[34px] font-bold leading-none text-letra-fantasma"
            >
              {l}
            </h2>
            <div className="columns-1 gap-9 md:columns-2">
              {porLetra.get(l)!.map((item) =>
                item.tipo === "municipal" ? (
                  <a
                    key={`m-${item.slug}`}
                    href={`/${id}/remedio/${item.slug}`}
                    className="flex break-inside-avoid items-baseline justify-between gap-3 border-b border-divisoria py-2.5 text-texto no-underline hover:text-marca-link"
                  >
                    <span>
                      {item.nome}{" "}
                      {/*
                        O balcão também aparece nos da lista da prefeitura, e
                        não só nos do piso nacional: sem isso metade da lista
                        ficava sem dizer onde se retira, e a marca parecia
                        aviso de problema em vez de informação de lugar.
                      */}
                      {balcoesDe(item.remedio).map((tipo) => (
                        <span
                          key={tipo}
                          className="mr-1 inline-block whitespace-nowrap rounded-full bg-[#eaf3ec] px-2 py-0.5 text-[12px] font-semibold text-[#1a6b45]"
                        >
                          {NOME_UNIDADE_CURTO[tipo].toLowerCase()}
                        </span>
                      ))}
                      {/*
                        Sem balcão porque não se retira: é aplicado ali mesmo.
                        Os 38 itens da lista sem local mapeado são todos
                        `usado_na_unidade`, e mandar alguém buscá-los é a
                        viagem perdida que o schema manda evitar.
                      */}
                      {!item.remedio.tem_para_levar && (
                        <span className="mr-1 inline-block whitespace-nowrap rounded-full bg-marca-veu px-2 py-0.5 text-[12px] font-semibold text-texto-suave">
                          usado na unidade
                        </span>
                      )}
                    </span>
                    <span className="flex-none font-mono text-sm text-seta">
                      {item.remedio.apresentacoes.length}
                    </span>
                  </a>
                ) : (
                  /*
                    Leva à página do piso nacional: não temos a ficha municipal
                    dele, mas temos por qual balcão sai, em que apresentações e,
                    no alto custo, para quais doenças o pedido é aberto.
                  */
                  <a
                    key={`n-${item.slug}`}
                    href={`/${id}/piso-nacional/${item.slug}`}
                    className="block break-inside-avoid border-b border-divisoria py-2.5 no-underline"
                  >
                    <span className="text-texto-suave hover:text-marca-link">
                      {item.nome}
                    </span>{" "}
                    {/*
                      A marca é a do componente, não uma só para todos: 175
                      destes são de alto custo e 149 vêm de programa federal.
                      Dizer "pergunte na sua unidade" para os de alto custo
                      mandava a pessoa ao balcão errado.
                    */}
                    {item.componentes.map((componente) => (
                      <span
                        key={componente}
                        className={`mr-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                          componente === "especializado"
                            ? "bg-[#fdf0dc] text-[#8a5a10]"
                            : "bg-marca-suave text-marca-link"
                        }`}
                      >
                        {FORA_DA_LISTA_MUNICIPAL[componente].marca}
                      </span>
                    ))}
                  </a>
                ),
              )}
            </div>
          </Cartao>
        ))}
      </div>
    </Pagina>
  );
}
