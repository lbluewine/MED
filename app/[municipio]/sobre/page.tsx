import { notFound } from "next/navigation";
import Sobre from "@/components/Sobre";
import { listaMunicipios, resolveMunicipio } from "@/lib/dados";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

export const dynamicParams = true;

export const metadata = { title: "Sobre — Tem no SUS?" };

/** A mesma página, mantendo a cidade que a pessoa escolheu no topo. */
export default async function PaginaSobreMunicipio({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!resolveMunicipio(municipio)) notFound();
  return <Sobre municipioId={municipio} />;
}
