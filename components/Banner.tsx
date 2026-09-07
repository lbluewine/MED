import { carregaCeaf } from "@/lib/dados";
import type { SecaoAtual } from "./MenuLateral";

/**
 * Cabeçalho fixo do site: marca, caminhos principais, busca e cidade.
 *
 * O símbolo é uma cruz própria, não a logomarca do SUS. A logomarca aparece no
 * banner da home, com autorização do mantenedor registrada em docs/STACK.md —
 * mas como marca do site ela diria que este site é do governo, e ele não é.
 * O aviso de projeto independente está no rodapé de toda página.
 */
const CAMINHOS: { texto: string; secoes: SecaoAtual[] }[] = [
  { texto: "Início", secoes: ["inicio"] },
  { texto: "Medicamentos", secoes: ["remedios", "classes"] },
  { texto: "Unidades de saúde", secoes: ["onde-pegar"] },
  { texto: "Orientações", secoes: ["alto-custo", "farmacia-popular"] },
  { texto: "Sobre o site", secoes: ["sobre"] },
];

export default function Banner({
  municipioId,
  municipioNome,
  municipioUf,
  temRemume = true,
  atual,
}: {
  municipioId?: string;
  municipioNome?: string;
  municipioUf?: string;
  /** Cidade sem REMUME própria ainda não tem lista nem unidade cadastrada. */
  temRemume?: boolean;
  atual: SecaoAtual;
}) {
  /*
    "Orientações" reúne alto custo e Farmácia Popular. O alto custo é do
    estado: quando não temos a lista do estado desta pessoa, o caminho leva ao
    programa federal, que vale em qualquer cidade — em vez de levar ao CEAF de
    outro estado. O menu continua com os mesmos cinco itens em toda página.
  */
  const temCeaf = municipioUf ? carregaCeaf(municipioUf.toLowerCase()) !== null : false;

  const href: Record<string, string> = {
    // A cidade escolhida manda: "Início" volta para a home dela, não para a
    // raiz. Quem trocou de cidade e clicava aqui caía em Criciúma de novo.
    Início: municipioId ? `/${municipioId}` : "/",
    // A lista A–Z existe nos dois casos: a da prefeitura, ou o piso nacional
    // da RENAME para quem ainda não tem a própria cadastrada aqui.
    Medicamentos: municipioId ? `/${municipioId}/remedios` : "/",
    "Unidades de saúde":
      municipioId && temRemume ? `/${municipioId}/onde-pegar` : municipioId ? `/${municipioId}` : "/",
    Orientações: municipioId
      ? `/${municipioId}/${temCeaf ? "alto-custo" : "farmacia-popular"}`
      : temCeaf
        ? "/alto-custo"
        : "/farmacia-popular",
    "Sobre o site": municipioId ? `/${municipioId}/sobre` : "/sobre",
  };

  return (
    <header className="sticky top-0 z-40 border-b border-linha bg-fundo">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-7 gap-y-3 px-4 py-3 md:px-7">
        <a href="/" className="flex flex-none items-center gap-3 no-underline">
          <span
            aria-hidden="true"
            className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] bg-marca-link"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5V3Z" fill="#ffffff" />
            </svg>
          </span>
          <span>
            <span className="block text-[22px] font-bold leading-tight tracking-tight text-marca">
              Tem no SUS
            </span>
            <span className="block text-[12.5px] text-texto-suave">
              Saúde pública mais perto de você
            </span>
          </span>
        </a>

        <nav
          aria-label="Principal"
          className="nao-imprime hidden flex-1 flex-wrap items-center gap-x-7 gap-y-1 text-[15px] lg:flex"
        >
          {CAMINHOS.map(({ texto, secoes }) => {
            const aqui = secoes.includes(atual);
            return (
              <a
                key={texto}
                href={href[texto]!}
                aria-current={aqui ? "page" : undefined}
                className={`border-b-2 py-1.5 no-underline ${
                  aqui
                    ? "border-marca-link font-bold text-marca-link"
                    : "border-transparent text-texto"
                }`}
              >
                {texto}
              </a>
            );
          })}
        </nav>

        {municipioId && (
          <form
            action={`/${municipioId}/busca`}
            method="get"
            role="search"
            className="nao-imprime ml-auto hidden h-11 max-w-[250px] flex-1 basis-[180px] items-center gap-2.5 rounded-full border border-linha bg-marca-veu px-4 focus-within:border-marca-link focus-within:ring-2 focus-within:ring-marca-link/40 md:flex"
          >
            <label htmlFor="busca-topo" className="sr-only">
              Buscar medicamento
            </label>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-none">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" className="text-texto-suave" />
              <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-texto-suave" />
            </svg>
            <input
              id="busca-topo"
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Buscar medicamento"
              className="campo-busca-entrada min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </form>
        )}

        {/*
          A cidade não é só um rótulo: é o que decide toda resposta do site, e
          quem abriu no celular de outra pessoa precisa poder trocar. Por isso
          é um link, e o "Trocar" aparece escrito — ícone sozinho não se lê.

          Leva para uma página em vez de abrir uma lista aqui: são 5.570
          cidades, e mandar todas para o navegador em toda página do site
          pesaria centenas de KB em cima de quem tem internet ruim.
        */}
        {municipioNome && (
          <a
            href="/cidades"
            aria-label={`Cidade: ${municipioNome}${municipioUf ? ` – ${municipioUf}` : ""}. Trocar de cidade`}
            className="flex min-h-[44px] flex-none items-center gap-2 rounded-full border border-linha px-3.5 font-semibold text-marca no-underline hover:border-marca-link hover:bg-marca-veu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-none">
              <path
                d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="10" r="2.4" fill="currentColor" />
            </svg>
            <span>
              {municipioNome}
              {municipioUf ? ` – ${municipioUf}` : ""}
            </span>
            <span
              aria-hidden="true"
              className="nao-imprime text-[13px] font-normal text-marca-link underline"
            >
              Trocar
            </span>
          </a>
        )}
      </div>
    </header>
  );
}
