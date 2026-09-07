import { notFound } from "next/navigation";
import Cartao, { Rotulo } from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { resolveMunicipio } from "@/lib/dados";
import {
  elencoFarmaciaPopular,
  itemDoPrograma,
  rotuloIndicacao,
} from "@/lib/farmacia-popular";

/**
 * Um medicamento ou insumo que o programa federal fornece e a cidade não tem
 * na própria lista.
 *
 * Existe para não deixar ninguém sem resposta. Quem procura dapagliflozina ou
 * fralda geriátrica ouvia "não tem" — e tem, de graça, na farmácia da rua. O
 * que muda em relação à página de um medicamento da lista municipal é só de
 * onde ele sai: aqui não há posto, distrito nem receita da prefeitura.
 *
 * Só ganham página os que nenhuma cidade publicada tem. Os outros já têm a
 * página do município, com os locais de retirada de lá.
 */
/**
 * A ficha de um item do programa federal.
 *
 * O elenco é o mesmo no país inteiro; o que muda por cidade é se a prefeitura
 * também entrega aquele medicamento. Sem a cidade, a página dizia "não está na
 * lista da prefeitura de Criciúma" para quem tinha escolhido outra.
 */
export default function ItemFarmaciaPopular({
  slug,
  municipioId,
}: {
  slug: string;
  municipioId?: string;
}) {
  const item = itemDoPrograma(slug);
  const elenco = elencoFarmaciaPopular();
  if (!item || !elenco) notFound();

  const municipioNav = municipioId;
  const resolvido = municipioNav ? resolveMunicipio(municipioNav) : null;
  const municipio = resolvido?.temRemume ? resolvido.municipio : null;
  const oQueE = item.insumo ? "Este item" : "Este medicamento";

  return (
    <Pagina municipioId={municipioNav} atual="farmacia-popular">
      <Migalha
        itens={[
          { texto: "Início", href: municipioNav ? `/${municipioNav}` : "/" },
          { texto: "Farmácia Popular", href: "/farmacia-popular" },
          { texto: item.nome },
        ]}
      />

      <section className="flex flex-wrap items-center justify-between gap-x-7 gap-y-5 rounded-2xl border border-[#bfe3d0] bg-[#eaf7f0] px-8 py-7">
        <div className="min-w-0 flex-1 basis-[340px]">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-marca-fraca">
            {item.indicacoes.map(rotuloIndicacao).join(" · ")}
          </p>
          <h1 className="mt-2 text-[32px] font-bold leading-[1.1] tracking-tight text-marca first-letter:uppercase md:text-[38px]">
            {item.nome}
          </h1>
        </div>
        <div className="flex-none">
          <p className="text-[38px] font-bold leading-none tracking-tight text-tem md:text-[44px]">
            <span aria-hidden="true">✓ </span>
            TEM
          </p>
          <p className="mt-2 max-w-[30ch] text-[13.5px] font-semibold uppercase tracking-[0.08em] text-[#33506f]">
            de graça, na Farmácia Popular
          </p>
        </div>
      </section>

      <p className="mt-4 max-w-[70ch] leading-normal text-texto-suave">
        {oQueE} é fornecido pelo SUS através do Programa Farmácia Popular, que é
        federal. Você retira na farmácia da rua credenciada, com o selo “Aqui
        Tem Farmácia Popular”, e não paga nada.
        {municipio
          ? ` Não está na lista de medicamentos da prefeitura de ${municipio.nome}, então não adianta procurar no posto.`
          : ""}
      </p>

      <div className="mt-7 flex flex-wrap items-start gap-7">
        <div className="min-w-0 flex-1 basis-[460px]">
          <h2 className="mb-3.5 text-[22px] font-bold text-marca">
            Forma de apresentação
          </h2>
          <Cartao as="article" className="px-6 py-6">
            {item.apresentacoes.length === 1 ? (
              <h3 className="text-xl font-bold first-letter:uppercase">
                {item.apresentacoes[0]!.texto}
              </h3>
            ) : (
              <ul>
                {item.apresentacoes.map((a) => (
                  <li
                    key={a.texto}
                    className="border-b border-divisoria py-2.5 text-[17px] font-semibold text-marca first-letter:uppercase last:border-b-0"
                  >
                    {a.texto}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-divisoria pt-4">
              <Rotulo>Onde retirar</Rotulo>
              <p className="mt-1 leading-normal">
                Numa farmácia ou drogaria credenciada no programa.{" "}
                {municipio ? (
                  <a href={municipioNav ? `/${municipioNav}/farmacia-popular/farmacias` : "/farmacia-popular/farmacias"}>
                    Veja as de {municipio.nome}
                  </a>
                ) : (
                  <a href={elenco.busca_enderecos.url} rel="noreferrer">
                    Procure a mais perto de você
                  </a>
                )}
                .
              </p>
            </div>

            <p className="mt-4 max-w-[65ch] leading-normal text-texto-suave">
              {item.insumo
                ? "A lista do programa é a mesma no país inteiro. O que a farmácia tem em estoque hoje, quem responde é ela."
                : "Confira a dose na sua receita. A lista do programa é a mesma no país inteiro, e a dose que ela tem nem sempre é a que está escrita para você."}
            </p>
          </Cartao>
        </div>

        <aside className="min-w-0 flex-1 basis-[290px]">
          <Cartao className="px-6 py-5">
            <h2 className="mb-3 text-[18.5px] font-bold text-marca">
              O que levar
            </h2>
            <ul>
              {elenco.como_retirar.documentos.map((documento) => (
                <li
                  key={documento}
                  className="border-t border-divisoria py-2.5 leading-normal text-[#33506f]"
                >
                  {documento}
                </li>
              ))}
            </ul>
          </Cartao>

          <Cartao className="mt-4 px-6 py-5">
            <h2 className="mb-2 text-[18.5px] font-bold text-marca">
              O programa
            </h2>
            <p className="leading-normal text-[#33506f]">
              São {elenco.grupos.reduce((n, g) => n + g.itens.length, 0)} itens,
              todos de graça.{" "}
              <a href={municipioNav ? `/${municipioNav}/farmacia-popular/medicamentos` : "/farmacia-popular/medicamentos"}>Ver a lista inteira</a>.
            </p>
          </Cartao>
        </aside>
      </div>

      <NotaFonte
        proveniencia={[...elenco.proveniencia, ...elenco.como_retirar.proveniencia]}
        telefone={municipio?.telefone_assistencia_farmaceutica ?? null}
      />
    </Pagina>
  );
}
