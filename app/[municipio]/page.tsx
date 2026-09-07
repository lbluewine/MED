import { notFound } from "next/navigation";
import InicioMunicipio from "@/components/InicioMunicipio";
import InicioMunicipioGenerico from "@/components/InicioMunicipioGenerico";
import { listaMunicipios, resolveMunicipio } from "@/lib/dados";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

// Cidade fora da lista acima ainda pode existir no cadastro do IBGE — essa
// renderiza sob demanda, em vez de pré-gerada no build. Ver
// `docs/ROADMAP.md`, v2.
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  const resolvido = resolveMunicipio(municipio);
  return {
    title: resolvido ? `${resolvido.municipio.nome} — Tem no SUS?` : "Tem no SUS?",
  };
}

/**
 * A home de uma cidade específica.
 *
 * Com REMUME publicada, é a busca completa da cidade — `InicioMunicipio`.
 * Sem REMUME, ninguém ouve "não temos essa cidade": a pessoa vê o piso que o
 * SUS garante em qualquer lugar do Brasil (a RENAME), com o aviso de que os
 * detalhes locais — onde retirar, qual receita a prefeitura pede — ainda não
 * foram cadastrados aqui. Nada de endereço ou unidade inventados.
 */
export default async function PaginaMunicipio({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio: slug } = await params;
  const resolvido = resolveMunicipio(slug);
  if (!resolvido) notFound();

  if (resolvido.temRemume) {
    return <InicioMunicipio id={slug} municipio={resolvido.municipio} />;
  }

  const { nome, uf } = resolvido.municipio;
  return <InicioMunicipioGenerico id={slug} nome={nome} uf={uf} />;
}
