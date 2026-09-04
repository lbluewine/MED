import { notFound } from "next/navigation";
import Botao from "@/components/Botao";
import Cabecalho from "@/components/Cabecalho";
import CartaoUnidade, { telefoneCompleto } from "@/components/CartaoUnidade";
import NotaFonte from "@/components/NotaFonte";
import { carregaMunicipio, carregaUnidades, listaMunicipios } from "@/lib/dados";
import { NOME_UNIDADE_CURTO } from "@/lib/rotulos";

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
  // A faixa é âmbar quando o lugar não atende todo mundo — é o aviso que mais
  // evita a viagem perdida, então vai antes de qualquer outra coisa.
  const restrito = Boolean(unidade.restricao);

  return (
    <div>
      <Cabecalho municipioId={municipioId} />

      <div className={`${restrito ? "bg-processo" : "bg-tem"} px-4 py-8 text-fundo md:px-12 md:py-10`}>
        <div className="mx-auto max-w-5xl">
          <p className="max-w-[28ch] text-[30px] font-bold leading-tight md:text-[38px]">
            {restrito ? "Atendimento restrito" : NOME_UNIDADE_CURTO[unidade.tipo]}
          </p>
          {unidade.restricao ? (
            <p className="mt-3 max-w-[50ch] text-xl leading-snug">{unidade.restricao}</p>
          ) : (
            unidade.horarios.length > 0 && (
              <p className="mt-3 max-w-[50ch] text-xl leading-snug">
                {unidade.horarios.map((h) => `${h.abre} às ${h.fecha}`).join(" e ")}
                {unidade.horarios.every((h) => h.dias === null) &&
                  " — a fonte não diz em quais dias"}
              </p>
            )
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-12 md:py-10">
        <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">{unidade.nome}</h1>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          {unidade.telefones[0] && (
            <Botao
              variante="primario"
              href={`tel:+55${municipio.ddd}${unidade.telefones[0].replace(/\D/g, "").slice(-9)}`}
              className="w-full md:w-auto"
            >
              Ligar: {telefoneCompleto(unidade.telefones[0], municipio.ddd)}
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

        <div className="mt-8 border-t border-linha pt-6">
          <CartaoUnidade
            unidade={unidade}
            ddd={municipio.ddd}
            municipioId={municipioId}
            comTitulo={false}
          />
        </div>

        {unidade.observacoes && (
          <p className="mt-2 max-w-[65ch]">{unidade.observacoes}</p>
        )}

        {/*
          Quando as fontes oficiais discordam, o site mostra as duas. Esconder
          a divergência é escolher por quem vai pegar o ônibus.
        */}
        {unidade.divergencias.length > 0 && (
          <section className="mt-8 border-l-4 border-processo pl-4">
            <h2 className="text-2xl font-bold">
              <span aria-hidden="true">! </span>
              Confira antes de ir
            </h2>
            <p className="mt-2 max-w-[65ch]">
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
          </section>
        )}

        <p className="mt-8">
          <a className="underline" href={`/${municipioId}/onde-pegar`}>
            Ver todos os lugares de {municipio.nome}
          </a>
        </p>

        <NotaFonte
          proveniencia={unidade.proveniencia}
          telefone={municipio.telefone_assistencia_farmaceutica}
        />
      </div>
    </div>
  );
}
