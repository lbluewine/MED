import { notFound } from "next/navigation";
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
    <Pagina municipioId={id} atual="classes" largura="larga">
      <h1 className="max-w-[20ch] text-[30px] font-bold leading-tight md:text-[38px]">
        Medicamentos por tipo
      </h1>
      <p className="mt-4 max-w-[65ch]">
        A lista de {municipio.nome} separa os medicamentos em {classes.length}{" "}
        grupos. O nome do grupo é o que a própria lista escreve.
      </p>
      <p className="mt-3 max-w-[65ch] border-l-4 border-processo pl-4">
        Esta página não diz para que serve cada medicamento, nem se algum deles
        serve para você. Isso quem responde é o seu médico.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((c) => (
          <li key={c.slug}>
            <a
              href={`/${id}/remedios/tipo/${c.slug}`}
              className="flex min-h-[64px] items-center justify-between gap-3 rounded-[var(--radius-cartao)] border-2 border-marca-linha px-4 py-3 no-underline hover:border-marca-link hover:bg-marca-fundo"
            >
              <span className="font-bold text-marca-link">{c.nome}</span>
              <span className="flex-none rounded-full bg-marca-fundo px-2.5 py-0.5 text-sm font-bold text-marca">
                {c.remedios.length}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {semTipo.length > 0 && (
        <p className="mt-8 max-w-[65ch] text-texto-suave">
          {semTipo.length === 1
            ? "Um medicamento da lista não tem grupo informado na fonte, e por isso não aparece acima. Ele está em "
            : `${semTipo.length} medicamentos da lista não têm grupo informado na fonte, e por isso não aparecem acima. Eles estão em `}
          <a className="underline" href={`/${id}/remedios`}>
            todos os medicamentos, de A a Z
          </a>
          .
        </p>
      )}

      <NotaFonte
        proveniencia={fontes}
        telefone={municipio.telefone_assistencia_farmaceutica}
      />
    </Pagina>
  );
}
