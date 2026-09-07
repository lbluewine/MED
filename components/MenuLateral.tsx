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
import { listaRemedios, remediosDoTipoDeUnidade } from "@/lib/remedios";
import { totalMedicamentosRename } from "@/lib/rename";
import { medicamentosAltoCusto } from "@/lib/alto-custo";
import { NOME_UNIDADE_CURTO } from "@/lib/rotulos";
import type { TipoUnidade } from "@/lib/schema";

/** Qual página está aberta agora. Só para marcar, nunca para esconder item. */
export type SecaoAtual =
  | "inicio"
  | "cidades"
  | "remedios"
  | "classes"
  | "onde-pegar"
  | "alto-custo"
  | "farmacia-popular"
  | "sobre";

/**
 * Os grupos do "Acesso rápido", por onde a pessoa retira.
 *
 * Alto custo e Farmácia Popular não entram aqui: um é do estado e o outro é
 * federal, e ambos já têm atalho próprio mais abaixo. Estes são os balcões da
 * própria cidade.
 */
const POR_ONDE_RETIRAR: {
  tipo: TipoUnidade;
  sigla: string;
  cor: string;
  nome: string;
}[] = [
  { tipo: "dispensario_ubs", sigla: "UBS", cor: "#1a8b5f", nome: "Medicamentos das UBS" },
  { tipo: "farmacia_distrital", sigla: "DIS", cor: "#0d6e8c", nome: "Medicamentos da farmácia do distrito" },
  { tipo: "farmacia_estrategica", sigla: "EST", cor: "#b03a6a", nome: "Medicamentos da farmácia estratégica" },
];

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
  cidadeGenerica,
  uf,
  atual,
}: {
  municipioId?: string;
  /** O slug da cidade quando ela não tem lista própria publicada. */
  cidadeGenerica?: string;
  /**
   * O estado da cidade aberta, inclusive quando ela não tem lista própria.
   * O alto custo é do estado, não da prefeitura: sem saber a UF não dá para
   * dizer se existe resposta para essa pessoa.
   */
  uf?: string;
  atual: SecaoAtual;
}) {
  const municipio = municipioId ? carregaMunicipio(municipioId) : null;
  const remedios = municipioId ? listaRemedios(municipioId) : [];
  const classes = municipioId ? listaClasses(municipioId) : [];
  const unidades = municipioId ? carregaUnidades(municipioId) : [];
  const ufAtual = municipio?.uf ?? uf;
  const ceaf = ufAtual ? carregaCeaf(ufAtual.toLowerCase()) : null;
  // O que o programa fornece, não quantas farmácias o entregam: é o mesmo
  // número que a página do programa anuncia no título.
  const itensPopular = totalFarmaciaPopular();
  const itensRename = totalMedicamentosRename();
  const remediosAltoCusto = medicamentosAltoCusto(ufAtual).length;
  // O alto custo e a Farmácia Popular ganham a cidade na URL: o conteúdo é do
  // estado e do país, mas o lugar de retirar é da cidade.
  const cidade = municipioId ?? cidadeGenerica;

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
        {/*
          Os caminhos são por onde se retira, e não por classe: a pergunta de
          quem chega é "onde eu pego?". "Por tipo" continua existindo, no
          cartão de baixo, para quem procura sem saber o nome.
        */}
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
            {POR_ONDE_RETIRAR.map(({ tipo, sigla, cor, nome }) => {
              const quantos = remediosDoTipoDeUnidade(municipioId, tipo).length;
              if (quantos === 0) return null;
              return (
                <Atalho
                  key={tipo}
                  href={`/${municipioId}/remedios/onde/${tipo}`}
                  sigla={sigla}
                  cor={cor}
                  nome={nome}
                  contagem={quantos}
                />
              );
            })}
          </>
        )}
        {/*
          Cidade sem lista da prefeitura tem o A–Z do piso nacional. O atalho
          por tipo não entra: a classificação por grupo é da lista municipal, e
          a RENAME não traz uma equivalente cadastrada aqui.
        */}
        {!municipioId && cidadeGenerica && itensRename > 0 && (
          <Atalho
            href={`/${cidadeGenerica}/remedios`}
            sigla="A-Z"
            cor="#1351b4"
            nome="Todos os medicamentos"
            contagem={itensRename}
            atual={atual === "remedios"}
          />
        )}
        {/*
          Só onde há a lista do estado publicada. Oferecer este caminho a quem
          mora onde a gente não tem o dado levaria a pessoa a uma página do
          CEAF de outro estado — papel errado, endereço errado, viagem perdida.
        */}
        {/*
          Aponta para a lista de medicamentos, e a contagem é de medicamentos:
          quem chega tem o nome na receita, não o nome do protocolo. O caminho
          pela doença continua, dentro da própria página de alto custo.
        */}
        {ceaf && (
          <Atalho
            href={cidade ? `/${cidade}/alto-custo/medicamentos` : "/alto-custo"}
            sigla="ALT"
            cor="#f0a92b"
            nome="Medicamentos de alto custo"
            contagem={cidade ? remediosAltoCusto : ceaf.condicoes.length}
            atual={atual === "alto-custo"}
          />
        )}
        {itensPopular > 0 && (
          <Atalho
            href={cidade ? `/${cidade}/farmacia-popular` : "/farmacia-popular"}
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

      {/*
        "Por tipo" saiu do acesso rápido — lá os caminhos são por onde se
        retira, que é a pergunta de quem chega. Continua aqui para quem procura
        sem saber o nome do medicamento.
      */}
      {municipioId && classes.length > 0 && (
        <Cartao className="overflow-hidden">
          <h2 className="px-4 pb-3 pt-4 text-[16px] font-bold text-marca">
            Outro jeito de procurar
          </h2>
          <Atalho
            href={`/${municipioId}/remedios/tipos`}
            sigla="TIP"
            cor="#6b5bb5"
            nome="Por tipo de medicamento"
            contagem={classes.length}
            atual={atual === "classes"}
          />
        </Cartao>
      )}
    </div>
  );
}
