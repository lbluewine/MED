import { notFound } from "next/navigation";
import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { medicamentoAltoCusto } from "@/lib/alto-custo";
import { carregaCeaf, carregaRename, listaMunicipios, resolveMunicipio } from "@/lib/dados";
import { medicamentoRename, medicamentosRename } from "@/lib/rename";
import { FORA_DA_LISTA_MUNICIPAL, NOME_UF } from "@/lib/rotulos";

export function generateStaticParams() {
  return listaMunicipios().flatMap((municipio) =>
    medicamentosRename().map((m) => ({ municipio, slug: m.slug })),
  );
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { slug } = await params;
  const m = medicamentoRename(slug);
  return { title: m ? `${m.nome} — Tem no SUS?` : "Tem no SUS?" };
}

/**
 * Um medicamento do piso nacional que a lista da cidade não traz.
 *
 * A lista A–Z mostrava esses nomes sem link nenhum, porque a ficha municipal
 * depende do que a prefeitura cadastrou. Só que há o que dizer: por qual
 * balcão ele sai, em que apresentações, e — quando é de alto custo — para
 * quais doenças o pedido é aberto. Um nome sem clique parecia beco sem saída.
 *
 * Nada aqui promete que a unidade tem o medicamento hoje. Diz de onde ele vem
 * e o que a pessoa precisa perguntar.
 */
export default async function MedicamentoDoPisoNacional({
  params,
}: {
  params: Promise<{ municipio: string; slug: string }>;
}) {
  const { municipio: id, slug } = await params;
  const resolvido = resolveMunicipio(id);
  if (!resolvido) notFound();

  const medicamento = medicamentoRename(slug);
  if (!medicamento) notFound();

  const uf = resolvido.municipio.uf;
  const nomeCidade = resolvido.municipio.nome;
  const rename = carregaRename();
  const temCeaf = carregaCeaf(uf.toLowerCase()) !== null;

  // Quando é de alto custo e o estado publica a lista, as doenças que abrem o
  // pedido vêm junto — é o que a pessoa precisa para saber se é o caso dela.
  const noAltoCusto =
    medicamento.componentes.includes("especializado") && temCeaf
      ? medicamentoAltoCusto(slug, uf)
      : null;

  return (
    <Pagina municipioId={id} atual="remedios">
      <Migalha
        itens={[
          { texto: "Início", href: `/${id}` },
          { texto: "Medicamentos A–Z", href: `/${id}/remedios` },
          { texto: medicamento.nome },
        ]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        {medicamento.nome}
      </h1>
      <p className="mt-2 max-w-[68ch] leading-normal text-texto-suave">
        O SUS garante este medicamento em qualquer cidade do Brasil, mas a lista
        da prefeitura de {nomeCidade} não traz. Antes de sair de casa, pergunte
        na sua unidade de saúde.
      </p>

      <Cartao as="section" className="mt-6 px-6 py-5">
        <h2 className="text-[21px] font-bold text-marca">Por onde ele sai</h2>
        <ul className="mt-2">
          {medicamento.componentes.map((c) => (
            <li key={c} className="border-t border-divisoria py-2.5 leading-normal">
              <span
                className={`mr-2 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                  c === "especializado"
                    ? "bg-[#fdf0dc] text-[#8a5a10]"
                    : "bg-marca-suave text-marca-link"
                }`}
              >
                {FORA_DA_LISTA_MUNICIPAL[c].marca}
              </span>
              {FORA_DA_LISTA_MUNICIPAL[c].explicacao}
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao as="section" className="mt-4 px-6 py-5">
        <h2 className="text-[21px] font-bold text-marca">Apresentações</h2>
        <p className="mt-1 max-w-[65ch] leading-normal text-texto-suave">
          Confira na sua receita qual é a sua.
        </p>
        <ul className="mt-2">
          {medicamento.itens.map((item, n) => (
            <li key={n} className="border-t border-divisoria py-2 leading-normal">
              {item.texto.startsWith(medicamento.nome)
                ? item.texto.slice(medicamento.nome.length).trim()
                : item.texto}
            </li>
          ))}
        </ul>
      </Cartao>

      {noAltoCusto && noAltoCusto.condicoes.length > 0 && (
        <Cartao as="section" className="mt-4 px-6 py-5">
          <h2 className="text-[21px] font-bold text-marca">
            Para quais doenças ele é fornecido
          </h2>
          <p className="mt-1.5 max-w-[65ch] leading-normal text-texto-suave">
            Em {NOME_UF[uf] ?? uf} o pedido é por doença, e cada uma tem o seu
            conjunto de papéis. Quem decide se o medicamento serve para o seu
            caso é o médico.
          </p>
          <ul className="mt-3">
            {noAltoCusto.condicoes.map((c) => (
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
          <p className="mt-4">
            <a href={`/${id}/alto-custo`}>Como abrir o pedido do alto custo</a>
          </p>
        </Cartao>
      )}

      {rename && <NotaFonte proveniencia={rename.proveniencia} telefone={null} />}
    </Pagina>
  );
}
