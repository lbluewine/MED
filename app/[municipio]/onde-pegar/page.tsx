import { notFound } from "next/navigation";
import Cartao, { Pilula } from "@/components/Cartao";
import LinhaUnidade from "@/components/LinhaUnidade";
import Mapa, { type PontoMapa } from "@/components/Mapa";
import Migalha from "@/components/Migalha";
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
 * aqui quase sempre quer um medicamento comum, e isso é farmácia do distrito
 * ou posto de saúde.
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
  const tipos = ORDEM.map((tipo) => ({
    tipo,
    doTipo: unidades.filter((u) => u.tipo === tipo),
  })).filter((t) => t.doTipo.length > 0);

  const fontes = [
    ...new Map(
      unidades.flatMap((u) => u.proveniencia).map((f) => [f.fonte_nome, f]),
    ).values(),
  ];

  return (
    <Pagina municipioId={id} atual="onde-pegar">
      <Migalha
        itens={[{ texto: "Início", href: "/" }, { texto: "Unidades de saúde" }]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Onde pegar
      </h1>
      <p className="mt-1.5 max-w-[62ch] leading-normal text-texto-suave">
        As {unidades.length} unidades de saúde de {municipio.nome}, agrupadas
        nos {tipos.length} tipos, na ordem da chance de você precisar. Ligue
        antes de sair de casa: a lista diz o que cada uma entrega, mas não diz o
        que tem em estoque hoje, nem em quais dias da semana cada lugar abre.
      </p>

      <div className="mt-6 flex flex-wrap items-start gap-7">
        <div className="min-w-0 flex-1 basis-[520px]">
          {pontos.length > 0 && (
            <Cartao className="mb-5 px-5 py-4">
              <MinhaDistancia
                pontos={pontos.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng }))}
              />
            </Cartao>
          )}

          <div className="flex flex-col gap-3.5">
            {tipos.map(({ tipo, doTipo }) => (
              <Cartao as="section" key={tipo} id={tipo} className="scroll-mt-6 overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-borda-cartao bg-marca-veu px-6 py-4">
                  <h2 className="text-[19px] font-bold text-marca">
                    {NOME_UNIDADE_CURTO[tipo]}
                  </h2>
                  <Pilula>{doTipo.length}</Pilula>
                </div>
                {doTipo.map((u) => (
                  <LinhaUnidade
                    key={u.id}
                    unidade={u}
                    ddd={municipio.ddd}
                    municipioId={id}
                  />
                ))}
              </Cartao>
            ))}
          </div>

          {semMapa > 0 && (
            <p className="mt-5 max-w-[65ch] text-texto-suave">
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

        <aside className="nao-imprime min-w-0 flex-1 basis-[320px] lg:sticky lg:top-6">
          <Cartao className="overflow-hidden">
            <Mapa pontos={pontos} centro={municipio.centro} />
            <p className="border-t border-divisoria px-5 py-4 text-sm leading-normal text-texto-suave">
              Mapa do OpenStreetMap, sem chave de API e sem Google. Sem
              JavaScript, a lista de endereços ao lado é a alternativa.
            </p>
          </Cartao>
        </aside>
      </div>
    </Pagina>
  );
}
