import { notFound } from "next/navigation";
import CampoBusca from "@/components/CampoBusca";
import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaRename, listaMunicipios, resolveMunicipio } from "@/lib/dados";
import { montaIndice, sugere } from "@/lib/busca";
import {
  itensSemListaMunicipal,
  procuraNoElenco,
  rotuloIndicacao,
} from "@/lib/farmacia-popular";
import { indiceSerializado } from "@/lib/indice";
import { listaRemedios } from "@/lib/remedios";
import { procuraNaRename } from "@/lib/rename";
import { semResultado } from "@/lib/textos";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}
export const dynamicParams = true;

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
  const resolvido = resolveMunicipio(id);
  if (!resolvido) notFound();

  const { q = "" } = await searchParams;

  if (!resolvido.temRemume) {
    const { nome } = resolvido.municipio;
    const rename = carregaRename();
    const achados = q.trim() ? procuraNaRename(q) : [];

    return (
      <Pagina municipioId={id} atual="inicio">
        <Migalha
          itens={[
            { texto: "Início", href: "/" },
            { texto: nome, href: `/${id}` },
            { texto: "Busca" },
          ]}
        />
        <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
          {q.trim() ? `Resultados para “${q}”` : "Procurar medicamento"}
        </h1>
        <p className="mt-1.5 max-w-[65ch] leading-normal text-texto-suave">
          {nome} ainda não tem lista própria cadastrada aqui — a busca é só no
          piso nacional (RENAME), o mesmo em qualquer cidade do Brasil.
        </p>

        <div className="mt-6 flex max-w-[600px] flex-col gap-3.5">
          {achados.map((item) => (
            <Cartao key={item.texto} className="px-6 py-5">
              <span className="text-[19px] font-bold text-marca-link first-letter:uppercase">
                {item.texto}
              </span>
              <span className="mt-1 block text-[15px] text-texto-suave">
                {item.forma_farmaceutica}
              </span>
            </Cartao>
          ))}

          {q.trim() && achados.length === 0 && (
            <Cartao className="px-6 py-6">
              <p className="max-w-[65ch] text-[20px] leading-normal">
                {semResultado(nome)}
              </p>
              <p className="mt-4 max-w-[65ch] leading-normal text-texto-suave">
                Procure pelo nome genérico, o que vem escrito em letra pequena
                na caixa. Se for um medicamento caro, ele pode ser de alto
                custo — quem entrega esses é o governo do estado (CEAF), não a
                prefeitura. <a href={`/${id}/alto-custo`}>Veja como pedir</a>.
              </p>
            </Cartao>
          )}
        </div>

        <p className="mt-6 max-w-[68ch] leading-normal text-texto-suave">
          Como não sabemos as unidades de {nome}, não dá para dizer onde
          retirar nem qual receita a prefeitura pede. Pergunte na UBS mais
          próxima ou ligue para a Secretaria de Saúde do município.
        </p>

        {rename && <NotaFonte proveniencia={rename.proveniencia} telefone={null} />}
      </Pagina>
    );
  }

  const municipio = resolvido.municipio;
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
  const porSlug = new Map(remedios.map((r) => [r.slug, r]));

  // Segunda chance: o que a cidade não tem, o programa federal pode ter.
  // Só entra na tela quando a lista municipal não respondeu — senão a página
  // passa a competir consigo mesma.
  const noPopular = q.trim() && achados.length === 0 ? procuraNoElenco(q) : [];

  // Cada item do programa tem página própria quando a cidade não o tem.
  const paginaNoPrograma = new Map<string, string>();
  for (const item of itensSemListaMunicipal()) {
    for (const a of item.apresentacoes) {
      paginaNoPrograma.set(a.texto, `/${id}/farmacia-popular/${item.slug}`);
    }
  }

  return (
    <Pagina municipioId={id} atual="inicio">
      <Migalha itens={[{ texto: "Início", href: "/" }, { texto: "Busca" }]} />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        {q.trim() ? `Resultados para “${q}”` : "Procurar medicamento"}
      </h1>
      {q.trim() && (
        <p className="mt-1.5 text-texto-suave">
          {achados.length === 0
            ? "Nada encontrado"
            : achados.length === 1
              ? "1 resultado"
              : `${achados.length} resultados`}{" "}
          · a busca ignora acento e corrige erros de digitação.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-1 basis-[480px] flex-col gap-3.5">
          {achados.map((a) => {
            const r = porSlug.get(a.slug);
            return (
              <a
                key={a.slug}
                href={`/${id}/remedio/${a.slug}`}
                className="block rounded-[var(--radius-cartao)] border border-borda-cartao bg-fundo px-6 py-5 text-texto no-underline transition-shadow hover:border-marca-link hover:shadow-[0_10px_26px_rgba(12,50,111,0.09)]"
              >
                <span className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="text-[21px] font-bold text-marca-link">
                    {a.nome}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.04em] ${
                      a.tem_para_levar
                        ? "bg-[#e2f3ea] text-[#0f6b46]"
                        : "bg-[#fdf0dc] text-[#8a5a00]"
                    }`}
                  >
                    {a.tem_para_levar ? "Tem na lista" : "Só na unidade"}
                  </span>
                </span>
                {r && (
                  <span className="block text-[15.5px] text-texto-suave">
                    {r.apresentacoes.length === 1
                      ? r.apresentacoes[0]!.apresentacao
                      : `${r.apresentacoes.length} apresentações`}
                  </span>
                )}
              </a>
            );
          })}

          {q.trim() && achados.length === 0 && (
            <Cartao className="px-6 py-6">
              <p className="max-w-[65ch] text-[20px] leading-normal">
                {semResultado(municipio.nome)}
              </p>
              <h2 className="mt-6 text-[22px] font-bold text-marca">
                O que fazer agora
              </h2>
              <ul className="mt-2 max-w-[65ch] list-disc pl-6">
                <li className="mt-2">
                  Procure pelo nome genérico, o que vem escrito em letra pequena
                  na caixa. É por ele que a lista é organizada.
                </li>
                <li className="mt-2">
                  <a href={`/${id}/remedios`}>Veja a lista completa de A a Z</a> e
                  procure com os olhos.
                </li>
                <li className="mt-2">
                  Se for um medicamento caro, ele pode ser de alto custo. Quem
                  entrega esses é o governo do estado (CEAF), não a prefeitura.
                </li>
                <li className="mt-2">
                  Leve a receita ao farmacêutico da sua unidade. Ele atende de
                  graça e pode olhar todos os seus medicamentos juntos.
                </li>
              </ul>
            </Cartao>
          )}

          {noPopular.length > 0 && (
            <Cartao className="border-[#ddd0f5] bg-[#faf7ff] px-6 py-6">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#5b3aa6]">
                Programa federal
              </p>
              <h2 className="mt-1.5 text-[22px] font-bold text-marca">
                Mas tem na Farmácia Popular
              </h2>
              <p className="mt-2 max-w-[65ch] leading-normal text-[#33506f]">
                A lista de {municipio.nome} não tem, mas o elenco do Programa
                Farmácia Popular tem. É de graça, na farmácia da rua com o selo
                “Aqui Tem Farmácia Popular”, com receita e documento com CPF.
              </p>
              <ul className="mt-4">
                {noPopular.map((item) => {
                  const href = paginaNoPrograma.get(item.texto);
                  return (
                    <li
                      key={item.texto}
                      className="border-t border-divisoria py-2.5 leading-normal"
                    >
                      {href ? <a href={href}>{item.texto}</a> : item.texto}{" "}
                      <span className="text-texto-suave">
                        · {rotuloIndicacao(item.indicacao)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <ul className="nao-imprime mt-4 leading-normal">
                <li className="border-t border-divisoria py-2">
                  <a href={`/${id}/farmacia-popular`}>Como funciona o programa</a>
                </li>
                <li className="border-t border-divisoria py-2">
                  <a href="/farmacia-popular/farmacias">
                    Onde tem farmácia credenciada
                  </a>
                </li>
              </ul>
            </Cartao>
          )}

          {achados.length > 0 && (
            <p className="text-texto-suave">
              Não era nenhum destes? Veja a{" "}
              <a href={`/${id}/remedios`}>lista A–Z</a> ou procure{" "}
              <a href={`/${id}/remedios/tipos`}>por tipo de medicamento</a>.
            </p>
          )}
        </div>

        <aside className="min-w-0 flex-1 basis-[280px]">
          <Cartao className="px-6 py-5">
            <h2 className="mb-3 text-[18.5px] font-bold text-marca">
              Procurar outro
            </h2>
            <CampoBusca
              municipioId={id}
              indice={indiceSerializado(id)}
              termoInicial={q}
            />
          </Cartao>

          <Cartao className="mt-4 px-6 py-5">
            <h2 className="mb-3 text-[17.5px] font-bold text-marca">
              Como a busca funciona
            </h2>
            <ul className="list-disc pl-5 text-[15px] leading-relaxed text-texto-suave">
              <li className="mb-2">
                Acha pelo nome da caixa: <em>Cozaar</em> leva à losartana
                potássica.
              </li>
              <li className="mb-2">
                Sem acento e com erro de digitação também funciona.
              </li>
              <li>A lista é a de {municipio.nome}.</li>
            </ul>
          </Cartao>
        </aside>
      </div>
    </Pagina>
  );
}
