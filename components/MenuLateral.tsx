/**
 * Menu da coluna esquerda: dois cartões, tudo aberto, nada dobrado.
 *
 * "Acesso rápido" leva aos quatro caminhos principais, cada um com sigla
 * colorida e a contagem real. "Unidades de saúde" lista os tipos com quantas
 * existem na cidade, e cada linha vai direto para aquela seção.
 *
 * Aparece a partir de 1024px. No celular quem navega é o Cabecalho, com
 * botões grandes — esta árvore numa tela de 360px empurraria o conteúdo para
 * baixo da dobra. Ver docs/LAYOUT.md.
 */
import Cartao from "./Cartao";
import { carregaCeaf, carregaMunicipio, carregaUnidades } from "@/lib/dados";
import { listaClasses } from "@/lib/classes";
import { totalFarmaciaPopular } from "@/lib/farmacia-popular";
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
  | "farmacia-popular"
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

function Seta() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Atalho({
  href,
  sigla,
  cor,
  nome,
  contagem,
  atual,
}: {
  href: string;
  sigla: string;
  cor: string;
  nome: string;
  contagem?: number;
  atual?: boolean;
}) {
  return (
    <a
      href={href}
      aria-current={atual ? "page" : undefined}
      className={`grid grid-cols-[30px_minmax(0,1fr)_auto_auto] items-center gap-2.5 border-t border-divisoria px-4 py-2.5 text-[14.5px] no-underline hover:bg-marca-veu ${
        atual ? "bg-marca-veu" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[10.5px] font-bold text-white"
        style={{ background: cor }}
      >
        {sigla}
      </span>
      <span className={`font-semibold text-marca-link ${atual ? "underline" : ""}`}>
        {nome}
      </span>
      <span className="font-mono text-[13px] text-texto-suave">
        {contagem ?? ""}
      </span>
      <span className="text-seta">
        <Seta />
      </span>
    </a>
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
  // O que o programa fornece, não quantas farmácias o entregam: é o mesmo
  // número que a página do programa anuncia no título.
  const itensPopular = totalFarmaciaPopular();

  const porTipo = ORDEM_UNIDADES.map((tipo) => ({
    tipo,
    quantas: unidades.filter((u) => u.tipo === tipo).length,
  })).filter((t) => t.quantas > 0);

  return (
    <div className="flex flex-col gap-5">
      <Cartao className="overflow-hidden">
        <h2 className="px-4 pb-3 pt-4 text-[16px] font-bold text-marca">
          Acesso rápido
        </h2>
        {municipioId && (
          <>
            <Atalho
              href={`/${municipioId}/remedios`}
              sigla="A-Z"
              cor="#1351b4"
              nome="Todos os medicamentos"
              contagem={remedios.length}
              atual={atual === "remedios"}
            />
            <Atalho
              href={`/${municipioId}/remedios/tipos`}
              sigla="TIP"
              cor="#1a8b5f"
              nome="Por tipo de medicamento"
              contagem={classes.length}
              atual={atual === "classes"}
            />
          </>
        )}
        <Atalho
          href="/alto-custo"
          sigla="ALT"
          cor="#f0a92b"
          nome="Medicamentos de alto custo"
          contagem={ceaf?.condicoes.length}
          atual={atual === "alto-custo"}
        />
        {itensPopular > 0 && (
          <Atalho
            href="/farmacia-popular"
            sigla="FPO"
            cor="#7c4dcc"
            nome="Farmácia Popular"
            contagem={itensPopular}
            atual={atual === "farmacia-popular"}
          />
        )}
      </Cartao>

      {municipioId && porTipo.length > 0 && (
        <Cartao className="overflow-hidden">
          <h2 className="flex items-center gap-2 px-4 pb-3 pt-4 text-[16px] font-bold text-marca">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 21V5.5L12 3l7 2.5V21H5Z" fill="currentColor" />
              <path
                d="M9 9h2M13 9h2M9 13h2M13 13h2"
                stroke="#ffffff"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            Unidades de saúde
          </h2>
          <a
            href={`/${municipioId}/onde-pegar`}
            aria-current={atual === "onde-pegar" ? "page" : undefined}
            className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 border-t border-divisoria px-4 py-2.5 text-[14.5px] no-underline hover:bg-marca-veu ${
              atual === "onde-pegar" ? "bg-marca-veu" : ""
            }`}
          >
            <span className="font-semibold text-marca-link">Todos os lugares</span>
            <span className="font-mono text-[13px] text-texto-suave">{unidades.length}</span>
            <span className="text-seta">
              <Seta />
            </span>
          </a>
          {porTipo.map(({ tipo, quantas }) => (
            <a
              key={tipo}
              href={`/${municipioId}/onde-pegar#${tipo}`}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 border-t border-divisoria px-4 py-2.5 text-[14.5px] text-texto no-underline hover:bg-marca-veu"
            >
              <span>{NOME_UNIDADE_CURTO[tipo]}</span>
              <span className="font-mono text-[13px] text-texto-suave">{quantas}</span>
              <span className="text-seta">
                <Seta />
              </span>
            </a>
          ))}
        </Cartao>
      )}
    </div>
  );
}
