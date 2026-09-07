import { notFound } from "next/navigation";
import Botao from "@/components/Botao";
import Cartao, { Rotulo } from "@/components/Cartao";

import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaMunicipio, carregaUnidades, listaMunicipios } from "@/lib/dados";
import { NOME_UNIDADE_CURTO, telefoneCompleto, telefoneHref } from "@/lib/rotulos";

export function generateStaticParams() {
  return listaMunicipios().flatMap((municipio) =>
    carregaUnidades(municipio).map((u) => ({ municipio, id: u.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string; id: string }>;
}) {
  const { municipio, id } = await params;
  const u = carregaUnidades(municipio).find((x) => x.id === id);
  return { title: u ? `${u.nome} — Tem no SUS?` : "Tem no SUS?" };
}

export default async function PaginaUnidade({
  params,
}: {
  params: Promise<{ municipio: string; id: string }>;
}) {
  const { municipio: municipioId, id } = await params;
  if (!listaMunicipios().includes(municipioId)) notFound();

  const municipio = carregaMunicipio(municipioId);
  const unidade = carregaUnidades(municipioId).find((u) => u.id === id);
  if (!unidade) notFound();

  const geo = unidade.endereco.geo;
  const e = unidade.endereco;
  const semDias =
    unidade.horarios.length > 0 && unidade.horarios.every((h) => h.dias === null);

  return (
    <Pagina municipioId={municipioId} atual="onde-pegar">
      <Migalha
        itens={[
          { texto: "Início", href: "/" },
          { texto: "Unidades de saúde", href: `/${municipioId}/onde-pegar` },
          { texto: unidade.nome },
        ]}
      />

      <div className="flex flex-wrap items-start gap-7">
        <div className="min-w-0 flex-1 basis-[500px]">
          <Cartao className="px-7 py-7">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-marca-fraca">
              {NOME_UNIDADE_CURTO[unidade.tipo]}
            </p>
            <h1 className="mt-2 text-[30px] font-bold leading-[1.1] tracking-tight text-marca md:text-[34px]">
              {unidade.nome}
            </h1>
            <p className="mt-2 text-[#33506f]">
              {e.logradouro}
              {e.bairro ? `, ${e.bairro}` : ""}
              {e.cep ? ` — CEP ${e.cep}` : ""}
            </p>

            {unidade.restricao && (
              <p className="mt-5 rounded-r-lg border-l-4 border-[#b57505] bg-[#fdf5e6] px-4 py-3.5 leading-normal text-[#5a4413]">
                <span aria-hidden="true">! </span>
                {unidade.restricao}
              </p>
            )}

            <div className="mt-5 grid gap-5 border-t border-divisoria pt-5 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              {unidade.telefones.length > 0 && (
                <div>
                  <Rotulo>Telefone</Rotulo>
                  <p className="mt-1 text-[19px] font-semibold">
                    {unidade.telefones.map((t, n) => (
                      <span key={t}>
                        {n > 0 && " ou "}
                        <a
                          href={telefoneHref(t, municipio.ddd)}
                        >
                          {telefoneCompleto(t, municipio.ddd)}
                        </a>
                      </span>
                    ))}
                  </p>
                </div>
              )}
              {unidade.horarios.length > 0 && (
                <div>
                  <Rotulo>Horário</Rotulo>
                  <p className="mt-1 text-[19px] font-semibold">
                    {unidade.horarios
                      .map((h) => `${h.abre} às ${h.fecha}`)
                      .join(" e ")}
                  </p>
                </div>
              )}
            </div>

            {/*
              A fonte dá o horário mas não os dias. Dizer "seg a sex" seria
              inventar, e mandar alguém num sábado que a porta está fechada.
            */}
            {semDias && (
              <p className="mt-4 max-w-[65ch] text-sm leading-normal text-texto-suave">
                A lista da prefeitura informa o horário, mas não diz em quais
                dias da semana este lugar abre. Ligue antes de ir.
              </p>
            )}

            <div className="nao-imprime mt-6 flex flex-col gap-3 md:flex-row">
              {unidade.telefones[0] && (
                <Botao
                  variante="primario"
                  href={telefoneHref(unidade.telefones[0], municipio.ddd)}
                  className="w-full md:w-auto"
                >
                  Ligar para a unidade
                </Botao>
              )}
              {geo && (
                <Botao
                  variante="secundario"
                  href={`https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lng}#map=17/${geo.lat}/${geo.lng}`}
                  rel="noreferrer"
                  className="w-full md:w-auto"
                >
                  Ver rota até aqui
                </Botao>
              )}
            </div>
          </Cartao>

          <Cartao className="mt-4 px-7 pb-3 pt-6">
            <h2 className="mb-1.5 text-[22px] font-bold text-marca">
              O que esta unidade entrega
            </h2>
            <p className="pb-3 leading-normal text-[#33506f]">
              {unidade.entrega_descricao}
            </p>
            {unidade.observacoes && (
              <p className="border-t border-divisoria py-3 leading-normal text-[#33506f]">
                {unidade.observacoes}
              </p>
            )}
          </Cartao>

          {/*
            Quando as fontes oficiais discordam, o site mostra as duas.
            Esconder a divergência é escolher por quem vai pegar o ônibus.
          */}
          {unidade.divergencias.length > 0 && (
            <Cartao as="section" className="mt-4 px-7 py-6">
              <h2 className="text-[22px] font-bold text-marca">
                <span aria-hidden="true">! </span>
                Confira antes de ir
              </h2>
              <p className="mt-2 max-w-[65ch] leading-normal">
                Os documentos da prefeitura não dizem a mesma coisa sobre este
                lugar. Mostramos os dois:
              </p>
              <ul className="mt-2 max-w-[65ch] list-disc pl-6">
                {unidade.divergencias.map((d) => (
                  <li key={d} className="mt-2">
                    {d}
                  </li>
                ))}
              </ul>
            </Cartao>
          )}

          <NotaFonte
            proveniencia={unidade.proveniencia}
            telefone={municipio.telefone_assistencia_farmaceutica}
          />
        </div>
      </div>
    </Pagina>
  );
}
