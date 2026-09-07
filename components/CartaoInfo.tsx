/**
 * Cartão de orientação, na parte de baixo da home: ícone à esquerda, texto e
 * um link de saída à direita.
 */
export default function CartaoInfo({
  titulo,
  texto,
  href,
  chamada,
  icone,
  fundo = "#e7f0fd",
}: {
  titulo: string;
  texto: string;
  href: string;
  chamada: string;
  icone: React.ReactNode;
  /** Fundo do quadrado do ícone. Decorativo. */
  fundo?: string;
}) {
  return (
    <article className="grid grid-cols-[82px_minmax(0,1fr)] gap-4 rounded-[var(--radius-cartao)] border border-borda-cartao bg-fundo p-[18px]">
      <div
        aria-hidden="true"
        className="flex items-center justify-center rounded-[10px]"
        style={{ background: fundo }}
      >
        {icone}
      </div>
      <div>
        <h3 className="text-[16.5px] font-bold leading-snug text-marca">{titulo}</h3>
        <p className="mt-1.5 text-[15px] leading-normal text-texto-suave">{texto}</p>
        <a href={href} className="mt-2.5 inline-flex items-center gap-2 font-semibold">
          {chamada}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </a>
      </div>
    </article>
  );
}
