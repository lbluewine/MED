import type { Unidade } from "@/lib/schema";
import { NOME_UNIDADE_CURTO } from "@/lib/rotulos";
import { distanciaTexto } from "@/lib/geo";
import Botao from "./Botao";

/** "(48) 3445-8730" a partir do que a fonte escreve e do DDD do município. */
export function telefoneCompleto(telefone: string, ddd: string): string {
  return telefone.startsWith("(") ? telefone : `(${ddd}) ${telefone}`;
}

function Horarios({ unidade }: { unidade: Unidade }) {
  if (unidade.horarios.length === 0) return null;
  return (
    <p className="mt-1">
      <span className="font-bold">Horário: </span>
      {unidade.horarios.map((h) => `${h.abre} às ${h.fecha}`).join(" e ")}.{" "}
      {/*
        A fonte dá o horário mas não diz em quais dias. Dizer "seg-sex" seria
        inventar, e mandar alguém num sábado que a porta está fechada. Pela
        mesma razão, o site nunca afirma "aberta agora": sem saber os dias,
        essa etiqueta mentiria em algum dia da semana.
      */}
      {unidade.horarios.every((h) => h.dias === null) && (
        <span className="text-texto-suave">
          A fonte não informa em quais dias da semana. Ligue para confirmar.
        </span>
      )}
    </p>
  );
}

export default function CartaoUnidade({
  unidade,
  ddd,
  municipioId,
  comTitulo = true,
  /** Km em linha reta até o centro do município. Ver lib/geo.ts. */
  distanciaKm,
  /** Mostra o botão "Ver unidade" à direita, como na lista de "Onde pegar". */
  comBotao = false,
}: {
  unidade: Unidade;
  ddd: string;
  municipioId: string;
  /** Falso na página da própria unidade, que já tem o nome no título. */
  comTitulo?: boolean;
  distanciaKm?: number;
  comBotao?: boolean;
}) {
  const { endereco: e } = unidade;

  return (
    <article className="border-b border-linha py-6">
      <div className="md:grid md:grid-cols-[1fr_auto] md:items-start md:gap-6">
        <div>
          {comTitulo && (
            <h3 className="text-[22px] font-bold md:text-2xl">
              {comBotao ? (
                unidade.nome
              ) : (
                <a
                  href={`/${municipioId}/unidade/${unidade.id}`}
                  className="underline"
                >
                  {unidade.nome}
                </a>
              )}
            </h3>
          )}
          <p className="mt-1 text-texto-suave">
            {NOME_UNIDADE_CURTO[unidade.tipo]}
            {e.bairro ? ` — ${e.bairro}` : ""}
            {distanciaKm !== undefined ? ` — ${distanciaTexto(distanciaKm)}` : ""}
          </p>
        </div>
        {comBotao && (
          <Botao
            variante="secundario"
            href={`/${municipioId}/unidade/${unidade.id}`}
            className="mt-3 w-full md:mt-0 md:w-auto"
          >
            Ver unidade
          </Botao>
        )}
      </div>

      {unidade.restricao && (
        <div className="mt-3 flex max-w-[44em] items-start gap-3 bg-processo px-4 py-3 text-fundo">
          <span aria-hidden="true" className="mt-0.5 font-bold">
            !
          </span>
          <p className="font-bold">{unidade.restricao}</p>
        </div>
      )}

      <p className="mt-3">
        {e.logradouro}
        {e.cep ? ` — CEP ${e.cep}` : ""}
      </p>

      {unidade.telefones.length > 0 && (
        <p className="mt-1">
          <span className="font-bold">Telefone: </span>
          {unidade.telefones.map((t, i) => (
            <span key={t}>
              {i > 0 && " ou "}
              <a href={`tel:+55${ddd}${t.replace(/\D/g, "").slice(-9)}`} className="underline">
                {telefoneCompleto(t, ddd)}
              </a>
            </span>
          ))}
        </p>
      )}

      <Horarios unidade={unidade} />

      <p className="mt-2 max-w-[65ch]">{unidade.entrega_descricao}</p>
    </article>
  );
}
