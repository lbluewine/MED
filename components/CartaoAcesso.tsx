/**
 * Cartão de caminho rápido, na home.
 *
 * O quadrado colorido é enfeite e vive só aqui, longe de qualquer resposta
 * "tem / não tem" — por isso pode usar verde e vermelho sem gastar o
 * significado que essas cores têm no resto do site. Ver docs/STACK.md.
 */
export default function CartaoAcesso({
  href,
  cor,
  icone,
  titulo,
  children,
}: {
  href: string;
  /** Cor do quadrado do ícone. Decorativa. */
  cor: string;
  icone: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex flex-col gap-3 rounded-[14px] border border-superficie-forte bg-fundo px-5 pb-[18px] pt-[22px] no-underline transition-shadow hover:border-marca-link hover:shadow-[0_10px_26px_rgba(12,50,111,0.09)]"
    >
      <span
        aria-hidden="true"
        className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[12px] text-[14px] font-bold tracking-tight text-white"
        style={{ background: cor }}
      >
        {icone}
      </span>
      <span className="text-[17.5px] font-bold leading-tight text-marca-link">
        {titulo}
      </span>
      <span className="text-[15px] leading-normal text-texto-suave">{children}</span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="mt-auto self-end"
      >
        <path
          d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-marca-link"
        />
      </svg>
    </a>
  );
}
