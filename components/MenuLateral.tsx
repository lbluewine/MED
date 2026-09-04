/**
 * Navegação em árvore, com os submenus sempre abertos.
 *
 * Sem JavaScript e sem nada que dobre ou desdobre: quem chega vê de uma vez
 * tudo que o site tem. Cada item é um link de verdade, com URL que dá para
 * copiar e mandar por WhatsApp.
 *
 * Aparece só a partir de 1024px. No celular quem navega é o Cabecalho, com
 * botões grandes — uma árvore de vinte linhas numa tela de 360px empurraria o
 * conteúdo para baixo da dobra.
 */
import { carregaCeaf, carregaMunicipio, carregaUnidades } from "@/lib/dados";
import { listaClasses } from "@/lib/classes";
import { listaRemedios } from "@/lib/remedios";
import { NOME_UNIDADE_CURTO } from "@/lib/rotulos";
import type { TipoUnidade } from "@/lib/schema";

/** Qual página está aberta agora. Só para marcar, nunca para esconder item. */
export type SecaoAtual =
  | "inicio"
  | "remedios"
  | "classes"
  | "onde-pegar"
  | "alto-custo"
  | "sobre";

/** A ordem é a da chance de precisar, igual à da página "Onde pegar". */
const ORDEM_UNIDADES: TipoUnidade[] = [
  "farmacia_distrital",
  "dispensario_ubs",
  "farmacia_estrategica",
  "farmacia_ceaf",
  "farmacia_caps",
  "farmacia_alimentar",
  "programa_insumos",
  "farmacia_popular",
];

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <li className="mt-6 first:mt-0">
      <h3 className="text-[17px] font-bold uppercase tracking-wide text-marca">
        {titulo}
      </h3>
      <ul className="mt-1 border-l-2 border-linha">{children}</ul>
    </li>
  );
}

function Item({
  href,
  children,
  contagem,
  atual = false,
}: {
  href: string;
  children: React.ReactNode;
  contagem?: number;
  atual?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        aria-current={atual ? "page" : undefined}
        className={
          "-ml-[2px] flex min-h-[40px] items-center justify-between gap-2 border-l-2 py-1 pl-3 pr-2 no-underline hover:bg-marca-fundo " +
          (atual
            ? "border-marca-link bg-marca-fundo font-bold text-marca-link"
            : "border-transparent text-texto")
        }
      >
        <span>{children}</span>
        {contagem !== undefined && (
          <span className="text-sm text-texto-suave">{contagem}</span>
        )}
      </a>
    </li>
  );
}

export default function MenuLateral({
  municipioId,
  atual,
}: {
  municipioId?: string;
  atual: SecaoAtual;
}) {
  const municipio = municipioId ? carregaMunicipio(municipioId) : null;
  const remedios = municipioId ? listaRemedios(municipioId) : [];
  const classes = municipioId ? listaClasses(municipioId) : [];
  const unidades = municipioId ? carregaUnidades(municipioId) : [];
  const ceaf = municipio ? carregaCeaf(municipio.uf.toLowerCase()) : null;

  const porTipo = ORDEM_UNIDADES.map((tipo) => ({
    tipo,
    quantas: unidades.filter((u) => u.tipo === tipo).length,
  })).filter((t) => t.quantas > 0);

  return (
    <nav aria-label="Seções do site" className="text-[17px]">
      <ul>
        <Grupo titulo="Começar">
          <Item href="/" atual={atual === "inicio"}>
            Buscar um medicamento
          </Item>
          <Item href="/sobre" atual={atual === "sobre"}>
            Sobre este site
          </Item>
        </Grupo>

        {municipioId && (
          <Grupo titulo="Medicamentos">
            <Item
              href={`/${municipioId}/remedios`}
              contagem={remedios.length}
              atual={atual === "remedios"}
            >
              Todos, de A a Z
            </Item>
            <Item
              href={`/${municipioId}/remedios/tipos`}
              contagem={classes.length}
              atual={atual === "classes"}
            >
              Por tipo de medicamento
            </Item>
          </Grupo>
        )}

        {municipioId && porTipo.length > 0 && (
          <Grupo titulo="Unidades de saúde">
            <Item
              href={`/${municipioId}/onde-pegar`}
              contagem={unidades.length}
              atual={atual === "onde-pegar"}
            >
              Todos os lugares
            </Item>
            {porTipo.map(({ tipo, quantas }) => (
              <Item
                key={tipo}
                href={`/${municipioId}/onde-pegar#${tipo}`}
                contagem={quantas}
              >
                {NOME_UNIDADE_CURTO[tipo]}
              </Item>
            ))}
          </Grupo>
        )}

        <Grupo titulo="Alto custo (CEAF)">
          <Item href="/alto-custo" atual={atual === "alto-custo"}>
            Como funciona o pedido
          </Item>
          {ceaf && (
            <Item href="/alto-custo#doencas" contagem={ceaf.condicoes.length}>
              Doenças da lista
            </Item>
          )}
        </Grupo>
      </ul>
    </nav>
  );
}
