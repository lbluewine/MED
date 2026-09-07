/**
 * O cartão branco do layout: tudo que é bloco de conteúdo mora dentro de um.
 *
 * Borda de 1px, canto de 14px, fundo branco sobre o véu azul da página. Não
 * esconde nada — é separação visual, não gaveta. Ver docs/LAYOUT.md.
 */
export default function Cartao({
  children,
  className = "",
  as: Tag = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
  /** Âncora, para o menu lateral apontar direto para esta seção. */
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={`rounded-[var(--radius-cartao)] border border-borda-cartao bg-fundo ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Rótulo pequeno em caixa alta, acima de um valor. */
export function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-texto-suave">
      {children}
    </p>
  );
}

/** Contagem em pílula, do jeito do mockup. */
export function Pilula({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-marca-suave px-2.5 py-0.5 font-mono text-sm text-marca-link">
      {children}
    </span>
  );
}
