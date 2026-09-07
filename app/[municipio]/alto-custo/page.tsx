import { notFound } from "next/navigation";
import AltoCusto from "@/components/AltoCusto";
import { listaMunicipios, resolveMunicipio } from "@/lib/dados";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

// Qualquer cidade do cadastro do IBGE responde, sob demanda.
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
      ? `Alto custo em ${resolvido.municipio.nome} — Tem no SUS?`
      : "Medicamento de alto custo — Tem no SUS?",
  };
}

/**
 * O alto custo visto de uma cidade.
 *
 * A lista de doenças é do estado dela; o ponto de entrega do pedido é dela
 * mesma. Sem esta rota, quem clicava em "alto custo" a partir de Içara caía
 * numa página que dizia "Criciúma" no topo e mostrava a farmácia de Criciúma.
 */
export default async function PaginaAltoCustoMunicipio({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  if (!resolveMunicipio(municipio)) notFound();
  return <AltoCusto municipioId={municipio} />;
}
