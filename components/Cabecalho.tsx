/**
 * Os caminhos principais, em botões grandes.
 *
 * Links de verdade, não botão de JavaScript — funciona sem script e cada um
 * é uma URL que dá para copiar e mandar por WhatsApp para alguém.
 */
import { carregaCeaf } from "@/lib/dados";

export default function Cabecalho({
  municipioId,
  cidadeGenerica,
  uf,
}: {
  municipioId?: string;
  /** O slug da cidade quando ela não tem lista própria publicada. */
  cidadeGenerica?: string;
  /** O estado da cidade aberta. Ver o mesmo critério em `MenuLateral`. */
  uf?: string;
}) {
  const temCeaf = uf ? carregaCeaf(uf.toLowerCase()) !== null : false;
  // A lista A–Z existe nos dois casos: da prefeitura, ou o piso nacional.
  const cidade = municipioId ?? cidadeGenerica;

  return (
    <header className="border-b border-linha">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-8">
        {/* O nome do site fica no Banner, logo acima. Aqui só os caminhos. */}
        <nav aria-label="Principal" className="flex flex-wrap gap-2 md:gap-3">
          {municipioId && (
            <a
              href={`/${municipioId}/onde-pegar`}
              className="inline-flex min-h-[44px] items-center rounded-[var(--radius-botao)] border-2 border-marca-link px-3 text-base font-bold text-marca-link no-underline hover:bg-marca-fundo md:min-h-[48px] md:px-4 md:text-lg"
            >
              Onde pegar
            </a>
          )}
          {/* Só onde há a lista do estado. Ver `MenuLateral`. */}
          {temCeaf && (
            <a
              href={cidade ? `/${cidade}/alto-custo` : "/alto-custo"}
              className="inline-flex min-h-[44px] items-center rounded-[var(--radius-botao)] border-2 border-marca-link px-3 text-base font-bold text-marca-link no-underline hover:bg-marca-fundo md:min-h-[48px] md:px-4 md:text-lg"
            >
              Alto custo
            </a>
          )}
          <a
            href={cidade ? `/${cidade}/farmacia-popular` : "/farmacia-popular"}
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-botao)] border-2 border-marca-link px-3 text-base font-bold text-marca-link no-underline hover:bg-marca-fundo md:min-h-[48px] md:px-4 md:text-lg"
          >
            Farmácia Popular
          </a>
          <a
            href={cidade ? `/${cidade}/remedios` : "/"}
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-botao)] border-2 border-marca-link px-3 text-base font-bold text-marca-link no-underline hover:bg-marca-fundo md:min-h-[48px] md:px-4 md:text-lg"
          >
            Buscar medicamento
          </a>
        </nav>
      </div>
    </header>
  );
}
