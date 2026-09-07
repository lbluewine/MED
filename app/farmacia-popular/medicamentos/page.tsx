import Cartao, { Pilula } from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";
import {
  elencoFarmaciaPopular,
  itensDoPrincipio,
  itensSemListaMunicipal,
  rotuloIndicacao,
} from "@/lib/farmacia-popular";
import { listaRemedios } from "@/lib/remedios";

export const metadata = {
  title: "O que a Farmácia Popular tem — Tem no SUS?",
};

/**
 * A lista do programa, agrupada pela indicação que a própria fonte usa.
 *
 * Esta página não diz para que serve cada medicamento: a indicação é o
 * agrupamento do Ministério, e vai como ele escreve. Dizer mais que isso seria
 * conteúdo clínico, que só vai ao ar com revisão farmacêutica registrada.
 */
export default function MedicamentosDoPrograma() {
  const [municipioNav] = listaMunicipios();
  const elenco = elencoFarmaciaPopular();

  if (!elenco) {
    return (
      <Pagina municipioId={municipioNav} atual="farmacia-popular">
        <Migalha
          itens={[
            { texto: "Início", href: "/" },
            { texto: "Farmácia Popular", href: "/farmacia-popular" },
            { texto: "O que tem" },
          ]}
        />
        <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
          O que a Farmácia Popular tem
        </h1>
        <p className="mt-4 max-w-[65ch]">Ainda não publicamos esta parte.</p>
      </Pagina>
    );
  }

  const total = elenco.grupos.reduce((soma, g) => soma + g.itens.length, 0);
  const municipio = municipioNav ? carregaMunicipio(municipioNav) : null;

  /*
    Para onde cada item leva.

    Quem está na lista da cidade vai para a página do município, que tem os
    locais de retirada e a receita que a prefeitura pede. Quem não está vai
    para a página do próprio programa. Todo item leva a algum lugar.
  */
  const paginaDoItem = new Map<string, string>();
  if (municipioNav) {
    for (const remedio of listaRemedios(municipioNav)) {
      for (const item of itensDoPrincipio(remedio.nome)) {
        paginaDoItem.set(item.texto, `/${municipioNav}/remedio/${remedio.slug}`);
      }
    }
  }
  for (const item of itensSemListaMunicipal()) {
    for (const a of item.apresentacoes) {
      paginaDoItem.set(a.texto, `/farmacia-popular/${item.slug}`);
    }
  }

  return (
    <Pagina municipioId={municipioNav} atual="farmacia-popular">
      <Migalha
        itens={[
          { texto: "Início", href: "/" },
          { texto: "Farmácia Popular", href: "/farmacia-popular" },
          { texto: "O que tem" },
        ]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        O que a Farmácia Popular tem
      </h1>
      <p className="mt-1.5 max-w-[68ch] leading-normal text-texto-suave">
        Procure o seu na lista. Antes de ir à farmácia, confira a dose na sua
        receita: a do programa nem sempre é a mesma que o posto entrega.
      </p>

      <div className="mt-6 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        {elenco.grupos.map((grupo) => (
          <Cartao as="section" key={grupo.slug} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-borda-cartao bg-marca-veu px-6 py-4">
              <h2 className="text-[18px] font-bold text-marca">
                {rotuloIndicacao(grupo.indicacao)}
              </h2>
              <Pilula>{grupo.itens.length}</Pilula>
            </div>
            <ul className="px-6 py-2">
              {grupo.itens.map((item) => {
                const href = paginaDoItem.get(item.texto);
                return (
                  <li
                    key={item.texto}
                    className="border-b border-divisoria leading-normal last:border-b-0"
                  >
                    {href ? (
                      <a
                        href={href}
                        className="block py-2.5 text-texto no-underline hover:text-marca-link"
                      >
                        {item.texto}
                      </a>
                    ) : (
                      <span className="block py-2.5">{item.texto}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Cartao>
        ))}
      </div>

      <p className="mt-6 max-w-[68ch] leading-normal text-texto-suave">
        São {total} itens ao todo.{" "}
        <a href="/farmacia-popular/farmacias">
          Veja onde retirar{municipio ? ` em ${municipio.nome}` : ""}
        </a>{" "}
        ou <a href="/farmacia-popular">entenda como o programa funciona</a>.
      </p>

      <NotaFonte
        proveniencia={elenco.proveniencia}
        telefone={municipio?.telefone_assistencia_farmaceutica ?? null}
      />
    </Pagina>
  );
}
