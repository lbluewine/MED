import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaCeaf, carregaMunicipio, carregaUnidades, listaMunicipios } from "@/lib/dados";

export const metadata = { title: "Medicamento de alto custo — Tem no SUS?" };

export default function AltoCusto() {
  const [municipioNav] = listaMunicipios();
  const ceaf = carregaCeaf("sc");

  if (!ceaf) {
    return (
      <Pagina municipioId={municipioNav} atual="alto-custo">
        <Migalha itens={[{ texto: "Início", href: "/" }, { texto: "Alto custo" }]} />
        <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
          Medicamento de alto custo
        </h1>
        <p className="mt-4 max-w-[65ch]">Ainda não publicamos esta parte.</p>
      </Pagina>
    );
  }

  // Onde se entrega o pedido em cada cidade que o site já cobre.
  const ondeProtocolar = listaMunicipios().flatMap((id) => {
    const municipio = carregaMunicipio(id);
    return carregaUnidades(id)
      .filter((u) => u.tipo === "farmacia_ceaf")
      .map((u) => ({ id, municipio, unidade: u }));
  });

  return (
    <Pagina municipioId={municipioNav} atual="alto-custo">
      <Migalha
        itens={[
          { texto: "Início", href: "/" },
          { texto: "Orientações" },
          { texto: "Alto custo" },
        ]}
      />

      <section className="flex flex-wrap items-center gap-7 rounded-2xl border border-[#d3e2f7] bg-gradient-to-br from-[#e4eefc] to-[#cfe1f8] px-7 py-8 md:px-9">
        <div className="min-w-0 flex-1 basis-[420px]">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-marca-fraca">
            CEAF · Componente especializado
          </p>
          <h1 className="mt-3 max-w-[24ch] text-[32px] font-bold leading-[1.1] tracking-tight text-marca md:text-[40px]">
            Medicamento de alto custo é pelo Estado, não pelo posto
          </h1>
          <p className="mt-3.5 max-w-[58ch] text-[17px] leading-normal text-[#33506f]">
            Quem entrega é a farmácia estadual. O pedido é aberto com laudo,
            receita e exames — e cada doença pede um conjunto próprio de papéis,
            que o seu médico preenche.
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

      <section id="doencas" className="mt-8 scroll-mt-6">
        <h2 className="text-[27px] font-bold tracking-tight text-marca">
          As {ceaf.condicoes.length} doenças atendidas em SC
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
