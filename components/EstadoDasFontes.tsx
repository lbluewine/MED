import Migalha from "@/components/Migalha";
import Pagina from "@/components/Pagina";
import { carregaCatalogoPrefeituras, carregaEstadoDasFontes } from "@/lib/dados";
import { dadoDesatualizado, dataPorExtenso, DIAS_ATE_DADO_VELHO } from "@/lib/prazos";
import {
  PRECISA_DE_CONTA,
  relatoDeLinkQuebrado,
  relatoDeRemume,
} from "@/lib/relato";
import type {
  FonteConferida,
  PrefeituraNoCatalogo,
  RemumeNoSite,
  SituacaoDaFonte,
} from "@/lib/schema";

/**
 * O estado da manutenção do site, em público.
 *
 * Nenhum site de prefeitura mostra isto, e é justamente o que dá confiança:
 * dizer quando cada documento foi conferido pela última vez, e admitir na cara
 * quando um link morreu. Um site que esconde a própria manutenção pede que se
 * acredite nele; este mostra o serviço e deixa quem lê decidir.
 *
 * A página é estática, gerada no build a partir de `data/fontes/estado.json`,
 * que o job semanal escreve. Sem login, sem servidor e sem painel de controle:
 * não há nada para administrar aqui, só o que já aconteceu para ler. Ver
 * `CLAUDE.md`, seção 6.
 */

const SITUACOES: Record<
  SituacaoDaFonte,
  { rotulo: string; explica: string; classe: string }
> = {
  igual: {
    rotulo: "Confere",
    explica: "O documento no ar é o mesmo que o site publica.",
    classe: "border-marca-linha",
  },
  mudou: {
    rotulo: "Mudou",
    explica:
      "O documento de origem mudou e a atualização está em revisão. " +
      "Até alguém conferir item a item, o site continua mostrando a versão anterior.",
    classe: "border-processo",
  },
  fora_do_ar: {
    rotulo: "Não respondeu",
    explica:
      "A fonte não respondeu na última tentativa. O dado continua no ar, " +
      "mas não foi possível confirmar que ainda é o válido.",
    classe: "border-processo",
  },
  sem_verificacao: {
    rotulo: "Conferência manual",
    explica:
      "Esta fonte não tem endereço fixo na internet. Só uma pessoa consegue " +
      "conferir se mudou.",
    classe: "border-marca-linha",
  },
};

/**
 * O que a cascata de busca da REMUME encontrou em cada município.
 *
 * `no_lugar` não entra na lista: a página mostra o que precisa de gente, não
 * um inventário do que está em ordem. Ver `scripts/acha_remume.py`.
 */
const SITUACOES_REMUME: Record<string, string> = {
  mudou_de_lugar:
    "o endereço do documento respondeu, mas não devolveu a lista — a prefeitura " +
    "provavelmente mudou o caminho do arquivo",
  fora_do_ar: "o endereço do documento não respondeu",
  nao_achado:
    "a página da prefeitura respondeu, mas nenhum link nela parece ser a lista",
  so_no_diario:
    "não achamos a lista no site da prefeitura; há um ato publicando ela no " +
    "diário oficial",
  sem_pista:
    "não achamos a lista no site nem no diário oficial. O caminho agora é " +
    "pedir o documento à prefeitura pela Lei de Acesso à Informação",
};

function LinhaRemume({
  prefeitura,
  remume,
}: {
  prefeitura: PrefeituraNoCatalogo;
  remume: RemumeNoSite;
}) {
  const explica = remume.situacao ? SITUACOES_REMUME[remume.situacao] : null;
  if (!explica) return null;

  return (
    <li className="mt-4 border-l-4 border-processo pl-4">
      <h3 className="font-bold text-marca">
        {prefeitura.nome}/{prefeitura.uf}
      </h3>
      <p className="mt-1 text-[15px]">{explica}.</p>
      {remume.url_diario !== null && remume.url_diario !== undefined && (
        <p className="mt-1 text-[14px]">
          <a className="underline" href={remume.url_diario} rel="noreferrer">
            Ver o ato no diário oficial
          </a>
        </p>
      )}
      {prefeitura.url !== null && (
        <p className="mt-1 text-[14px] break-all">
          Site da prefeitura:{" "}
          <a className="underline" href={prefeitura.url} rel="noreferrer">
            {prefeitura.url}
          </a>
        </p>
      )}
      <p className="mt-1 text-[14px]">
        <a
          className="underline"
          href={relatoDeRemume(`${prefeitura.nome}/${prefeitura.uf}`)}
          rel="noreferrer"
        >
          Sabe onde esta lista está publicada? Avise
        </a>
      </p>
    </li>
  );
}

