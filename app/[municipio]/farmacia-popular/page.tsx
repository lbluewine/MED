import { notFound } from "next/navigation";
import FarmaciaPopular from "@/components/FarmaciaPopular";
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
      : "Farmácia Popular — Tem no SUS?",
  };
}

/**
 * O programa visto de uma cidade: o elenco é federal, as drogarias são dela.
 * Sem esta rota, quem clicava a partir de Içara via as farmácias de Criciúma.
 */
export default async function PaginaFarmaciaPopularMunicipio({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!resolveMunicipio(municipio)) notFound();
  return <FarmaciaPopular municipioId={municipio} />;
}
