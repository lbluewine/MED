import { notFound } from "next/navigation";
import CartaoUnidade from "@/components/CartaoUnidade";
import Mapa, { type PontoMapa } from "@/components/Mapa";
import NotaFonte from "@/components/NotaFonte";
import { carregaMunicipio, carregaUnidades, listaMunicipios } from "@/lib/dados";
import { NOME_UNIDADE_CURTO } from "@/lib/rotulos";
import type { TipoUnidade } from "@/lib/schema";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

export const metadata = { title: "Onde pegar — Tem no SUS?" };

/**
 * A ordem é a da chance de a pessoa precisar, não a alfabética. Quem chega
 * aqui quase sempre quer um remédio comum, e isso é farmácia do distrito ou
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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-[30px] font-bold leading-tight">
        Onde pegar em {municipio.nome}
      </h1>
      <p className="mt-4 max-w-[65ch]">
        São {unidades.length} lugares. Ligue antes de sair de casa: a lista diz
        o que cada um entrega, mas não diz o que tem em estoque hoje.
      </p>

      <Mapa pontos={pontos} centro={municipio.centro} />

      {ORDEM.map((tipo) => {
        const doTipo = unidades.filter((u) => u.tipo === tipo);
        if (doTipo.length === 0) return null;
        return (
          <section key={tipo} className="mt-10">
            <h2 className="text-2xl font-bold">
              {NOME_UNIDADE_CURTO[tipo]} ({doTipo.length})
            </h2>
            {doTipo.map((u) => (
              <CartaoUnidade
                key={u.id}
                unidade={u}
                ddd={municipio.ddd}
                municipioId={id}
              />
            ))}
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

      <NotaFonte
        proveniencia={fontes}
        telefone={municipio.telefone_assistencia_farmaceutica}
      />
    </div>
  );
}
