import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaCeaf, carregaMunicipio, carregaUnidades, resolveMunicipio } from "@/lib/dados";
import { NOME_UF } from "@/lib/rotulos";

/**
 * O guia do alto custo (CEAF).
 *
 * A lista de doenças e os papéis de cada uma são do **estado**: valem igual em
 * qualquer cidade dele. Já o lugar de entregar o pedido é **da cidade** — e é
 * aí que a página errava. Ela mostrava a farmácia de Criciúma para quem tinha
 * acabado de escolher Içara, porque pegava sempre o primeiro município da
 * lista. Agora, quando se sabe a cidade, aparece o ponto dela ou o aviso de
 * que ainda não temos esse endereço; sem cidade, aparecem os que o site cobre,
 * cada um com o nome do município na frente.
 */
export default function AltoCusto({ municipioId }: { municipioId?: string }) {
  const resolvido = municipioId ? resolveMunicipio(municipioId) : null;
  const uf = (resolvido?.municipio.uf ?? "SC").toLowerCase();
  const ceaf = carregaCeaf(uf);
  const nomeUf = NOME_UF[uf.toUpperCase()] ?? uf.toUpperCase();
  const nomeCidade = resolvido?.municipio.nome ?? null;

  if (!ceaf) {
    return (
      <Pagina municipioId={municipioId} atual="alto-custo">
        <Migalha
          itens={[
            { texto: "Início", href: municipioId ? `/${municipioId}` : "/" },
            { texto: "Alto custo" },
          ]}
        />
        <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
          Medicamento de alto custo
        </h1>
        <p className="mt-4 max-w-[65ch] leading-normal">
          Quem entrega os medicamentos de alto custo é o governo do estado, num
          programa chamado CEAF. Ainda não temos a lista de {nomeUf} cadastrada
          aqui — procure a Secretaria de Saúde do seu estado.
        </p>
      </Pagina>
    );
  }

  /*
    Onde entregar o pedido. Com cidade escolhida, só os pontos dela: mostrar o
    de outro município seria mandar a pessoa para uma viagem que não resolve.
  */
  const cidadesDoPonto = resolvido?.temRemume ? [municipioId!] : [];
  const ondeProtocolar = cidadesDoPonto.flatMap((id) => {
    const municipio = carregaMunicipio(id);
    return carregaUnidades(id)
      .filter((u) => u.tipo === "farmacia_ceaf")
      .map((u) => ({ id, municipio, unidade: u }));
  });

  return (
    <Pagina municipioId={municipioId} atual="alto-custo">
      <Migalha
        itens={[
          { texto: "Início", href: municipioId ? `/${municipioId}` : "/" },
          { texto: "Orientações" },
          { texto: "Alto custo" },
        ]}
      />

      <section className="flex flex-wrap items-center gap-7 rounded-2xl border border-[#d3e2f7] bg-gradient-to-br from-[#e4eefc] to-[#cfe1f8] px-7 py-8 md:px-9">
        <div className="min-w-0 flex-1 basis-[420px]">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-marca-fraca">
            CEAF · Componente especializado · {nomeUf}
          </p>
          <h1 className="mt-3 max-w-[24ch] text-[32px] font-bold leading-[1.1] tracking-tight text-marca md:text-[40px]">
            Medicamento de alto custo é pelo Estado, não pelo posto
          </h1>
          <p className="mt-3.5 max-w-[58ch] text-[17px] leading-normal text-[#33506f]">
            Quem entrega é a farmácia estadual. O pedido é aberto com laudo,
            receita e exames — e cada doença pede um conjunto próprio de papéis,
            que o seu médico preenche.
          </p>
          {/*
            Cada estado tem a própria lista e o próprio fluxo. Sem dizer de
            qual estado é esta página, quem mora fora de SC levaria o papel
            errado para a farmácia errada.
          */}
          <p className="mt-3 max-w-[58ch] border-l-4 border-processo pl-4 text-[15px] leading-normal text-[#33506f]">
            Esta página é de {nomeUf}. Em outro estado, a lista e os papéis
            mudam — procure a Secretaria de Saúde do seu estado.
          </p>
        </div>
        <div className="min-w-0 flex-1 basis-[280px] rounded-[var(--radius-cartao)] bg-marca p-6">
          <p className="text-[19px] font-bold text-white">Leve no papel</p>
          <p className="mt-2.5 leading-normal text-[#c2d6f2]">
            Cada doença tem um checklist imprimível, com laudo, exames e
            documentos.
          </p>
          <a
            href="#doencas"
            className="mt-4 inline-flex min-h-[48px] items-center gap-2.5 rounded-[var(--radius-botao)] bg-white px-5 font-semibold text-marca no-underline hover:bg-marca-suave"
          >
            Escolher a doença
          </a>
        </div>
      </section>

      <Cartao className="mt-4 px-7 py-6">
        <h2 className="text-[22px] font-bold text-marca">Como funciona</h2>
        <p className="mt-2 max-w-[65ch] leading-normal">
          Alguns medicamentos não são entregues pela prefeitura. Quem entrega é
          o governo do estado, num programa chamado CEAF. Para receber, é
          preciso abrir um pedido com papéis que o seu médico preenche.
        </p>
        <p className="mt-3 max-w-[65ch] leading-normal">
          Os papéis mudam de doença para doença. Procure a sua na lista abaixo
          para ver quais são os seus, e leve esta página impressa na consulta.
        </p>

        {ondeProtocolar.length === 0 && nomeCidade && (
          <p className="mt-6 max-w-[65ch] leading-normal text-texto-suave">
            Ainda não sabemos onde se entrega o pedido em {nomeCidade}. Pergunte
            na UBS mais próxima ou ligue para a Secretaria de Saúde do município.
          </p>
        )}

        {ondeProtocolar.length > 0 && (
          <>
            <h3 className="mt-6 text-[18.5px] font-bold text-marca">
              Onde entregar o pedido
            </h3>
            {ondeProtocolar.map(({ id, municipio, unidade }) => (
              <p key={unidade.id} className="mt-2 max-w-[65ch] leading-normal">
                Em {municipio.nome}:{" "}
                <a href={`/${id}/unidade/${unidade.id}`}>{unidade.nome}</a>,{" "}
                {unidade.endereco.logradouro}
                {unidade.endereco.bairro ? `, ${unidade.endereco.bairro}` : ""}.
              </p>
            ))}
          </>
        )}
      </Cartao>

      {municipioId && (
        <Cartao as="section" className="mt-6 px-6 py-5">
          <h2 className="text-[21px] font-bold text-marca">
            Procurar pelo nome do medicamento
          </h2>
          <p className="mt-1.5 max-w-[65ch] leading-normal text-texto-suave">
            Se você tem a receita na mão, é mais rápido: cada medicamento mostra
            para quais doenças ele é fornecido e os papéis de cada uma.
          </p>
          <p className="mt-3">
            <a href={`/${municipioId}/alto-custo/medicamentos`}>
              Ver os medicamentos de alto custo em ordem alfabética
            </a>
          </p>
        </Cartao>
      )}

      <section id="doencas" className="mt-8 scroll-mt-6">
        <h2 className="text-[27px] font-bold tracking-tight text-marca">
          As {ceaf.condicoes.length} doenças atendidas em {nomeUf}
        </h2>
        <p className="mt-1.5 text-texto-suave">
          Escolha a sua para ver os papéis e os exames que o pedido exige.
        </p>
        <Cartao className="mt-4 px-6 py-2">
          <div className="columns-1 gap-9 md:columns-2">
            {ceaf.condicoes.map((c) => (
              <a
                key={c.slug}
                href={`/alto-custo/${c.slug}`}
                className="flex min-h-[48px] break-inside-avoid items-center border-b border-divisoria py-2.5 text-texto no-underline hover:text-marca-link"
              >
                {c.nome}
              </a>
            ))}
          </div>
        </Cartao>
      </section>

      <NotaFonte proveniencia={ceaf.proveniencia} telefone={null} />
    </Pagina>
  );
}
