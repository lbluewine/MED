import Cartao from "@/components/Cartao";
import Migalha from "@/components/Migalha";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaRename } from "@/lib/dados";
import { COMPONENTE_CURTO } from "@/lib/rotulos";
import type { MedicamentoRename } from "@/lib/rename";

/**
 * A lista A–Z de uma cidade que ainda não tem a lista da prefeitura aqui.
 *
 * É a mesma tela da lista municipal, com o dado que existe: a RENAME, o piso
 * que vale no Brasil inteiro. Cada nome traz as apresentações abertas, e não
 * um link para uma ficha — a ficha depende do que a prefeitura cadastrou
 * (onde retirar, que receita pede), e isso a gente não sabe desta cidade.
 * Prometer um clique que não leva a lugar nenhum seria pior do que não ter.
 */
export default function RemediosRename({
  municipioId,
  municipioNome,
  medicamentos,
}: {
  municipioId: string;
  municipioNome: string;
  medicamentos: MedicamentoRename[];
}) {
  const rename = carregaRename();
  const apresentacoes = medicamentos.reduce((soma, m) => soma + m.itens.length, 0);

  const porLetra = new Map<string, MedicamentoRename[]>();
  for (const m of medicamentos) {
    const letra = m.slug[0]!.toUpperCase();
    porLetra.set(letra, [...(porLetra.get(letra) ?? []), m]);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <Pagina municipioId={municipioId} atual="remedios">
      <Migalha
        itens={[
          { texto: "Início", href: `/${municipioId}` },
          { texto: "Medicamentos A–Z" },
        ]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Medicamentos de A a Z
      </h1>
      <p className="mt-1.5 max-w-[70ch] text-texto-suave">
        Os {medicamentos.length} medicamentos que o SUS garante em qualquer
        cidade do Brasil, em {apresentacoes} apresentações. Ainda não temos a
        lista própria de {municipioNome}, então esta é a lista nacional — a
        prefeitura pode ter mais.
      </p>

      <Cartao className="nao-imprime mb-5 mt-5 flex flex-wrap gap-1.5 px-4 py-3.5">
        {letras.map((l) => (
          <a
            key={l}
            href={`#letra-${l}`}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg font-semibold text-marca-link no-underline hover:bg-marca-link hover:text-white"
          >
            {l}
          </a>
        ))}
      </Cartao>

      <div className="flex flex-col gap-3.5">
        {letras.map((l) => (
          <Cartao
            as="section"
            key={l}
            className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-4 px-6 pb-2 pt-5"
          >
            <h2
              id={`letra-${l}`}
              aria-label={`Letra ${l}`}
              className="scroll-mt-6 text-[34px] font-bold leading-none text-letra-fantasma"
            >
              {l}
            </h2>
            <div>
              {porLetra.get(l)!.map((m) => (
                <a
                  key={m.slug}
                  href={`/${municipioId}/piso-nacional/${m.slug}`}
                  className="block break-inside-avoid border-b border-divisoria py-2.5 no-underline"
                >
                  <p className="font-semibold text-texto hover:text-marca-link">
                    {m.nome}
                  </p>
                  <ul className="mt-1 text-[14.5px] text-texto-suave">
                    {m.itens.map((item, n) => (
                      <li key={n}>
                        {/*
                          `texto` traz o nome na frente; aqui ele já está no
                          título logo acima, e repetir em cada linha só faria
                          a pessoa reler a mesma palavra.
                        */}
                        {item.texto.startsWith(m.nome)
                          ? item.texto.slice(m.nome.length).trim()
                          : item.texto}
                        {" · "}
                        {COMPONENTE_CURTO[item.componente]}
                      </li>
                    ))}
                  </ul>
                </a>
              ))}
            </div>
          </Cartao>
        ))}
      </div>

      {rename && <NotaFonte proveniencia={rename.proveniencia} telefone={null} />}
    </Pagina>
  );
}
