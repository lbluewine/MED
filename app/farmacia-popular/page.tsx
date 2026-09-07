import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import {
  carregaFarmaciasPopulares,
  carregaMunicipio,
  listaMunicipios,
} from "@/lib/dados";
import { elencoFarmaciaPopular } from "@/lib/farmacia-popular";

export const metadata = { title: "Farmácia Popular — Tem no SUS?" };

/** Um caminho da página, com o número que há do outro lado. */
function Caminho({
  href,
  titulo,
  contagem,
  children,
}: {
  href: string;
  titulo: string;
  contagem: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="block rounded-[var(--radius-cartao)] border border-borda-cartao bg-fundo px-6 py-6 text-texto no-underline transition-shadow hover:border-marca-link hover:shadow-[0_10px_26px_rgba(12,50,111,0.09)]"
    >
      <span className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b3aa6]">
        {contagem}
      </span>
      <span className="mb-1.5 mt-2 block text-[21px] font-bold leading-tight text-marca-link">
        {titulo}
      </span>
      <span className="block leading-normal text-texto-suave">{children}</span>
    </a>
  );
}

/**
 * O guia do programa: o que é, o que levar e para onde ir.
 *
 * A lista de medicamentos e a de farmácias têm páginas próprias. Aqui fica só
 * o que a pessoa precisa entender antes de usar qualquer uma das duas — que o
 * programa não é o posto, que é de graça, e o que levar na mão.
 *
 * Esta página não diz para que serve nenhum medicamento: isso seria conteúdo
 * clínico, e conteúdo clínico só vai ao ar com revisão farmacêutica.
 */
export default function FarmaciaPopular() {
  const [municipioNav] = listaMunicipios();
  const elenco = elencoFarmaciaPopular();

  if (!elenco) {
    return (
      <Pagina municipioId={municipioNav} atual="farmacia-popular">
        <Migalha
          itens={[{ texto: "Início", href: "/" }, { texto: "Farmácia Popular" }]}
        />
        <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
          Farmácia Popular
        </h1>
        <p className="mt-4 max-w-[65ch]">Ainda não publicamos esta parte.</p>
      </Pagina>
    );
  }

  const itens = elenco.grupos.flatMap((g) => g.itens);
  const total = itens.length;
  // Absorvente e fralda estão no programa e não são medicamento. A própria
  // fonte se chama "Elenco de Medicamentos e Insumos".
  const insumos = itens.filter((i) => i.insumo).length;
  const municipio = municipioNav ? carregaMunicipio(municipioNav) : null;
  const credenciadas = municipioNav ? carregaFarmaciasPopulares(municipioNav) : null;

  return (
    <Pagina municipioId={municipioNav} atual="farmacia-popular">
      <Migalha
        itens={[
          { texto: "Início", href: "/" },
          { texto: "Orientações" },
          { texto: "Farmácia Popular" },
        ]}
      />

      <section className="rounded-2xl border border-[#ddd0f5] bg-gradient-to-br from-[#efe8fc] to-[#e0d3f7] px-7 py-8 md:px-9">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#5b3aa6]">
          Programa federal
        </p>
        <h1 className="mt-3 max-w-[26ch] text-[32px] font-bold leading-[1.1] tracking-tight text-marca md:text-[40px]">
          Farmácia Popular: {total} medicamentos
          {insumos > 0 ? " e insumos" : ""} fornecidos de graça
        </h1>
        <p className="mt-3.5 max-w-[58ch] text-[17px] leading-normal text-[#33506f]">
          Não é o posto. É a farmácia da rua, credenciada pelo Ministério da
          Saúde e identificada com o selo “Aqui Tem Farmácia Popular”. Você leva
          a receita e o documento com CPF, e não paga nada.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-[27px] font-bold tracking-tight text-marca">
          Como funciona
        </h2>
        <div className="mt-4 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          <Cartao className="px-6 py-6">
            <h3 className="text-[19px] font-bold text-marca">Quem pode usar</h3>
            <p className="mt-2 leading-normal text-[#33506f]">
              Qualquer pessoa com receita dentro da validade, do SUS ou de
              médico particular. Não precisa estar em tratamento no posto.
            </p>
          </Cartao>

          <Cartao className="px-6 py-6">
            <h3 className="text-[19px] font-bold text-marca">Quanto custa</h3>
            <p className="mt-2 leading-normal text-[#33506f]">
              Nada. Os {total} medicamentos{insumos > 0 ? " e insumos" : ""} do
              programa são fornecidos de graça nas farmácias credenciadas.
            </p>
          </Cartao>

          <Cartao className="px-6 py-6">
            <h3 className="text-[19px] font-bold text-marca">O que levar</h3>
            <ul className="mt-2">
              {elenco.como_retirar.documentos.map((documento) => (
                <li
                  key={documento}
                  className="border-t border-divisoria py-2 leading-normal text-[#33506f]"
                >
                  {documento}
                </li>
              ))}
            </ul>
          </Cartao>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[27px] font-bold tracking-tight text-marca">
          Medicamentos disponíveis
        </h2>
        <div className="mt-4">
          <Caminho
            href="/farmacia-popular/medicamentos"
            titulo="O que a Farmácia Popular tem"
            contagem={`${total} medicamentos${insumos > 0 ? " e insumos" : ""}`}
          >
            A lista inteira, agrupada por indicação. Procure o seu e veja onde
            retirar.
          </Caminho>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[27px] font-bold tracking-tight text-marca">
          Onde encontrar
        </h2>
        <div className="mt-4">
          <Caminho
            href="/farmacia-popular/farmacias"
            titulo={
              municipio ? `Onde tem em ${municipio.nome}` : "Onde tem perto de você"
            }
            contagem={
              credenciadas
                ? `${credenciadas.farmacias.length} farmácias`
                : "painel do Ministério"
            }
          >
            As drogarias credenciadas, por bairro, com endereço e mapa.
          </Caminho>
        </div>
      </section>

      {municipio && municipioNav && (
        <p className="mt-6 max-w-[68ch] leading-normal text-texto-suave">
          Parte destes medicamentos também é entregue pelo SUS de{" "}
          {municipio.nome}, sem passar pela drogaria. Para saber quais, procure
          o seu na <a href={`/${municipioNav}/remedios`}>lista da cidade</a>.
        </p>
      )}

      <NotaFonte
        proveniencia={[...elenco.proveniencia, ...elenco.como_retirar.proveniencia]}
        telefone={municipio?.telefone_assistencia_farmaceutica ?? null}
      />
    </Pagina>
  );
}
