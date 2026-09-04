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
    tem: "border-tem text-tem",
    "nao-tem": "border-nao-tem text-nao-tem",
    processo: "border-processo text-processo",
  }[tom];

  const icone = { tem: "✓", "nao-tem": "✕", processo: "!" }[tom];

  return (
    <div className={`border-l-8 pl-4 ${cor}`}>
      <p className="text-[30px] font-bold leading-tight">
        <span aria-hidden="true">{icone} </span>
        {titulo}
      </p>
      <p className="mt-2 max-w-[65ch] text-texto">{detalhe}</p>
    </div>
  );
}
