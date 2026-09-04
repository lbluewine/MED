import { notFound } from "next/navigation";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import Resposta from "@/components/Resposta";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";
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

/** Rótulo de campo dentro do cartão. */
function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="text-sm font-bold uppercase tracking-wide text-marca">
        {titulo}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/**
 * Uma apresentação, em cartão próprio.
 *
 * O cartão dá a separação visual que a pessoa precisa para achar a linha da
 * receita dela, mas nada fica dobrado: onde retirar e qual receita levar são a
 * informação que evita a viagem perdida, e o STACK.md não deixa escondê-la
 * atrás de um clique.
 */
function Apresentacao({
  item,
  municipioId,
  nomeCurto,
}: {
  item: ItemRemume;
  municipioId: string;
  /** Vai junto da dose para o cartão ser legível sozinho, e ao imprimir. */
  nomeCurto: string;
}) {
  const naUnidade = item.retirada === "usado_na_unidade";

  return (
    <li className="flex break-inside-avoid flex-col overflow-hidden rounded-[var(--radius-cartao)] border-2 border-marca-linha">
      <h3 className="border-b-2 border-marca-linha bg-marca-fundo px-5 py-3 text-[21px] font-bold text-marca">
        {nomeCurto} {item.apresentacao}
      </h3>

      <div className="flex-1 px-5 py-4">
        {naUnidade ? (
          <div className="border-l-4 border-processo pl-4">
            <p className="font-bold">
              <span aria-hidden="true">! </span>
              Não é para levar para casa
            </p>
            <p className="mt-1">
              É aplicado dentro da unidade de saúde ou do pronto atendimento,
              quando o profissional decide que precisa. A fonte informa estes
              locais: {item.locais_texto}.
            </p>
          </div>
        ) : (
          <>
            <Campo titulo="Onde retirar">
              {item.onde_retirar.length > 0 ? (
                <ul className="list-disc pl-5">
                  {item.onde_retirar.map((tipo) => (
                    <li key={tipo} className="mt-1">
                      <a
                        href={`/${municipioId}/onde-pegar#${tipo}`}
                        className="underline"
                      >
                        {ONDE_RETIRAR[tipo]}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  A lista informa estes locais: {item.locais_texto}. Ligue antes
                  de ir, para confirmar.
                </p>
              )}
            </Campo>

            <Campo titulo="Que receita levar?">
              {item.tipo_receita ? (
                <p>
                  Uma {NOME_RECEITA[item.tipo_receita]} assinada pelo seu
                  médico. {validadeDaReceita(item.tipo_receita)}
                </p>
              ) : (
                <p>
                  A lista não diz qual receita esta apresentação precisa.
                  Pergunte na farmácia antes de ir.
                </p>
              )}
            </Campo>
          </>
        )}

        {item.observacoes && (
          <div className="mt-4 border-l-4 border-processo pl-4">
            <p className="font-bold">
              <span aria-hidden="true">! </span>
              Tem uma regra a mais
            </p>
            <p className="mt-1">
              A lista informa: {item.observacoes}. Pergunte na sua unidade de
              saúde o que precisa ser feito antes de retirar.
            </p>
          </div>
        )}
      </div>
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

  // O grupo em que a lista põe este medicamento. Quase sempre um só; quando a
  // fonte diverge entre apresentações, os dois aparecem, porque os dois são o dado.
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

  const uma = remedio.apresentacoes.length === 1;

  return (
    <Pagina municipioId={id} atual="remedios" largura="larga">
      <div className="max-w-4xl">
        <header>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight md:text-[42px]">
            {remedio.nome}
          </h1>
          {remedio.grafias.length > 1 && (
            <p className="mt-2 text-texto-suave">
              Também aparece na lista como {remedio.grafias.slice(1).join(", ")}.
            </p>
          )}
          {classes.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-2">
              {classes.map(([slugClasse, nome]) => (
                <a
                  key={slugClasse}
                  href={`/${id}/remedios/tipo/${slugClasse}`}
                  className="inline-flex min-h-[36px] items-center rounded-[var(--radius-botao)] border border-marca-linha bg-marca-fundo px-3 text-sm font-bold text-marca-link no-underline hover:border-marca-link"
                >
                  {nome}
                </a>
              ))}
            </p>
          )}
        </header>

        <div className="mt-7">
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
                "Este medicamento está na lista, mas é aplicado dentro da unidade " +
                "de saúde. Você não retira na farmácia."
              }
            />
          )}
        </div>

        <section className="mt-12">
          <h2 className="text-[26px] font-bold tracking-tight text-marca">
            {uma ? "A apresentação que a lista tem" : "Qual é a sua apresentação?"}
          </h2>
          {paraLevar.length > 0 && (
            <p className="mt-2 max-w-[65ch] text-texto-suave">
              {uma
                ? "Confira se é essa que está na sua receita. A dose e a forma quem decide é o seu médico."
                : `A lista tem ${remedio.apresentacoes.length}. Ache na sua receita qual é a sua — cada uma pode ser retirada num lugar diferente. A dose e a forma quem decide é o seu médico.`}
            </p>
          )}
          <ul
            className={`mt-5 grid gap-5 ${uma ? "" : "lg:grid-cols-2"}`}
          >
            {remedio.apresentacoes.map((item) => (
              <Apresentacao
                key={`${item.apresentacao}-${item.retirada}`}
                item={item}
                municipioId={id}
                nomeCurto={remedio.nome_curto}
              />
            ))}
          </ul>
        </section>

        {paraLevar.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[26px] font-bold tracking-tight text-marca">O que levar</h2>
            <ul className="mt-4 grid max-w-3xl gap-2 sm:grid-cols-2">
              {levar.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 rounded-[var(--radius-cartao)] bg-superficie px-4 py-3"
                >
                  <span aria-hidden="true" className="font-bold text-tem">
                    ✓
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-12">
          <a className="underline" href="/">
            Procurar outro medicamento
          </a>
        </p>

        <NotaFonte
          proveniencia={fontes}
          telefone={municipio.telefone_assistencia_farmaceutica}
        />
      </div>
    </Pagina>
  );
}