function Linha({ fonte }: { fonte: FonteConferida }) {
  const s = SITUACOES[fonte.situacao];
  const velha =
    fonte.conferida_em !== null && dadoDesatualizado(fonte.conferida_em);

  return (
    <li className={`border-l-4 ${s.classe} mt-5 pl-4`}>
      <h3 className="font-bold text-marca">{fonte.descricao}</h3>
      <p className="mt-1 text-[15px]">
        <strong>{s.rotulo}.</strong> {s.explica}
      </p>
      <dl className="mt-2 text-[14px] leading-relaxed">
        <div>
          <dt className="inline font-bold">Conferida pela última vez: </dt>
          <dd className="inline">
            {fonte.conferida_em === null
              ? fonte.situacao === "sem_verificacao"
                ? "depende de conferência de uma pessoa"
                : "nunca — esta fonte ainda não respondeu"
              : dataPorExtenso(fonte.conferida_em)}
            {velha && ` — passou de ${DIAS_ATE_DADO_VELHO} dias`}
          </dd>
        </div>
        <div>
          <dt className="inline font-bold">Versão publicada: </dt>
          <dd className="inline">
            {fonte.mudou_em === null
              ? "a mesma desde que entrou no site"
              : `mudou em ${dataPorExtenso(fonte.mudou_em)}`}
          </dd>
        </div>
        {fonte.url !== null && (
          <div>
            <dt className="inline font-bold">Documento de origem: </dt>
            <dd className="inline break-all">
              <a className="underline" href={fonte.url} rel="noreferrer">
                {fonte.url}
              </a>
            </dd>
          </div>
        )}
      </dl>
      {(fonte.situacao === "fora_do_ar" || velha) && (
        <p className="mt-2 text-[14px]">
          <a
            className="underline"
            href={relatoDeLinkQuebrado(fonte.descricao, fonte.url)}
            rel="noreferrer"
          >
            Sabe onde este documento está agora? Avise
          </a>
        </p>
      )}
    </li>
  );
}

export default function EstadoDasFontes({ municipioId }: { municipioId?: string }) {
  const estado = carregaEstadoDasFontes();
  const catalogo = carregaCatalogoPrefeituras();
  const pendentes = (catalogo?.prefeituras ?? [])
    .flatMap((prefeitura) =>
      prefeitura.remume && prefeitura.remume.situacao
        ? [{ prefeitura, remume: prefeitura.remume }]
        : [],
    )
    .filter(({ remume }) => remume.situacao !== "no_lugar");

  return (
    <Pagina municipioId={municipioId} atual="fontes">
      <Migalha
        itens={[
          { texto: "Início", href: municipioId ? `/${municipioId}` : "/" },
          { texto: "Sobre", href: municipioId ? `/${municipioId}/sobre` : "/sobre" },
          { texto: "Estado das fontes" },
        ]}
      />
      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Estado das fontes
      </h1>
      <p className="mt-3 max-w-[65ch]">
        Toda informação deste site sai de um documento público. Uma vez por
        semana um robô abre cada um desses documentos e compara com a cópia que
        o site guarda. Esta página mostra o resultado, inclusive quando dá
        errado.
      </p>
      <p className="mt-3 max-w-[65ch]">
        Quando um documento muda, o robô não publica sozinho: ele abre um pedido
        de alteração e uma pessoa confere item a item antes de entrar no ar.
        Enquanto isso, o site continua mostrando a versão anterior — que é a que
        foi conferida.
      </p>

      {estado === null ? (
        <p className="mt-8 max-w-[65ch] border-l-4 border-processo pl-4 font-bold">
          A conferência automática ainda não rodou nenhuma vez. Enquanto isso, a
          data de conferência de cada dado aparece no rodapé da página em que
          ele está.
        </p>
      ) : (
        <>
          <p className="mt-6 text-[15px]">
            Última conferência: <strong>{dataPorExtenso(estado.conferido_em)}</strong>.
          </p>
          <ul className="mt-4">
            {estado.fontes.map((f) => (
              <Linha key={f.id} fonte={f} />
            ))}
          </ul>
        </>
      )}

      {pendentes.length > 0 && (
        <>
          <h2 className="mt-10 text-[26px] font-bold tracking-tight text-marca">
            Listas municipais que estamos procurando
          </h2>
          <p className="mt-3 max-w-[65ch]">
            Cada prefeitura publica a própria lista de medicamentos onde quer, e
            muda o endereço sem avisar. Nestes municípios a lista saiu do lugar
            onde estava, ou nunca foi encontrada:
          </p>
          <ul className="mt-4">
            {pendentes.map(({ prefeitura, remume }) => (
              <LinhaRemume
                key={prefeitura.slug}
                prefeitura={prefeitura}
                remume={remume}
              />
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-10 text-[26px] font-bold tracking-tight text-marca">
        Achou um link quebrado?
      </h2>
      <p className="mt-3 max-w-[65ch]">
        Se uma fonte aqui aparece como “Não respondeu” há semanas, é provável
        que a prefeitura tenha mudado o endereço do documento. Avisar onde ele
        está agora é a forma mais rápida de ajudar este site — cada linha acima
        que estiver quebrada tem o próprio link para avisar.
      </p>
      <p className="mt-3 max-w-[65ch] text-[14px]">{PRECISA_DE_CONTA}</p>
    </Pagina>
  );
}
