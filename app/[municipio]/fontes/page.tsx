import { notFound } from "next/navigation";
import EstadoDasFontes from "@/components/EstadoDasFontes";
import { listaMunicipios, resolveMunicipio } from "@/lib/dados";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

export const dynamicParams = true;

export const metadata = { title: "Estado das fontes — Tem no SUS?" };

/** A mesma página, mantendo a cidade que a pessoa escolheu no topo. */
export default async function PaginaFontesMunicipio({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!resolveMunicipio(municipio)) notFound();
  return <EstadoDasFontes municipioId={municipio} />;
}
