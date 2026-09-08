import { notFound } from "next/navigation";
import MedicamentosFarmaciaPopular from "@/components/MedicamentosFarmaciaPopular";
import { listaMunicipios, resolveMunicipio } from "@/lib/dados";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

export const dynamicParams = true;

export const metadata = {
  title: "Medicamentos da Farmácia Popular — Tem no SUS?",
};

/** O elenco federal, com os links da cidade aberta. */
export default async function PaginaMedicamentosMunicipio({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!resolveMunicipio(municipio)) notFound();
  return <MedicamentosFarmaciaPopular municipioId={municipio} />;
}
