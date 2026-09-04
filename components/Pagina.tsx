/**
 * Casca comum de toda página: faixa de identificação, navegação e conteúdo.
 *
 * Duas navegações para o mesmo conjunto de links, cada uma no tamanho de tela
 * em que funciona. Até 1024px, os botões grandes do Cabecalho. Daí para cima,
 * a árvore da lateral, que fica fixa enquanto a página rola.
 *
 * Nenhuma das duas depende de JavaScript.
 */
import Banner from "./Banner";
import Cabecalho from "./Cabecalho";
import MenuLateral, { type SecaoAtual } from "./MenuLateral";
import { carregaMunicipio } from "@/lib/dados";

export default function Pagina({
  municipioId,
  atual,
  /** "texto" para leitura corrida, "larga" para lista com mapa ou duas colunas. */
  largura = "texto",
  children,
}: {
  municipioId?: string;
  atual: SecaoAtual;
  largura?: "texto" | "larga";
  children: React.ReactNode;
}) {
  const municipio = municipioId ? carregaMunicipio(municipioId) : null;

  return (
    <div>
      <Banner municipioNome={municipio?.nome} />

      <div className="nao-imprime lg:hidden">
        <Cabecalho municipioId={municipioId} />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:grid lg:grid-cols-[248px_1fr] lg:gap-10">
        <div className="nao-imprime hidden border-r border-linha py-10 pr-6 lg:block">
          <div className="sticky top-8">
            <MenuLateral municipioId={municipioId} atual={atual} />
          </div>
        </div>

        <div className="py-10 md:py-14 lg:min-w-0 lg:pl-2">
          <div className={largura === "texto" ? "max-w-2xl" : ""}>{children}</div>
        </div>
      </div>
    </div>
  );
}
