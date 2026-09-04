import { notFound } from "next/navigation";
import CartaoUnidade from "@/components/CartaoUnidade";
import Mapa, { type PontoMapa } from "@/components/Mapa";
import MinhaDistancia from "@/components/MinhaDistancia";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaMunicipio, carregaUnidades, listaMunicipios } from "@/lib/dados";
import { NOME_UNIDADE_CURTO } from "@/lib/rotulos";
import type { TipoUnidade } from "@/lib/schema";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

export const metadata = { title: "Onde pegar — Tem no SUS?" };

/**
 * A ordem é a da chance de a pessoa precisar, não a alfabética. Quem chega
 * aqui quase sempre quer um medicamento comum, e isso é farmácia do distrito ou
 * posto de saúde.
 */
const ORDEM: TipoUnidade[] = [
  "farmacia_distrital",
  "dispensario_ubs",
  "farmacia_estrategica",
  "farmacia_ceaf",
  "farmacia_caps",
  "farmacia_alimentar",
  "programa_insumos",
  "farmacia_popular",
];

export default async function OndePegar({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio: id } = await params;
  if (!listaMunicipios().includes(id)) notFound();

  const municipio = carregaMunicipio(id);
  const unidades = carregaUnidades(id);

  const pontos: PontoMapa[] = unidades
    .filter((u) => u.endereco.geo)
    .map((u) => ({
      id: u.id,
      nome: u.nome,
      lat: u.endereco.geo!.lat,
      lng: u.endereco.geo!.lng,
      href: `/${id}/unidade/${u.id}`,
    }));

  const semMapa = unidades.length - pontos.length;

  const fontes = [
    ...new Map(
      unidades.flatMap((u) => u.proveniencia).map((f) => [f.fonte_nome, f]),
    ).values(),
  ];

  return (
    <Pagina municipioId={id} atual="onde-pegar" largura="larga">
        <h1 className="max-w-[20ch] text-[30px] font-bold leading-tight md:text-[38px]">
          Onde pegar medicamento em {municipio.nome}
        </h1>
        <p className="mt-2 max-w-[36em] text-texto-suave">
          São {unidades.length} lugares. Ligue antes de sair de casa: a lista
          diz o que cada um entrega, mas não diz o que tem em estoque hoje, nem
          em quais dias da semana cada lugar abre.
        </p>

        {pontos.length > 0 && (
          <MinhaDistancia
            pontos={pontos.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng }))}
          />
        )}

        <div className="mt-8 md:grid md:grid-cols-[1fr_360px] md:items-start md:gap-12">
          <div>
            {ORDEM.map((tipo) => {
              const doTipo = unidades.filter((u) => u.tipo === tipo);
              if (doTipo.length === 0) return null;
              return (
                <section key={tipo} id={tipo} className="mt-10 scroll-mt-8 first:mt-0">
                  <h2 className="text-[26px] font-bold tracking-tight text-marca">
                    {NOME_UNIDADE_CURTO[tipo]} ({doTipo.length})
                  </h2>
                  <div className="mt-4 grid gap-4">
                    {doTipo.map((u) => (
                      <CartaoUnidade
                        key={u.id}
                        unidade={u}
                        ddd={municipio.ddd}
                        municipioId={id}
                        comBotao
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {semMapa > 0 && (
              <p className="mt-8 max-w-[65ch] text-texto-suave">
                {semMapa === 1
                  ? "Um lugar não aparece no mapa porque ainda não conferimos a localização dele."
                  : `${semMapa} lugares não aparecem no mapa porque ainda não conferimos a localização deles.`}{" "}
                O endereço e o telefone estão certos.
              </p>
            )}
          </div>

          <div className="mt-10 md:mt-0 md:sticky md:top-8">
            <h2 className="text-[26px] font-bold tracking-tight text-marca">No mapa</h2>
            <p className="mt-1 text-texto-suave">
              Posição das unidades com localização conferida.
            </p>
            <Mapa pontos={pontos} centro={municipio.centro} />
          </div>
        </div>

        <NotaFonte
          proveniencia={fontes}
          telefone={municipio.telefone_assistencia_farmaceutica}
        />
    </Pagina>
  );
}
