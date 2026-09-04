import { notFound } from "next/navigation";
import Pagina from "@/components/Pagina";
import { listaClasses } from "@/lib/classes";
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
  const classes = listaClasses(id);

  // Uma letra por vez, para dar âncora e quebrar a lista de 250 nomes.
  const porLetra = new Map<string, typeof remedios>();
  for (const r of remedios) {
    const letra = r.slug[0]!.toUpperCase();
    porLetra.set(letra, [...(porLetra.get(letra) ?? []), r]);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <Pagina municipioId={id} atual="remedios" largura="larga">
      <h1 className="max-w-[20ch] text-[30px] font-bold leading-tight md:text-[38px]">
        Remédios da lista de {municipio.nome}
      </h1>
      <p className="mt-4 max-w-[65ch]">
        São {remedios.length} remédios, em ordem alfabética. Se preferir olhar
        por grupo, veja{" "}
        <a className="underline" href={`/${id}/remedios/tipos`}>
          os {classes.length} tipos de remédio
        </a>
        .
      </p>

      <nav aria-label="Pular para uma letra" className="mt-6 flex flex-wrap gap-1">
        {letras.map((l) => (
          <a
            key={l}
            href={`#letra-${l}`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[2px] border-2 border-linha font-bold no-underline hover:bg-[#F2F2F2]"
          >
            {l}
          </a>
        ))}
      </nav>

      {letras.map((l) => (
        <section key={l} className="mt-10">
          <h2
            id={`letra-${l}`}
            className="scroll-mt-8 border-b-2 border-texto pb-1 text-2xl font-bold"
          >
            {l}
          </h2>
          <ul className="gap-x-10 md:columns-2 xl:columns-3">
            {porLetra.get(l)!.map((r) => (
              <li key={r.slug} className="break-inside-avoid border-b border-linha">
                <a
                  href={`/${id}/remedio/${r.slug}`}
                  className="block min-h-[48px] py-3 text-[20px] underline"
                >
                  {r.nome}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Pagina>
  );
}
