"use client";

import { useMemo, useState } from "react";
import { carregaIndice, sugere, type Sugestao } from "@/lib/busca";

/**
 * Campo de busca com sugestões.
 *
 * O campo tem fundo branco de propósito: ele fica em cima do azul claro do
 * banner, e um campo da cor do fundo não parece um campo.
 *
 * Sem JavaScript continua sendo um formulário que envia para a página de busca
 * do servidor. Ninguém fica sem resposta por causa de script.
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
    <form action={`/${municipioId}/busca`} method="get" role="search" className="relative">
      <label htmlFor="q" className="block text-[15px] font-bold text-marca">
        Nome do medicamento
      </label>

      <div className="mt-2 flex flex-wrap gap-3">
        <div className="flex min-w-0 flex-1 basis-[280px] items-center gap-3 rounded-[10px] border border-marca-linha bg-fundo px-4 focus-within:border-marca-link focus-within:ring-2 focus-within:ring-marca-link/40">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="flex-none text-texto-suave"
          >
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
            <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="q"
            name="q"
            type="search"
            autoComplete="off"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            aria-describedby="ajuda-q"
            placeholder="Ex.: losartana, metformina…"
            className="campo-busca-entrada min-h-[52px] w-full min-w-0 bg-transparent text-[16px] outline-none"
          />
        </div>
        <button
          type="submit"
          className="flex min-h-[46px] flex-none items-center gap-2 self-center rounded-[10px] bg-marca-link px-5 text-[15px] font-semibold text-white hover:bg-marca"
        >
          Buscar
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <p id="ajuda-q" className="mt-2 text-[14px] text-texto-suave">
        Escreva como está na receita ou na caixa. Não precisa digitar o nome todo.
      </p>

      {sugestoes.length > 0 && (
        <div className="mt-3 max-w-[520px] overflow-hidden rounded-[10px] border border-marca-linha bg-fundo shadow-[0_8px_24px_rgba(12,50,111,0.08)]">
          {sugestoes.map((s) => (
            <a
              key={s.slug}
              href={`/${municipioId}/remedio/${s.slug}`}
              className="block min-h-[56px] border-b border-divisoria px-4 py-3 no-underline last:border-b-0 hover:bg-marca-veu"
            >
              <span className="block font-semibold text-marca-link">{s.nome}</span>
              {!s.tem_para_levar && (
                <span className="block text-[15px] text-texto-suave">
                  não é para levar para casa
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </form>
  );
}
