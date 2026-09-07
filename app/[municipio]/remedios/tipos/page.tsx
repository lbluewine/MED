import { notFound } from "next/navigation";
import Cartao, { Pilula } from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { listaClasses, semClassificacao } from "@/lib/classes";
import { carregaMunicipio, carregaRemume, listaMunicipios } from "@/lib/dados";

export function generateStaticParams() {
  return listaMunicipios().map((municipio) => ({ municipio }));
}

export const metadata = { title: "Medicamentos por tipo — Tem no SUS?" };

/**
 * Entrada pela classificação que a REMUME já traz em cada item.
 *
 * O termo aparece como a fonte escreve. Trocar por linguagem de indicação
 * ("para pressão alta") seria conteúdo clínico, e conteúdo clínico só vai ao
 * ar com revisão farmacêutica registrada — ver docs/CONTEUDO.md.
 */
export default async function TiposDeRemedio({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio: id } = await params;
  if (!listaMunicipios().includes(id)) notFound();

  const municipio = carregaMunicipio(id);
  const classes = listaClasses(id);
  const semTipo = semClassificacao(id);

  const fontes = [
    ...new Map(
      carregaRemume(id).flatMap((i) => i.proveniencia).map((f) => [f.fonte_nome, f]),
    ).values(),
  ];

  return (
    <Pagina municipioId={id} atual="classes">
      <Migalha itens={[{ texto: "Início", href: "/" }, { texto: "Por tipo" }]} />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Por tipo de medicamento
      </h1>
      <p className="mt-1.5 max-w-[70ch] text-texto-suave">
        {classes.length} grupos, do jeito que a própria lista de {municipio.nome}{" "}
        classifica.
      </p>
      <p className="mt-3 max-w-[70ch] rounded-r-lg border-l-4 border-[#b57505] bg-[#fdf5e6] px-4 py-3 leading-normal text-[#5a4413]">
        Esta página não diz para que serve cada medicamento, nem se algum deles
        serve para você. Isso quem responde é o seu médico.
      </p>

      <div className="mt-6 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(268px,1fr))]">
        {classes.map((c) => (
          <a
            key={c.slug}
            href={`/${id}/remedios/tipo/${c.slug}`}
            className="block rounded-[var(--radius-cartao)] border border-borda-cartao bg-fundo px-6 py-5 text-texto no-underline transition-shadow hover:border-marca-link hover:shadow-[0_10px_26px_rgba(12,50,111,0.09)]"
          >
            <Pilula>{c.remedios.length}</Pilula>
            <h2 className="mb-1.5 mt-2.5 text-[19px] font-bold leading-tight text-marca-link">
              {c.nome}
            </h2>
            <p className="text-[15px] text-texto-suave">
              {c.remedios
                .slice(0, 3)
                .map((r) => r.nome_curto)
                .join(", ")}
              {c.remedios.length > 3 ? "…" : ""}
            </p>
          </a>
        ))}
      </div>

      {semTipo.length > 0 && (
        <Cartao className="mt-6 px-6 py-4">
          <p className="max-w-[70ch] text-texto-suave">
            {semTipo.length === 1
              ? "Um medicamento da lista não tem grupo informado na fonte, e por isso não aparece acima. Ele está em "
              : `${semTipo.length} medicamentos da lista não têm grupo informado na fonte, e por isso não aparecem acima. Eles estão em `}
            <a href={`/${id}/remedios`}>todos os medicamentos, de A a Z</a>.
          </p>
        </Cartao>
      )}

      <NotaFonte
        proveniencia={fontes}
        telefone={municipio.telefone_assistencia_farmaceutica}
      />
    </Pagina>
  );
}
