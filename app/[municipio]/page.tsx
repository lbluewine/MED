import { notFound } from "next/navigation";
import InicioMunicipio from "@/components/InicioMunicipio";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaRename, listaMunicipios, resolveMunicipio } from "@/lib/dados";

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
  const rename = carregaRename();

  return (
    <Pagina municipioId={slug} atual="inicio">
      <Migalha itens={[{ texto: "Início", href: "/" }, { texto: nome }]} />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Tem no SUS em {nome} — {uf}
      </h1>
      <p className="mt-3 max-w-[68ch] leading-normal text-texto-suave">
        Ainda não temos a lista própria de {nome} cadastrada aqui — cada
        prefeitura publica a sua, e nem todas colocam isso num lugar fácil de
        achar. O que dá para responder com certeza é o piso nacional: os
        medicamentos que o SUS garante em qualquer município do Brasil, pela
        RENAME (Relação Nacional de Medicamentos Essenciais).
      </p>

      {rename ? (
        <>
          <form
            action={`/${slug}/busca`}
            method="get"
            role="search"
            className="mt-6 max-w-[500px]"
          >
            <label htmlFor="q" className="block text-[15px] font-bold text-marca">
              Nome do medicamento
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              <input
                id="q"
                name="q"
                type="text"
                placeholder="Ex.: losartana"
                className="campo-busca-entrada min-w-0 flex-1 basis-[240px] rounded-[10px] border border-marca-linha bg-fundo px-4 py-3 text-[16px]"
              />
              <button
                type="submit"
                className="min-h-[48px] rounded-[10px] bg-marca px-5 text-[16px] font-semibold text-white"
              >
                Buscar →
              </button>
            </div>
          </form>

          <p className="mt-6 max-w-[68ch] text-[14px] leading-normal text-texto-suave">
            Como não sabemos as unidades de saúde de {nome}, não dá para dizer
            onde retirar nem qual receita a prefeitura pede. Pergunte na UBS
            mais próxima ou ligue para a Secretaria de Saúde do município.
          </p>

          <NotaFonte proveniencia={rename.proveniencia} telefone={null} />
        </>
      ) : (
        <p className="mt-6 max-w-[65ch] leading-normal">
          Ainda não publicamos esta parte.
        </p>
      )}
    </Pagina>
  );
}
