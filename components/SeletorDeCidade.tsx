"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MunicipioIbge } from "@/lib/schema";

/**
 * Um campo com autocompletar nativo do navegador (`<datalist>`) sobre todos
 * os municípios do Brasil. Funciona com teclado, sem biblioteca de busca:
 * é uma lista grande (~5.500 cidades) só nesta tela, não no resto do site.
 */
export default function SeletorDeCidade({
  municipios,
}: {
  municipios: MunicipioIbge[];
}) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState(false);
  const router = useRouter();
  const idNativo = useRef(`cidades-${Math.random().toString(36).slice(2)}`);

  const porRotulo = useMemo(() => {
    const mapa = new Map<string, MunicipioIbge>();
    for (const m of municipios) mapa.set(`${m.nome} — ${m.uf}`, m);
    return mapa;
  }, [municipios]);

  function irParaCidade(e: React.FormEvent) {
    e.preventDefault();
    const achado = porRotulo.get(valor.trim());
    if (!achado) {
      setErro(true);
      return;
    }
    setErro(false);
    router.push(`/${achado.slug}`);
  }

  return (
    <form onSubmit={irParaCidade}>
      <label htmlFor="campo-cidade" className="sr-only">
        Nome da sua cidade
      </label>
      <input
        id="campo-cidade"
        list={idNativo.current}
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          setErro(false);
        }}
        placeholder="Digite o nome da sua cidade"
        className="campo-busca-entrada block w-full rounded-[10px] border border-borda-cartao px-4 py-3 text-[17px]"
        autoComplete="off"
      />
      <datalist id={idNativo.current}>
        {municipios.map((m) => (
          <option key={m.codigo_ibge} value={`${m.nome} — ${m.uf}`} />
        ))}
      </datalist>

      <button
        type="submit"
        className="mt-3 min-h-[48px] rounded-[10px] bg-marca px-5 text-[16px] font-semibold text-white"
      >
        Ir para minha cidade
      </button>

      {erro && (
        <p className="mt-2 text-[14px] text-processo">
          Escolha uma cidade da lista que aparece enquanto você digita.
        </p>
      )}
    </form>
  );
}
