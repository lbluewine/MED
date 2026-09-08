import ItemFarmaciaPopular from "@/components/ItemFarmaciaPopular";
import { itemDoPrograma, itensSemListaMunicipal } from "@/lib/farmacia-popular";

export function generateStaticParams() {
  return itensSemListaMunicipal().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = itemDoPrograma(slug);
  return {
    title: item ? `${item.nome} — Farmácia Popular — Tem no SUS?` : "Tem no SUS?",
  };
}

/** Sem cidade escolhida. Ver `components/ItemFarmaciaPopular`. */
export default async function PaginaItem({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ItemFarmaciaPopular slug={slug} />;
}
