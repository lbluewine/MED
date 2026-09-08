import { notFound } from "next/navigation";
import ItemFarmaciaPopular from "@/components/ItemFarmaciaPopular";
import { listaMunicipios, resolveMunicipio } from "@/lib/dados";
import { itemDoPrograma, itensSemListaMunicipal } from "@/lib/farmacia-popular";

export function generateStaticParams() {
  return listaMunicipios().flatMap((municipio) =>
    itensSemListaMunicipal().map((i) => ({ municipio, slug: i.slug })),
  );
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { slug } = await params;
  const item = itemDoPrograma(slug);
  return {
    title: item ? `${item.nome} — Farmácia Popular — Tem no SUS?` : "Tem no SUS?",
  };
}

/**
 * A ficha de um item do programa, vista de uma cidade: é a cidade que decide
 * se a prefeitura também entrega aquele medicamento.
 */
export default async function PaginaItemMunicipio({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { municipio, slug } = await params;
  if (!resolveMunicipio(municipio)) notFound();
  return <ItemFarmaciaPopular slug={slug} municipioId={municipio} />;
}
