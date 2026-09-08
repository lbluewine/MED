"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Campo para achar a cidade dentro de um estado, com o autocompletar nativo
 * do navegador (`<datalist>`). Funciona com teclado, sem biblioteca de busca.
 *
 * O que a pessoa digitou é comparado sem acento e sem caixa: quem escreve
 * "sao jose" chega em "São José". Reprovar alguém por causa de um acento
 * seria transformar o teclado do celular em obstáculo.
 *
 * Recebe as cidades como texto (`Nome|slug` por linha) em vez de objetos: a
 * lista atravessa para o navegador, e em Minas Gerais são 853 delas. Ver
 * `lib/indice.ts`.
 */
export default function SeletorDeCidade({ cidades }: { cidades: string }) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  // `useId` e não `Math.random()`: o id precisa sair igual no servidor e no
  // navegador, senão a hidratação acusa diferença e o React descarta a
  // marcação servida.
  const idNativo = useId();

  const { nomes, porNome } = useMemo(() => {
    const nomes: string[] = [];
    const porNome = new Map<string, string>();
    for (const linha of cidades.split("\n")) {
      const [nome, slug] = linha.split("|");
      if (!nome || !slug) continue;
      nomes.push(nome);
      // A primeira ganha: nome repetido dentro de um mesmo estado não existe
      // no cadastro do IBGE, mas não é a tela que vai quebrar se um dia houver.
      const chave = normaliza(nome);
      if (!porNome.has(chave)) porNome.set(chave, slug);
    }
    return { nomes, porNome };
  }, [cidades]);

  function irParaCidade(e: React.FormEvent) {
    e.preventDefault();
    const chave = normaliza(valor);
    if (!chave) {
      setErro("Escreva o nome da sua cidade.");
      return;
    }
    const slug = porNome.get(chave);
    if (!slug) {
      setErro("Não achamos essa cidade neste estado. Procure na lista abaixo.");
      return;
    }
    router.push(`/${slug}`);
  }

  return (
    <form onSubmit={irParaCidade}>
      <label htmlFor="campo-cidade" className="block text-[15px] font-bold text-marca">
        Nome da sua cidade
      </label>
      <input
        id="campo-cidade"
        list={idNativo}
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          setErro(null);
        }}
        aria-describedby={erro ? "erro-cidade" : undefined}
        placeholder="Digite o nome da sua cidade"
        className="campo-busca-entrada mt-2 block w-full rounded-[10px] border border-borda-cartao px-4 py-3 text-[17px]"
        autoComplete="off"
      />
      <datalist id={idNativo}>
        {nomes.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <button
        type="submit"
        className="mt-3 min-h-[48px] rounded-[10px] bg-marca px-5 text-[16px] font-semibold text-white hover:bg-marca-link"
      >
        Ir para minha cidade
      </button>

      {erro && (
        <p id="erro-cidade" role="alert" className="mt-2 text-[15px] text-processo">
          {erro}
        </p>
      )}
    </form>
  );
}

/** Sem acento, sem caixa, sem pontuação e sem espaço sobrando. */
function normaliza(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
