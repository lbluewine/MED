import type { AnchorHTMLAttributes } from "react";

/**
 * O estilo de botão do site: contorno de 2px, sem sombra, cantos suaves.
 * Sempre um link de verdade, para funcionar sem JavaScript.
 */
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variante?: "primario" | "secundario" | "escuro";
  className?: string;
};

const BASE =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius-botao)] " +
  "border-2 px-4 text-[19px] font-bold no-underline";

const VARIANTES: Record<NonNullable<Props["variante"]>, string> = {
  // Verde aqui significaria "tem no SUS", que não é o que um botão faz. A ação
  // principal usa o azul de marca, e o verde fica só para a resposta.
  primario: "border-marca-link bg-marca-link text-fundo hover:bg-marca",
  secundario: "border-marca-link bg-fundo text-marca-link hover:bg-marca-fundo",
  escuro: "border-texto bg-texto text-fundo hover:bg-[#333333]",
};

export default function Botao({ variante = "secundario", className = "", ...props }: Props) {
  return <a className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props} />;
}
