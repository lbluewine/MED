import { notFound } from "next/navigation";
import Cabecalho from "@/components/Cabecalho";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";
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

  return (
    <div>
      <Cabecalho municipioId={id} />
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-12 md:py-14">
        <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">
          Remédios da lista de {municipio.nome}
        </h1>
        <p className="mt-4 max-w-[65ch]">
          São {remedios.length} remédios. A lista está em ordem alfabética.
        </p>
        <ul className="mt-6">
          {remedios.map((r) => (
            <li key={r.slug} className="border-b border-linha">
              <a
                href={`/${id}/remedio/${r.slug}`}
                className="block min-h-[48px] py-3 text-[20px] underline"
              >
                {r.nome}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
