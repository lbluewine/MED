import { notFound } from "next/navigation";
import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import Pagina from "@/components/Pagina";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";
import { remediosDoTipoDeUnidade } from "@/lib/remedios";
import { NOME_UNIDADE_CURTO, ONDE_RETIRAR } from "@/lib/rotulos";
import { TipoUnidade } from "@/lib/schema";

/**
 * Os medicamentos que saem num tipo de unidade da cidade.
 *
 * "Onde eu pego?" é a pergunta que a pessoa traz, e antes o site só respondia
 * "de que classe é?". Cada tipo de balcão entrega uma parte da lista, e é essa
 * parte que interessa a quem já sabe para onde vai.
 */
export function generateStaticParams() {
  return listaMunicipios().flatMap((municipio) =>
    TipoUnidade.options
      .filter((tipo) => remediosDoTipoDeUnidade(municipio, tipo).length > 0)
      .map((tipo) => ({ municipio, tipo })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string; tipo: string }>;
}) {
  const { municipio, tipo } = await params;
  const valido = TipoUnidade.safeParse(tipo);
  if (!valido.success || !listaMunicipios().includes(municipio)) {
    return { title: "Tem no SUS?" };
  }
  return {
    title: `${NOME_UNIDADE_CURTO[valido.data]} — ${carregaMunicipio(municipio).nome} — Tem no SUS?`,
  };
}

export default async function MedicamentosPorLocal({
  params,
}: {
  params: Promise<{ municipio: string; tipo: string }>;
}) {
  const { municipio: id, tipo } = await params;
  const valido = TipoUnidade.safeParse(tipo);
  if (!valido.success || !listaMunicipios().includes(id)) notFound();

  const municipio = carregaMunicipio(id);
  const remedios = remediosDoTipoDeUnidade(id, valido.data);
  if (remedios.length === 0) notFound();

  const porLetra = new Map<string, typeof remedios>();
  for (const r of remedios) {
    const letra = r.slug[0]!.toUpperCase();
    porLetra.set(letra, [...(porLetra.get(letra) ?? []), r]);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <Pagina municipioId={id} atual="remedios">
      <Migalha
        itens={[
          { texto: "Início", href: `/${id}` },
          { texto: "Medicamentos A–Z", href: `/${id}/remedios` },
          { texto: NOME_UNIDADE_CURTO[valido.data] },
        ]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        {NOME_UNIDADE_CURTO[valido.data]}
      </h1>
      <p className="mt-1.5 max-w-[70ch] text-texto-suave">
        {remedios.length} medicamentos da lista de {municipio.nome} são
        entregues aqui. {ONDE_RETIRAR[valido.data]}.{" "}
        <a href={`/${id}/onde-pegar#${valido.data}`}>Ver os endereços</a>.
      </p>

      <div className="mt-6 flex flex-col gap-3.5">
        {letras.map((l) => (
          <Cartao
            as="section"
            key={l}
            className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-4 px-6 pb-2 pt-5"
          >
            <h2
              aria-label={`Letra ${l}`}
              className="text-[34px] font-bold leading-none text-letra-fantasma"
            >
              {l}
            </h2>
            <div className="columns-1 gap-9 md:columns-2">
              {porLetra.get(l)!.map((r) => (
                <a
                  key={r.slug}
                  href={`/${id}/remedio/${r.slug}`}
                  className="flex break-inside-avoid items-baseline justify-between gap-3 border-b border-divisoria py-2.5 text-texto no-underline hover:text-marca-link"
                >
                  <span>{r.nome}</span>
                  <span className="flex-none font-mono text-sm text-seta">
                    {r.apresentacoes.length}
                  </span>
                </a>
              ))}
            </div>
          </Cartao>
        ))}
      </div>
    </Pagina>
  );
}
