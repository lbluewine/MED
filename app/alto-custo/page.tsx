import Pagina from "@/components/Pagina";
import NotaFonte from "@/components/NotaFonte";
import { carregaCeaf, carregaMunicipio, carregaUnidades, listaMunicipios } from "@/lib/dados";

export const metadata = { title: "Medicamento de alto custo — Tem no SUS?" };

export default function AltoCusto() {
  const [municipioNav] = listaMunicipios();
  const ceaf = carregaCeaf("sc");
  if (!ceaf) {
    return (
      <Pagina municipioId={municipioNav} atual="alto-custo">
          <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">
            Medicamento de alto custo
          </h1>
          <p className="mt-4 max-w-[65ch]">
            Ainda não publicamos esta parte.
          </p>
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
    <Pagina municipioId={municipioNav} atual="alto-custo" largura="larga">
      <div className="max-w-2xl">
      <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">
        Medicamento de alto custo
      </h1>
      <p className="mt-4 max-w-[65ch]">
        Alguns medicamentos não são entregues pela prefeitura. Quem entrega é o
        governo do estado, num programa chamado CEAF. Para receber, é preciso
        abrir um pedido com papéis que o seu médico preenche.
      </p>
      <p className="mt-4 max-w-[65ch]">
        Os papéis mudam de doença para doença. Procure a sua na lista abaixo
        para ver quais são os seus, e leve esta página impressa na consulta.
      </p>

      {ondeProtocolar.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[26px] font-bold tracking-tight text-marca">Onde entregar o pedido</h2>
          {ondeProtocolar.map(({ id, municipio, unidade }) => (
            <p key={unidade.id} className="mt-3 max-w-[65ch]">
              Em {municipio.nome}:{" "}
              <a className="underline" href={`/${id}/unidade/${unidade.id}`}>
                {unidade.nome}
              </a>
              , {unidade.endereco.logradouro}
              {unidade.endereco.bairro ? `, ${unidade.endereco.bairro}` : ""}.
            </p>
          ))}
        </section>
      )}

      </div>

      <section id="doencas" className="mt-8 scroll-mt-8">
        <h2 className="text-[26px] font-bold tracking-tight text-marca">Qual é a sua doença?</h2>
        <p className="mt-2 max-w-[65ch]">
          São {ceaf.condicoes.length} doenças atendidas em Santa Catarina.
        </p>
        <ul className="mt-4 gap-x-10 md:columns-2">
          {ceaf.condicoes.map((c) => (
            <li key={c.slug} className="break-inside-avoid border-b border-linha">
              <a
                href={`/alto-custo/${c.slug}`}
                className="block min-h-[48px] py-3 text-[20px] underline"
              >
                {c.nome}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <NotaFonte proveniencia={ceaf.proveniencia} telefone={null} />
    </Pagina>
  );
}
