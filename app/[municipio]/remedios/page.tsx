import { notFound } from "next/navigation";
import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import Pagina from "@/components/Pagina";
import { listaClasses } from "@/lib/classes";
import { carregaMunicipio, carregaRemume, listaMunicipios } from "@/lib/dados";
import { listaRemedios } from "@/lib/remedios";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

/** Lista A a Z. É o caminho de quem está sem JavaScript ou prefere olhar tudo. */
export default async function Remedios({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio: id } = await params;
  if (!listaMunicipios().includes(id)) notFound();

  const municipio = carregaMunicipio(id);
  const remedios = listaRemedios(id);
  const classes = listaClasses(id);
  const apresentacoes = carregaRemume(id).length;

  const porLetra = new Map<string, typeof remedios>();
  for (const r of remedios) {
    const letra = r.slug[0]!.toUpperCase();
    porLetra.set(letra, [...(porLetra.get(letra) ?? []), r]);
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
        {apresentacoes} apresentações. Se preferir olhar por grupo, veja{" "}
        <a href={`/${id}/remedios/tipos`}>os {classes.length} tipos</a>.
      </p>

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
