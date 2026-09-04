import { notFound } from "next/navigation";
import NotaFonte from "@/components/NotaFonte";
import {
  carregaCeaf,
  carregaMunicipio,
  carregaUnidades,
  listaMunicipios,
} from "@/lib/dados";
import { dataPorExtenso } from "@/lib/prazos";
import { telefoneCompleto } from "@/components/CartaoUnidade";
import { TIPO_DOCUMENTO } from "@/lib/rotulos";
import type { DocumentoCeaf } from "@/lib/schema";

const UF = "sc";

export function generateStaticParams() {
  return (carregaCeaf(UF)?.condicoes ?? []).map((c) => ({ condicao: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ condicao: string }>;
}) {
  const { condicao } = await params;
  const c = carregaCeaf(UF)?.condicoes.find((x) => x.slug === condicao);
  return { title: c ? `${c.nome} — alto custo — Tem no SUS?` : "Tem no SUS?" };
}

function ListaDocumentos({
  documentos,
  porNome = false,
}: {
  documentos: DocumentoCeaf[];
  /**
   * Nos papéis gerais, o tipo é quase sempre "declaração" e não distingue
   * nada. Ali o nome do papel é que diz qual é qual.
   */
  porNome?: boolean;
}) {
  return (
    <ul className="mt-3">
      {documentos.map((d) => (
        <li key={d.url} className="border-b border-linha py-4">
          <p className="font-bold">
            {/*
              Quadradinho para marcar à caneta. Muita gente vai imprimir esta
              página e ir riscando o que já conseguiu.
            */}
            <span aria-hidden="true" className="mr-2">
              ☐
            </span>
            {porNome ? d.nome : TIPO_DOCUMENTO[d.tipo].titulo}
          </p>
          {!porNome && TIPO_DOCUMENTO[d.tipo].explicacao && (
            <p className="mt-1 max-w-[65ch]">
              {TIPO_DOCUMENTO[d.tipo].explicacao}
            </p>
          )}
          {d.descricao && (
            <p className="mt-1 max-w-[65ch]">{d.descricao}</p>
          )}
          <p className="mt-1">
            <a className="underline" href={d.url} rel="noreferrer">
              Baixar
            </a>
            <span className="text-texto-suave">
              {" "}
              — {porNome ? "PDF" : d.nome}
              {d.tamanho ? `, ${d.tamanho}` : ""}
              {d.publicado_em
                ? `, publicado em ${dataPorExtenso(d.publicado_em)}`
                : ""}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function Condicao({
  params,
}: {
  params: Promise<{ condicao: string }>;
}) {
  const { condicao } = await params;
  const ceaf = carregaCeaf(UF);
  const c = ceaf?.condicoes.find((x) => x.slug === condicao);
  if (!ceaf || !c) notFound();

  const ondeProtocolar = listaMunicipios().flatMap((id) => {
    const municipio = carregaMunicipio(id);
    return carregaUnidades(id)
      .filter((u) => u.tipo === "farmacia_ceaf")
      .map((u) => ({ id, municipio, unidade: u }));
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="nao-imprime">
        <a className="underline" href="/alto-custo">
          Voltar para a lista de doenças
        </a>
      </p>

      <h1 className="mt-4 text-[30px] font-bold leading-tight">
        Alto custo: {c.nome}
      </h1>
      <p className="mt-4 max-w-[65ch]">
        Esta é a lista de papéis que o governo de Santa Catarina publica para
        quem pede remédio de alto custo para {c.nome.toLowerCase()}. Imprima
        esta página e leve na consulta: quem preenche os formulários é o
        médico.
      </p>

      {/*
        A parte mais útil da página, e a que as cartilhas não dão: quais
        exames, para qual doença, para qual remédio. Vem do Resumo publicado
        pela SES/SC e é citada sem reescrita.

        O mesmo Resumo traz dose, critério de inclusão e monitoramento. Nada
        disso aparece aqui: é conteúdo clínico, e conteúdo clínico não vai ao
        ar sem revisão farmacêutica. Ver docs/CONTEUDO.md.
      */}
      {c.anexos_obrigatorios.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-2xl font-bold">O que o pedido precisa ter</h2>
          <p className="mt-2 max-w-[65ch]">
            Depende do remédio que o médico for pedir. Veja o seu na lista.
          </p>
          {c.anexos_obrigatorios.map((g) => (
            <div key={g.itens.join("|")} className="mt-6">
              {g.medicamentos.length > 0 && (
                <h3 className="text-[20px] font-bold">
                  Para {g.medicamentos.join(", ")}
                </h3>
              )}
              <ul className="mt-2">
                {g.itens.map((i) => (
                  <li key={i} className="max-w-[65ch] border-b border-linha py-3">
                    <span aria-hidden="true" className="mr-2 font-bold">
                      ☐
                    </span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : (
        <p className="mt-8 max-w-[65ch] border-l-4 border-processo pl-4">
          <span aria-hidden="true">! </span>
          Não conseguimos ler no documento do estado quais exames este pedido
          precisa. Pergunte na farmácia de alto custo, ou abra o resumo mais
          abaixo.
        </p>
      )}

      {c.cid10.length > 0 && (
        <p className="mt-6 max-w-[65ch] text-texto-suave">
          O código desta doença no laudo é {c.cid10.join(", ")}. Quem preenche é
          o médico.
        </p>
      )}

      {c.documentos.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-2xl font-bold">
            Papéis desta doença ({c.documentos.length})
          </h2>
          <ListaDocumentos documentos={c.documentos} />
        </section>
      ) : (
        <p className="mt-8 max-w-[65ch] border-l-4 border-processo pl-4">
          <span aria-hidden="true">! </span>
          O portal do estado não publica papéis próprios para esta doença.
          Pergunte na farmácia de alto custo o que o seu caso precisa.
        </p>
      )}

      {ceaf.documentos_gerais.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">
            Papéis que valem para qualquer doença
          </h2>
          <p className="mt-2 max-w-[65ch]">
            Nem todos servem para o seu caso. Confirme na farmácia de alto
            custo quais são os seus.
          </p>
          <ListaDocumentos documentos={ceaf.documentos_gerais} porNome />
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Onde entregar</h2>
        {ondeProtocolar.length > 0 ? (
          ondeProtocolar.map(({ id, municipio, unidade }) => (
            <div key={unidade.id} className="mt-3 max-w-[65ch]">
              <p>
                Em {municipio.nome}:{" "}
                <a
                  className="underline nao-imprime"
                  href={`/${id}/unidade/${unidade.id}`}
                >
                  {unidade.nome}
                </a>
                <span className="hidden print:inline">{unidade.nome}</span>
              </p>
              <p>
                {unidade.endereco.logradouro}
                {unidade.endereco.bairro ? `, ${unidade.endereco.bairro}` : ""}
                {unidade.endereco.cep ? ` — CEP ${unidade.endereco.cep}` : ""}
              </p>
              {unidade.telefones.length > 0 && (
                <p>
                  Telefone:{" "}
                  {unidade.telefones
                    .map((t) => telefoneCompleto(t, municipio.ddd))
                    .join(" ou ")}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="mt-2 max-w-[65ch]">
            Pergunte na sua unidade de saúde onde fica a farmácia de alto custo
            da sua cidade.
          </p>
        )}
      </section>

      <section className="mt-10 border-l-4 border-processo pl-4">
        <h2 className="text-2xl font-bold">
          <span aria-hidden="true">! </span>
          O que esta página não diz
        </h2>
        <p className="mt-2 max-w-[65ch]">
          A ordem dos passos, e se o seu caso se encaixa nas regras. Quem
          decide isso é o médico. Também não dizemos dose nem como tomar: isso
          está no documento do estado, escrito para o profissional.
        </p>
        <p className="mt-2 max-w-[65ch]">
          Esta página junta o que o estado publica em{" "}
          <a className="underline" href={c.url_fonte} rel="noreferrer">
            {c.nome_fonte}
          </a>
          . Se lá tiver mudado, o que vale é lá.
        </p>
      </section>

      <NotaFonte proveniencia={ceaf.proveniencia} telefone={null} />
    </div>
  );
}
