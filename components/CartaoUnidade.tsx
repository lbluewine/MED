import type { Unidade } from "@/lib/schema";
import { NOME_UNIDADE_CURTO } from "@/lib/rotulos";
import Botao from "./Botao";

/** "(48) 3445-8730" a partir do que a fonte escreve e do DDD do município. */
export function telefoneCompleto(telefone: string, ddd: string): string {
  return telefone.startsWith("(") ? telefone : `(${ddd}) ${telefone}`;
}

function Horarios({ unidade }: { unidade: Unidade }) {
  if (unidade.horarios.length === 0) return null;
  return (
    /*
      A fonte dá o horário mas não diz em quais dias. Dizer "seg-sex" seria
      inventar, e mandar alguém num sábado que a porta está fechada. Pela mesma
      razão, o site nunca afirma "aberta agora": sem saber os dias, essa
      etiqueta mentiria em algum dia da semana.

      A ressalva saiu de cada cartão — repetida 62 vezes virava ruído — e passou
      a ser dita uma vez, no topo de "Onde pegar" e na página da unidade.
    */
    <p className="mt-1">
      <span className="font-bold">Horário: </span>
      {unidade.horarios.map((h) => `${h.abre} às ${h.fecha}`).join(" e ")}.
    </p>
  );
}

export default function CartaoUnidade({
  unidade,
  ddd,
  municipioId,
  comTitulo = true,
  /** Mostra o botão "Ver unidade" à direita, como na lista de "Onde pegar". */
  comBotao = false,
}: {
  unidade: Unidade;
  ddd: string;
  municipioId: string;
  /** Falso na página da própria unidade, que já tem o nome no título. */
  comTitulo?: boolean;
  comBotao?: boolean;
}) {
  const { endereco: e } = unidade;

  return (
    <article
      className={
        comTitulo
          ? "rounded-[var(--radius-cartao)] border-2 border-marca-linha px-5 py-5 transition-colors hover:border-marca-link"
          : ""
      }
    >
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
            {/*
              Fica vazio até a pessoa liberar a localização. Ver
              components/MinhaDistancia.tsx: a distância só aparece se for a
              dela de verdade.
            */}
            {unidade.endereco.geo && <span data-distancia={unidade.id} />}
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
        <div className="mt-3 flex max-w-[44em] items-start gap-3 rounded-[var(--radius-botao)] border-l-4 border-aviso-linha bg-aviso px-4 py-3">
          <span aria-hidden="true" className="mt-0.5 font-bold text-processo">
            !
          </span>
          <p className="font-bold text-texto">{unidade.restricao}</p>
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
