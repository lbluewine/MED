import Migalha from "@/components/Migalha";
import Pagina from "@/components/Pagina";
import Cartao from "@/components/Cartao";
import {
  carregaMunicipio,
  listaMunicipios,
  listaUfsIbge,
} from "@/lib/dados";
import { NOME_UF } from "@/lib/rotulos";

export const metadata = { title: "Escolher cidade — Tem no SUS?" };

/**
 * Trocar de cidade, em dois passos: primeiro o estado, depois a cidade.
 *
 * Dois passos e não um campo só porque são 5.570 cidades. Mandar todas para o
 * navegador custaria centenas de KB para quem tem internet ruim, e uma lista
 * desse tamanho não se percorre no celular. Um estado são algumas centenas de
 * nomes, e essa página são 27 links.
 *
 * As cidades com a lista da prefeitura publicada vêm primeiro e separadas: são
 * as únicas em que o site responde onde retirar e o que levar.
 */
export default function Cidades() {
  const publicadas = listaMunicipios();
  const ufs = listaUfsIbge();

  return (
    <Pagina atual="cidades" semMenu>
      <Migalha itens={[{ texto: "Início", href: "/" }, { texto: "Escolher cidade" }]} />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Escolher cidade
      </h1>
      <p className="mt-3 max-w-[65ch] text-[17px]">
        O que o SUS entrega muda de cidade para cidade. Escolha a sua para ver a
        resposta certa.
      </p>

      {publicadas.length > 0 && (
        <Cartao className="mt-8 px-6 py-5">
          <h2 className="text-[22px] font-bold tracking-tight text-marca">
            Cidades com a lista completa
          </h2>
          <p className="mt-1 max-w-[60ch] text-texto-suave">
            Nestas cidades o site mostra a lista da prefeitura, onde retirar e o
            que levar.
          </p>
          <ul className="mt-4">
            {publicadas.map((id) => {
              const m = carregaMunicipio(id);
              return (
                <li key={id} className="border-t border-divisoria">
                  <a
                    href={`/${id}`}
                    className="block min-h-[48px] py-3 text-[18px] font-semibold text-marca-link no-underline hover:underline"
                  >
                    {m.nome} – {m.uf}
                  </a>
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}

      {ufs.length > 0 && (
        <section className="pt-10">
          <h2 className="text-[27px] font-bold tracking-tight text-marca">
            Escolha o seu estado
          </h2>
          <p className="mt-1 max-w-[65ch] text-texto-suave">
            Depois de escolher o estado, você vê a lista das cidades dele.
          </p>
          <ul className="mt-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            {ufs.map((uf) => (
              <li key={uf}>
                <a
                  href={`/cidades/${uf.toLowerCase()}`}
                  className="flex min-h-[56px] items-center gap-3 rounded-[10px] border border-borda-cartao bg-fundo px-4 no-underline hover:border-marca-link hover:bg-marca-veu"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg bg-marca-suave text-[13px] font-bold text-marca-link"
                  >
                    {uf}
                  </span>
                  <span className="font-semibold text-marca-link">
                    {NOME_UF[uf] ?? uf}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/*
        O aviso de residência é do `docs/ROADMAP.md`, v2: cada prefeitura
        entrega para quem mora na cidade. Sem isso, a tela convida alguém a ir
        buscar medicamento num lugar que não vai atender essa pessoa.
      */}
      <p className="mt-10 max-w-[65ch] border-l-4 border-processo pl-4 text-texto-suave">
        Cada cidade entrega medicamento para quem mora nela. Escolha a cidade
        onde você mora e faz seu tratamento, não a mais perto.
      </p>
    </Pagina>
  );
}
