import type { AnchorHTMLAttributes } from "react";

/**
 * O estilo de botão do site: contorno de 2px, sem sombra, cantos quase retos.
 * Sempre um link de verdade, para funcionar sem JavaScript.
 */
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variante?: "primario" | "secundario" | "escuro";
  className?: string;
};

const BASE =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[2px] " +
  "border-2 px-4 text-[19px] font-bold no-underline";

const VARIANTES: Record<NonNullable<Props["variante"]>, string> = {
  primario: "border-tem bg-tem text-fundo hover:bg-[#095A40]",
  secundario: "border-texto bg-fundo text-texto hover:bg-[#F2F2F2]",
  escuro: "border-texto bg-texto text-fundo hover:bg-[#333333]",
};

export default function Botao({ variante = "secundario", className = "", ...props }: Props) {
  return <a className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props} />;
}
