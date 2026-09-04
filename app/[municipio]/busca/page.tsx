import { notFound } from "next/navigation";
import Cabecalho from "@/components/Cabecalho";
import CampoBusca from "@/components/CampoBusca";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";
import { montaIndice, sugere } from "@/lib/busca";
import { indiceSerializado } from "@/lib/indice";
import { listaRemedios } from "@/lib/remedios";
import { SEM_RESULTADO } from "@/lib/textos";

/**
 * A mesma busca, feita no servidor.
 *
 * É para onde o formulário vai quando não há JavaScript, e é o que garante a
 * regra de nunca deixar ninguém com a tela em branco.
 */
export default async function Busca({
  params,
  searchParams,
}: {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { municipio: id } = await params;
  if (!listaMunicipios().includes(id)) notFound();

  const { q = "" } = await searchParams;
  const municipio = carregaMunicipio(id);
  const remedios = listaRemedios(id);

  const indice = montaIndice(
    remedios.map((r) => ({
      id: r.slug,
      nome: r.grafias.join(" "),
      populares: r.nomes_populares.join(" "),
      tem_para_levar: r.tem_para_levar,
    })),
  );
  const achados = q.trim() ? sugere(indice, q, 10) : [];

  return (
    <div>
      <Cabecalho municipioId={id} />
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-12 md:py-14">
      <h1 className="text-[30px] font-bold leading-tight">
        {q.trim() ? `Resultado para "${q}"` : "Procurar remédio"}
      </h1>

      {q.trim() && achados.length === 0 && (
        <>
          <p className="mt-6 max-w-[65ch] border-l-8 border-nao-tem pl-4 text-[20px]">
            {SEM_RESULTADO}
          </p>
          <h2 className="mt-8 text-2xl font-bold">O que fazer agora</h2>
          <ul className="mt-2 max-w-[65ch] list-disc pl-6">
            <li className="mt-2">
              Procure pelo nome genérico, o que vem escrito em letra pequena na
              caixa. É por ele que a lista é organizada.
            </li>
            <li className="mt-2">
              <a className="underline" href={`/${id}/remedios`}>
                Veja a lista completa de A a Z
              </a>{" "}
              e procure com os olhos.
            </li>
            <li className="mt-2">
              Se for um remédio caro, ele pode ser de alto custo. Quem entrega
              esses é o governo do estado (CEAF), não a prefeitura.
            </li>
            <li className="mt-2">
              Leve a receita ao farmacêutico da sua unidade. Ele atende de graça
              e pode olhar todos os seus remédios juntos.
            </li>
          </ul>
        </>
      )}

      {achados.length > 0 && (
        <ul className="mt-6">
          {achados.map((a) => (
            <li key={a.slug} className="border-b border-linha">
              <a
                href={`/${id}/remedio/${a.slug}`}
                className="block min-h-[48px] py-3 text-[20px] underline"
              >
                {a.nome}
              </a>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10 border-t border-linha pt-6">
        <h2 className="text-2xl font-bold">Procurar outro</h2>
        <div className="mt-4">
          <CampoBusca
            municipioId={id}
            indice={indiceSerializado(id)}
            termoInicial={q}
          />
        </div>
      </section>

      <p className="mt-8 text-texto-suave">
        A lista é a de {municipio.nome}.
      </p>
      </div>
    </div>
  );
}
