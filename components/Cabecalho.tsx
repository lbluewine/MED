/**
 * Cabeçalho do site: nome e os três caminhos principais.
 *
 * Links de verdade, não botão de JavaScript — funciona sem script e cada um
 * é uma URL que dá para copiar e mandar por WhatsApp para alguém.
 */
export default function Cabecalho({ municipioId }: { municipioId?: string }) {
  return (
    <header className="border-b border-linha">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-12 md:py-4">
        <a href="/" className="text-xl font-bold tracking-tight no-underline md:text-[22px]">
          Tem no SUS
        </a>
        <nav aria-label="Principal" className="flex flex-wrap gap-2 md:gap-3">
          {municipioId && (
            <a
              href={`/${municipioId}/onde-pegar`}
              className="inline-flex min-h-[44px] items-center rounded-[var(--radius-botao)] border-2 border-marca-link px-3 text-base font-bold text-marca-link no-underline hover:bg-marca-fundo md:min-h-[48px] md:px-4 md:text-lg"
            >
              Onde pegar
            </a>
          )}
          <a
            href="/alto-custo"
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-botao)] border-2 border-marca-link px-3 text-base font-bold text-marca-link no-underline hover:bg-marca-fundo md:min-h-[48px] md:px-4 md:text-lg"
          >
            Alto custo
          </a>
          <a
            href={municipioId ? `/${municipioId}/remedios` : "/"}
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-botao)] border-2 border-marca-link px-3 text-base font-bold text-marca-link no-underline hover:bg-marca-fundo md:min-h-[48px] md:px-4 md:text-lg"
          >
            Buscar medicamento
          </a>
        </nav>
      </div>
    </header>
  );
}
