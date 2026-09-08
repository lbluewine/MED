import { notFound } from "next/navigation";
import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaCeaf, carregaRename, listaMunicipios, resolveMunicipio } from "@/lib/dados";
import { medicamentosAltoCusto } from "@/lib/alto-custo";
import { NOME_UF } from "@/lib/rotulos";

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
  const r = resolveMunicipio(municipio);
  return {
    title: r
      ? `Medicamentos de alto custo — ${r.municipio.nome} — Tem no SUS?`
      : "Medicamentos de alto custo — Tem no SUS?",
  };
}

/**
 * Os medicamentos de alto custo, em ordem alfabética.
 *
 * O caminho pela doença continua existindo, mas quem chega tem o nome do
 * medicamento na receita — e procurá-lo numa lista de 110 doenças não
 * funciona. Aqui a pessoa acha o nome e a página dele diz que doenças abrem
 * o pedido.
 */
export default async function MedicamentosAltoCusto({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio: id } = await params;
  const resolvido = resolveMunicipio(id);
  if (!resolvido) notFound();

  const uf = resolvido.municipio.uf;
  const ceaf = carregaCeaf(uf.toLowerCase());
  if (!ceaf) notFound();

  const medicamentos = medicamentosAltoCusto(uf);
  const rename = carregaRename();

  const porLetra = new Map<string, typeof medicamentos>();
  for (const m of medicamentos) {
    const letra = m.slug[0]!.toUpperCase();
    porLetra.set(letra, [...(porLetra.get(letra) ?? []), m]);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <Pagina municipioId={id} atual="alto-custo">
      <Migalha
        itens={[
          { texto: "Início", href: `/${id}` },
          { texto: "Alto custo", href: `/${id}/alto-custo` },
          { texto: "Medicamentos" },
        ]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Medicamentos de alto custo
      </h1>
      <p className="mt-1.5 max-w-[70ch] text-texto-suave">
        {medicamentos.length} medicamentos que o governo do estado entrega pelo
        CEAF. Clique no seu para ver as doenças que abrem o pedido e os papéis
        que ele exige. Se preferir procurar pela doença, veja{" "}
        <a href={`/${id}/alto-custo#doencas`}>
          as {ceaf.condicoes.length} doenças atendidas em {NOME_UF[uf] ?? uf}
        </a>
        .
      </p>

      <Cartao className="nao-imprime mb-5 mt-5 flex flex-wrap gap-1.5 px-4 py-3.5">
        {letras.map((l) => (
          <a
            key={l}
            href={`#letra-${l}`}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg font-semibold text-marca-link no-underline hover:bg-marca-link hover:text-white"
          >
            {l}
          </a>
        ))}
      </Cartao>

      <div className="flex flex-col gap-3.5">
        {letras.map((l) => (
          <Cartao
            as="section"
            key={l}
            className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-4 px-6 pb-2 pt-5"
          >
            <h2
              id={`letra-${l}`}
              aria-label={`Letra ${l}`}
              className="scroll-mt-6 text-[34px] font-bold leading-none text-letra-fantasma"
            >
              {l}
            </h2>
            <div className="columns-1 gap-9 md:columns-2">
              {porLetra.get(l)!.map((m) => (
                <a
                  key={m.slug}
                  href={`/${id}/alto-custo/medicamento/${m.slug}`}
                  className="flex break-inside-avoid items-baseline justify-between gap-3 border-b border-divisoria py-2.5 text-texto no-underline hover:text-marca-link"
                >
                  <span>{m.nome}</span>
                  <span className="flex-none font-mono text-sm text-seta">
                    {m.condicoes.length}
                  </span>
                </a>
              ))}
            </div>
          </Cartao>
        ))}
      </div>

      {rename && <NotaFonte proveniencia={rename.proveniencia} telefone={null} />}
    </Pagina>
  );
}
