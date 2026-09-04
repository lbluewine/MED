"use client";

import { useMemo, useState } from "react";
import { carregaIndice, sugere, type Sugestao } from "@/lib/busca";

/**
 * Campo de busca com sugestões.
 *
 * Sem JavaScript ele continua sendo um formulário que envia para a página de
 * busca do servidor. Ninguém fica sem resposta por causa de script.
 */
export default function CampoBusca({
  municipioId,
  indice,
  termoInicial = "",
}: {
  municipioId: string;
  indice: string;
  termoInicial?: string;
}) {
  const [termo, setTermo] = useState(termoInicial);
  const busca = useMemo(() => carregaIndice(indice), [indice]);
  const sugestoes: Sugestao[] = termo.trim() ? sugere(busca, termo) : [];

  return (
    <form action={`/${municipioId}/busca`} method="get" role="search">
      <label htmlFor="q" className="block font-bold">
        Nome do remédio
      </label>
      <p id="ajuda-q" className="mt-1 text-texto-suave">
        Escreva como está na receita ou na caixa. Não precisa acertar o acento.
      </p>
      <input
        id="q"
        name="q"
        type="search"
        autoComplete="off"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        aria-describedby="ajuda-q"
        className="mt-2 w-full border-2 border-texto px-4 py-3 text-[20px]"
      />
      <button
        type="submit"
        className="mt-3 min-h-[48px] w-full border-2 border-texto bg-texto px-4 py-3 text-[20px] font-bold text-fundo"
      >
        Procurar
      </button>

      {sugestoes.length > 0 && (
        <ul className="mt-4 border-t border-linha">
          {sugestoes.map((s) => (
            <li key={s.slug} className="border-b border-linha">
              <a
                href={`/${municipioId}/remedio/${s.slug}`}
                className="block min-h-[48px] py-3 underline"
              >
                {s.nome}
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
