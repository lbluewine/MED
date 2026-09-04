import { notFound } from "next/navigation";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import Resposta from "@/components/Resposta";
import { carregaMunicipio, carregaUnidades, listaMunicipios } from "@/lib/dados";
import { buscaRemedio, listaRemedios, paraSlug } from "@/lib/remedios";
import {
  EXIGENCIA,
  NOME_RECEITA,
  ONDE_RETIRAR,
  quemEntrega,
  validadeDaReceita,
} from "@/lib/rotulos";
import type { ItemRemume, TipoUnidade } from "@/lib/schema";

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

function Apresentacao({
  item,
  unidadesPorTipo,
}: {
  item: ItemRemume;
  unidadesPorTipo: Map<TipoUnidade, string[]>;
}) {
  return (
    <li className="mt-6 border-t border-linha pt-4">
      <h3 className="text-[20px] font-bold">{item.apresentacao}</h3>

      {item.retirada === "usado_na_unidade" ? (
        <p className="mt-2 max-w-[65ch] border-l-4 border-processo pl-4">
          Este não é para levar para casa. Ele é aplicado dentro da unidade de
          saúde ou do pronto atendimento, quando o profissional decide que
          precisa. A fonte informa estes locais: {item.locais_texto}.
        </p>
      ) : (
        <>
          <p className="mt-2 font-bold">Onde retirar</p>
          {item.onde_retirar.length > 0 ? (
            <ul className="mt-1 max-w-[65ch] list-disc pl-6">
              {item.onde_retirar.map((tipo) => (
                <li key={tipo} className="mt-1">
                  {ONDE_RETIRAR[tipo]}
                  {unidadesPorTipo.get(tipo)?.length
                    ? ` (são ${unidadesPorTipo.get(tipo)!.length} na cidade)`
                    : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 max-w-[65ch]">
              A lista informa estes locais: {item.locais_texto}. Ligue antes de
              ir, para confirmar.
            </p>
          )}
        </>
      )}

      {item.retirada === "leva_para_casa" && (
        <>
          <p className="mt-3 font-bold">Que receita levar</p>
          {item.tipo_receita ? (
            <p className="mt-1 max-w-[65ch]">
              Uma {NOME_RECEITA[item.tipo_receita]}.{" "}
              {validadeDaReceita(item.tipo_receita)}
            </p>
          ) : (
            <p className="mt-1 max-w-[65ch]">
              A lista não diz qual receita este remédio precisa. Pergunte na
              farmácia antes de ir.
            </p>
          )}
        </>
      )}

      {item.observacoes && (
        <div className="mt-3 max-w-[65ch] border-l-4 border-processo pl-4">
          <p className="font-bold">
            <span aria-hidden="true">! </span>
            Este remédio tem uma regra a mais
          </p>
          <p className="mt-1">
            A lista informa: {item.observacoes}. Pergunte na sua unidade de
            saúde o que precisa ser feito antes de retirar.
          </p>
        </div>
      )}
    </li>
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
  const unidades = carregaUnidades(id);

  const unidadesPorTipo = new Map<TipoUnidade, string[]>();
  for (const u of unidades) {
    unidadesPorTipo.set(u.tipo, [...(unidadesPorTipo.get(u.tipo) ?? []), u.nome]);
  }

  const paraLevar = remedio.apresentacoes.filter((a) => a.retirada === "leva_para_casa");

  // A exigência do item e a do município podem dizer a mesma coisa. Repetir
  // "leve a receita original" duas vezes na mesma lista confunde.
  const levar = [
    ...new Set([
      ...remedio.apresentacoes.flatMap((a) => a.exige).map((e) => EXIGENCIA[e]),
      ...municipio.exigencias_gerais,
    ]),
  ];
  const componentes = [...new Set(remedio.apresentacoes.map((a) => a.componente))];

  // O grupo em que a lista põe este remédio. Quase sempre um só; quando a fonte
  // diverge entre apresentações, os dois aparecem, porque os dois são o dado.
  const classes = [
    ...new Map(
      remedio.apresentacoes
        .map((a) => a.classificacao)
        .filter((c): c is string => c !== null)
        .map((c) => [paraSlug(c), c]),
    ),
  ];

  // Todas as fontes que sustentam esta página, sem repetir.
  const fontes = [
    ...new Map(
      remedio.apresentacoes
        .flatMap((a) => a.proveniencia)
        .map((f) => [f.fonte_nome, f]),
    ).values(),
  ];

  return (
    <Pagina municipioId={id} atual="remedios">
      <h1 className="text-[30px] font-bold leading-tight">{remedio.nome}</h1>
      {remedio.grafias.length > 1 && (
        <p className="mt-1 text-texto-suave">
          Também aparece na lista como {remedio.grafias.slice(1).join(", ")}.
        </p>
      )}

      <div className="mt-6">
        {paraLevar.length > 0 ? (
          <Resposta
            tom="tem"
            titulo={`Tem no SUS em ${municipio.nome}`}
            detalhe={componentes.map((c) => quemEntrega(c, municipio.nome)).join(" ")}
          />
        ) : (
          <Resposta
            tom="processo"
            titulo="Não é para levar para casa"
            detalhe={
              "Este remédio está na lista, mas é aplicado dentro da unidade de " +
              "saúde. Você não retira na farmácia."
            }
          />
        )}
      </div>

      {paraLevar.length > 0 && (
      <section className="mt-8">
        <h2 className="text-2xl font-bold">O que levar</h2>
        <ul className="mt-2 max-w-[65ch] list-disc pl-6">
          {levar.map((t) => (
            <li key={t} className="mt-1">
              {t}
            </li>
          ))}
        </ul>
      </section>
      )}

      <section className="mt-8">
        <h2 className="text-2xl font-bold">
          {remedio.apresentacoes.length === 1
            ? "A apresentação que a lista tem"
            : `As ${remedio.apresentacoes.length} apresentações que a lista tem`}
        </h2>
        {paraLevar.length > 0 && (
          <p className="mt-2 max-w-[65ch]">
            Confira na sua receita qual é a sua. A dose e a forma quem decide é
            o seu médico.
          </p>
        )}
        <ul>
          {remedio.apresentacoes.map((item) => (
            <Apresentacao
              key={`${item.apresentacao}-${item.retirada}`}
              item={item}
              unidadesPorTipo={unidadesPorTipo}
            />
          ))}
        </ul>
      </section>

      {classes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold">
            Em que grupo a lista põe este remédio
          </h2>
          <p className="mt-2 max-w-[65ch]">
            {classes.length === 1
              ? "A lista classifica este remédio como:"
              : "A lista classifica este remédio nestes grupos:"}
          </p>
          <ul className="mt-2 max-w-[65ch] list-disc pl-6">
            {classes.map(([slugClasse, nome]) => (
              <li key={slugClasse} className="mt-1">
                <a
                  className="underline"
                  href={`/${id}/remedios/tipo/${slugClasse}`}
                >
                  {nome}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-[65ch] text-texto-suave">
            Esse é o nome do grupo na lista, não o que o remédio faz por você.
            Estar no mesmo grupo que outro remédio não quer dizer que um
            substitui o outro. Quem decide é o seu médico.
          </p>
        </section>
      )}

      <p className="mt-8">
        <a className="underline" href="/">
          Procurar outro remédio
        </a>
      </p>

      <NotaFonte
        proveniencia={fontes}
        telefone={municipio.telefone_assistencia_farmaceutica}
      />
    </Pagina>
  );
}
