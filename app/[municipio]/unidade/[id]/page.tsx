import { notFound } from "next/navigation";
import CartaoUnidade from "@/components/CartaoUnidade";
import NotaFonte from "@/components/NotaFonte";
import { carregaMunicipio, carregaUnidades, listaMunicipios } from "@/lib/dados";

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-[30px] font-bold leading-tight">{unidade.nome}</h1>

      <CartaoUnidade
        unidade={unidade}
        ddd={municipio.ddd}
        municipioId={municipioId}
        comTitulo={false}
      />

      {unidade.observacoes && (
        <p className="mt-4 max-w-[65ch]">{unidade.observacoes}</p>
      )}

      {/*
        Quando as fontes oficiais discordam, o site mostra as duas. Esconder a
        divergência é escolher por quem vai pegar o ônibus.
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

      {geo && (
        <p className="mt-8">
          <a
            className="underline"
            href={`https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lng}#map=17/${geo.lat}/${geo.lng}`}
            rel="noreferrer"
          >
            Ver no mapa
          </a>
        </p>
      )}

      <p className="mt-4">
        <a className="underline" href={`/${municipioId}/onde-pegar`}>
          Ver todos os lugares de {municipio.nome}
        </a>
      </p>

      <NotaFonte
        proveniencia={unidade.proveniencia}
        telefone={municipio.telefone_assistencia_farmaceutica}
      />
    </div>
  );
}
