/**
 * Caminho de volta no topo de cada página interna: Início / Seção / Aqui.
 *
 * Links de verdade. O último item é o lugar atual e não é link.
 */
export default function Migalha({
  itens,
}: {
  /** Do mais geral ao mais específico. O último não vira link. */
  itens: { texto: string; href?: string }[];
}) {
  return (
    <nav aria-label="Você está aqui" className="mb-5 text-sm text-texto-suave">
      {itens.map((i, n) => (
        <span key={i.texto}>
          {n > 0 && <span className="mx-2 text-[#a9bdd4]">/</span>}
          {i.href ? (
            <a href={i.href}>{i.texto}</a>
          ) : (
            <span aria-current="page">{i.texto}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
