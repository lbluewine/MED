import { notFound } from "next/navigation";
import NotaFonte from "@/components/NotaFonte";
import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import Pagina from "@/components/Pagina";
import { buscaClasse, listaClasses } from "@/lib/classes";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";

export function generateStaticParams() {
  return listaMunicipios().flatMap((municipio) =>
    listaClasses(municipio).map((c) => ({ municipio, slug: c.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { municipio, slug } = await params;
  const classe = buscaClasse(municipio, slug);
  return { title: classe ? `${classe.nome} — Tem no SUS?` : "Tem no SUS?" };
}

export default async function PaginaClasse({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { municipio: id, slug } = await params;
  if (!listaMunicipios().includes(id)) notFound();

  const classe = buscaClasse(id, slug);
  if (!classe) notFound();

  const municipio = carregaMunicipio(id);

  const fontes = [
    ...new Map(
      classe.remedios
        .flatMap((r) => r.apresentacoes)
        .flatMap((a) => a.proveniencia)
        .map((f) => [f.fonte_nome, f]),
    ).values(),
  ];

  return (
    <Pagina municipioId={id} atual="classes">
      <Migalha
        itens={[
          { texto: "Início", href: "/" },
          { texto: "Por tipo", href: `/${id}/remedios/tipos` },
          { texto: classe.nome },
        ]}
      />
      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        {classe.nome}
      </h1>
      <p className="mt-4 max-w-[65ch]">
        A lista de {municipio.nome} põe{" "}
        {classe.remedios.length === 1
          ? "um medicamento"
          : `${classe.remedios.length} medicamentos`}{" "}
        neste grupo. O nome do grupo é o que a própria lista escreve.
      </p>
      <p className="mt-3 max-w-[65ch] border-l-4 border-processo pl-4">
        Estar no mesmo grupo não quer dizer que um medicamento substitui o outro.
        Quem decide qual serve para você é o seu médico.
      </p>

      <Cartao className="mt-6 px-6 py-2">
        <ul>
        {classe.remedios.map((r) => (
          <li key={r.slug} className="border-b border-divisoria last:border-b-0">
            <a
              href={`/${id}/remedio/${r.slug}`}
              className="block min-h-[48px] py-3 no-underline"
            >
              <span className="text-[20px] underline">{r.nome}</span>
              {!r.tem_para_levar && (
                <span className="mt-1 block text-sm text-texto-suave">
                  Aplicado dentro da unidade, não é para levar para casa.
                </span>
              )}
            </a>
          </li>
        ))}
        </ul>
      </Cartao>

      <NotaFonte
        proveniencia={fontes}
        telefone={municipio.telefone_assistencia_farmaceutica}
      />
    </Pagina>
  );
}
