/**
 * A resposta principal, acima da dobra, antes de qualquer detalhe.
 *
 * Verde, vermelho e âmbar nunca aparecem sozinhos: sempre com texto e ícone.
 * Daltonismo é comum na faixa etária. Ver docs/STACK.md.
 */
export default function Resposta({
  tom,
  titulo,
  detalhe,
}: {
  tom: "tem" | "nao-tem" | "processo";
  titulo: string;
  detalhe: string;
}) {
  const cor = {
    tem: { borda: "border-tem", texto: "text-tem", disco: "bg-tem" },
    "nao-tem": { borda: "border-nao-tem", texto: "text-nao-tem", disco: "bg-nao-tem" },
    processo: { borda: "border-processo", texto: "text-processo", disco: "bg-processo" },
  }[tom];

  const icone = { tem: "✓", "nao-tem": "✕", processo: "!" }[tom];

  return (
    <div
      className={`flex items-start gap-4 rounded-[var(--radius-cartao)] border-2 ${cor.borda} bg-superficie px-5 py-5 md:px-6`}
    >
      <span
        aria-hidden="true"
        className={`mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-full ${cor.disco} text-[20px] font-bold text-fundo`}
      >
        {icone}
      </span>
      <div>
        <p className={`text-[26px] font-bold leading-tight md:text-[30px] ${cor.texto}`}>
          {titulo}
        </p>
        <p className="mt-2 max-w-[65ch] text-texto">{detalhe}</p>
      </div>
    </div>
  );
}
