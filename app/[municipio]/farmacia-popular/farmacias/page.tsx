import { notFound } from "next/navigation";
import FarmaciasPopularesCidade from "@/components/FarmaciasPopularesCidade";
import { listaMunicipios, resolveMunicipio } from "@/lib/dados";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  const resolvido = resolveMunicipio(municipio);
  return {
    title: resolvido
      ? `Farmácia Popular em ${resolvido.municipio.nome} — Tem no SUS?`
      : "Onde tem Farmácia Popular — Tem no SUS?",
  };
}

/** As drogarias credenciadas da cidade aberta, não as da primeira da lista. */
export default async function PaginaFarmaciasMunicipio({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!resolveMunicipio(municipio)) notFound();
  return <FarmaciasPopularesCidade municipioId={municipio} />;
}
