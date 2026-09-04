import type { Unidade } from "@/lib/schema";
import { NOME_UNIDADE_CURTO } from "@/lib/rotulos";

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
        inventar, e mandar alguém num sábado que a porta está fechada.
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
}: {
  unidade: Unidade;
  ddd: string;
  municipioId: string;
  /** Falso na página da própria unidade, que já tem o nome no título. */
  comTitulo?: boolean;
}) {
  const { endereco: e } = unidade;

  return (
    <article className="border-b border-linha py-5">
      {comTitulo && (
        <h3 className="text-[20px] font-bold">
          <a href={`/${municipioId}/unidade/${unidade.id}`} className="underline">
            {unidade.nome}
          </a>
        </h3>
      )}
      <p className="text-texto-suave">{NOME_UNIDADE_CURTO[unidade.tipo]}</p>

      {unidade.restricao && (
        <p className="mt-2 max-w-[65ch] border-l-4 border-processo pl-4">
          <span aria-hidden="true">! </span>
          {unidade.restricao}
        </p>
      )}

      <p className="mt-2">
        {e.logradouro}
        {e.bairro ? `, ${e.bairro}` : ""}
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
