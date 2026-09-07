import FarmaciasCredenciadas from "@/components/FarmaciasCredenciadas";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import {
  carregaFarmaciasPopulares,
  carregaMunicipio,
  listaMunicipios,
} from "@/lib/dados";
import { elencoFarmaciaPopular } from "@/lib/farmacia-popular";
import { dataPorExtenso } from "@/lib/prazos";

export const metadata = {
  title: "Onde tem Farmácia Popular — Tem no SUS?",
};

/** As drogarias credenciadas da cidade, por bairro, com mapa. */
export default function FarmaciasDoPrograma() {
  const [municipioNav] = listaMunicipios();
  const elenco = elencoFarmaciaPopular();
  const municipio = municipioNav ? carregaMunicipio(municipioNav) : null;
  const credenciadas = municipioNav ? carregaFarmaciasPopulares(municipioNav) : null;

  const migalha = [
    { texto: "Início", href: "/" },
    { texto: "Farmácia Popular", href: "/farmacia-popular" },
    { texto: "Onde tem" },
  ];

  /*
    Sem a lista da cidade, a página não fica quebrada nem em branco: manda para
    o painel oficial, que é sempre o de hoje. Ver data/fontes/FONTES.md.
  */
  if (!elenco || !credenciadas || !municipio) {
    return (
      <Pagina municipioId={municipioNav} atual="farmacia-popular">
        <Migalha itens={migalha} />
        <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
          Onde tem Farmácia Popular
        </h1>
        <p className="mt-4 max-w-[65ch] leading-normal">
          Ainda não publicamos a lista de farmácias credenciadas desta cidade.
          {elenco && (
            <>
              {" "}
              <a href={elenco.busca_enderecos.url} rel="noreferrer">
                Consulte o painel do Ministério da Saúde
              </a>
              .
            </>
          )}
        </p>
      </Pagina>
    );
  }

  return (
    <Pagina municipioId={municipioNav} atual="farmacia-popular">
      <Migalha itens={migalha} />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        As {credenciadas.farmacias.length} farmácias credenciadas em{" "}
        {municipio.nome}
      </h1>
      <p className="mt-1.5 max-w-[68ch] leading-normal text-[#33506f]">
        São drogarias da rua, não postos de saúde. Nem toda farmácia do programa
        tem a placa visível: se tiver dúvida, pergunte no balcão se ali atende
        pelo Farmácia Popular.
      </p>

      <FarmaciasCredenciadas
        farmacias={credenciadas.farmacias}
        centro={municipio.centro}
      />

      <p className="mt-8 max-w-[68ch] text-[13.5px] leading-normal text-texto-suave">
        Lista atualizada em{" "}
        {dataPorExtenso(credenciadas.proveniencia[0]!.fonte_data)}. A rede muda
        com o tempo — a de hoje está sempre no{" "}
        <a href={elenco.busca_enderecos.url} rel="noreferrer">
          painel do Ministério da Saúde
        </a>
        .
      </p>

      <NotaFonte
        proveniencia={credenciadas.proveniencia}
        telefone={municipio.telefone_assistencia_farmaceutica}
      />
    </Pagina>
  );
}
