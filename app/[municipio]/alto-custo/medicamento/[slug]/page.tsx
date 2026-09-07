import { notFound } from "next/navigation";
import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaCeaf, carregaRename, listaMunicipios, resolveMunicipio } from "@/lib/dados";
import { medicamentoAltoCusto, medicamentosAltoCusto } from "@/lib/alto-custo";
import { NOME_UF } from "@/lib/rotulos";

export function generateStaticParams() {
  return listaMunicipios().flatMap((municipio) => {
    const uf = resolveMunicipio(municipio)?.municipio.uf;
    return medicamentosAltoCusto(uf).map((m) => ({ municipio, slug: m.slug }));
  });
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { municipio, slug } = await params;
  const uf = resolveMunicipio(municipio)?.municipio.uf;
  const m = medicamentoAltoCusto(slug, uf);
  return { title: m ? `${m.nome} — alto custo — Tem no SUS?` : "Tem no SUS?" };
}

/**
 * Um medicamento de alto custo: as doenças que abrem o pedido dele.
 *
 * A ligação vem da RENAME, que diz o protocolo (PCDT) de cada medicamento. O
 * link para os papéis só aparece quando a doença é a mesma que o estado
 * publica — casar por semelhança levaria a pessoa aos documentos de outra
 * doença, e ela descobriria isso no balcão.
 */
export default async function MedicamentoDoAltoCusto({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { municipio: id, slug } = await params;
  const resolvido = resolveMunicipio(id);
  if (!resolvido) notFound();

  const uf = resolvido.municipio.uf;
  if (!carregaCeaf(uf.toLowerCase())) notFound();

  const medicamento = medicamentoAltoCusto(slug, uf);
  if (!medicamento) notFound();

  const rename = carregaRename();
  const semLink = medicamento.condicoes.filter((c) => !c.slugCeaf).length;

  return (
    <Pagina municipioId={id} atual="alto-custo">
      <Migalha
        itens={[
          { texto: "Início", href: `/${id}` },
          { texto: "Alto custo", href: `/${id}/alto-custo` },
          { texto: "Medicamentos", href: `/${id}/alto-custo/medicamentos` },
          { texto: medicamento.nome },
        ]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        {medicamento.nome}
      </h1>
      <p className="mt-2 max-w-[65ch] leading-normal text-texto-suave">
        É de alto custo: quem entrega é o governo de {NOME_UF[uf] ?? uf}, não o
        posto. O pedido é aberto com papéis que o seu médico preenche.
      </p>

      <Cartao as="section" className="mt-6 px-6 py-5">
        <h2 className="text-[21px] font-bold text-marca">Apresentações</h2>
        <ul className="mt-2">
          {medicamento.apresentacoes.map((a, n) => (
            <li key={n} className="border-t border-divisoria py-2 leading-normal">
              {a}
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao as="section" className="mt-4 px-6 py-5">
        <h2 className="text-[21px] font-bold text-marca">
          Para quais doenças este medicamento é fornecido
        </h2>
        <p className="mt-1.5 max-w-[65ch] leading-normal text-texto-suave">
          O pedido é por doença: cada uma tem o seu conjunto de papéis. Encontre
          a sua e veja o que levar. Quem decide se o medicamento serve para o seu
          caso é o médico.
        </p>
        <ul className="mt-3">
          {medicamento.condicoes.map((c) => (
            <li
              key={c.nome}
              className="border-t border-divisoria py-2.5 leading-normal"
            >
              {c.slugCeaf ? (
                <a href={`/alto-custo/${c.slugCeaf}`}>{c.nome}</a>
              ) : (
                <>
                  {c.nome}{" "}
                  <span className="text-[14px] text-texto-suave">
                    — ainda não achamos os papéis desta na lista do estado
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
        {semLink > 0 && (
          <p className="mt-4 max-w-[65ch] border-l-4 border-processo pl-4 leading-normal text-texto-suave">
            {semLink === medicamento.condicoes.length
              ? "Não achamos esta doença com o mesmo nome na lista do estado."
              : "Algumas destas doenças o estado publica com outro nome."}{" "}
            Procure na{" "}
            <a href={`/${id}/alto-custo#doencas`}>lista de doenças atendidas</a> ou
            pergunte na farmácia do alto custo.
          </p>
        )}
      </Cartao>

      {rename && <NotaFonte proveniencia={rename.proveniencia} telefone={null} />}
    </Pagina>
  );
}
