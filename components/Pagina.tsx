/**
 * Casca comum de toda página: cabeçalho, navegação e conteúdo.
 *
 * Duas navegações para os mesmos caminhos, cada uma no tamanho de tela em que
 * funciona. O cabeçalho do topo tem os caminhos principais em qualquer
 * largura; a partir de 1024px entram também os cartões do MenuLateral, na
 * coluna esquerda, com as contagens e os tipos de unidade.
 *
 * Nenhuma das duas depende de JavaScript. Ver docs/LAYOUT.md.
 */
import Banner from "./Banner";
import Cabecalho from "./Cabecalho";
import MenuLateral, { type SecaoAtual } from "./MenuLateral";
import { resolveMunicipio } from "@/lib/dados";

export default function Pagina({
  municipioId,
  atual,
  /** Sem menu lateral, para páginas que querem a largura toda. */
  semMenu = false,
  /**
   * Bloco que ocupa a largura inteira, acima das colunas. É onde vai o banner
   * da home: dividir o espaço com o menu deixaria a busca estreita demais.
   */
  topo,
  children,
}: {
  municipioId?: string;
  atual: SecaoAtual;
  semMenu?: boolean;
  topo?: React.ReactNode;
  children: React.ReactNode;
}) {
  /*
    resolveMunicipio() nunca lê remume.json — cidade sem REMUME própria
    (município genérico, só a RENAME) precisa continuar dando nome e UF pro
    cabeçalho, sem quebrar por falta de arquivo. Ver docs/ROADMAP.md, v2.
  */
  const resolvido = municipioId ? resolveMunicipio(municipioId) : null;
  const municipio = resolvido?.municipio ?? null;
  const temRemume = resolvido?.temRemume ?? false;

  return (
    <div>
      <Banner
        municipioId={municipioId}
        municipioNome={municipio?.nome}
        municipioUf={municipio?.uf}
        temRemume={temRemume}
        atual={atual}
      />

      <div className="nao-imprime lg:hidden">
        <Cabecalho
          municipioId={temRemume ? municipioId : undefined}
          cidadeGenerica={!temRemume ? municipioId : undefined}
          uf={municipio?.uf}
        />
      </div>

      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 md:px-7">
        {topo && <div className="mb-7">{topo}</div>}

        <div
          className={
            semMenu ? "" : "lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-7"
          }
        >
          {/*
            O menu vem antes do conteúdo no HTML, e não só na tela: quem usa
            leitor de tela ouve a navegação primeiro, e quem quer pular tem o
            "Pular para o conteúdo" do layout.
          */}
          {!semMenu && (
            <aside className="nao-imprime hidden lg:block">
              {/*
                O menu tem rolagem própria, limitada à altura da tela.

                Sem isso ele fica preso no topo e o fim dele — a lista de tipos
                de unidade — não se alcança em tela baixa: a roda do mouse em
                cima do menu rolava o conteúdo do meio, e o menu ficava cortado.

                A rolagem não é contida de propósito: quando o menu chega ao
                fim, a página continua descendo normalmente. É o que se espera
                de uma roda de mouse.
              */}
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
                <MenuLateral
                  municipioId={temRemume ? municipioId : undefined}
                  cidadeGenerica={!temRemume ? municipioId : undefined}
                  uf={municipio?.uf}
                  atual={atual}
                />
              </div>
            </aside>
          )}

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
