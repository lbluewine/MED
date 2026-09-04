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
        className="mt-2 min-h-[60px] w-full rounded-[2px] border-2 border-texto px-4 text-[22px]"
      />
      <p className="mt-2 text-texto-suave">Pode digitar só o começo do nome.</p>
      <button
        type="submit"
        className="mt-4 min-h-[60px] w-full rounded-[2px] border-2 border-texto bg-texto px-4 text-[20px] font-bold text-fundo hover:bg-[#333333]"
      >
        Procurar
      </button>

      {sugestoes.length > 0 && (
        <div className="mt-5 border-t border-linha">
          {sugestoes.map((s) => (
            <a
              key={s.slug}
              href={`/${municipioId}/remedio/${s.slug}`}
              className="block min-h-[64px] border-b border-linha py-3 no-underline hover:bg-[#F2F2F2]"
            >
              <span className="block text-[20px] font-bold text-texto">{s.nome}</span>
              {!s.tem_para_levar && (
                <span className="block text-texto-suave">não é para levar para casa</span>
              )}
            </a>
          ))}
        </div>
      )}
    </form>
  );
}
