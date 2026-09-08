import { notFound } from "next/navigation";
import Migalha from "@/components/Migalha";
import Pagina from "@/components/Pagina";
import SeletorDeCidade from "@/components/SeletorDeCidade";
import { listaMunicipios, listaUfsIbge, municipiosDaUf } from "@/lib/dados";
import { cidadesSerializadas } from "@/lib/indice";
import { NOME_UF } from "@/lib/rotulos";

export function generateStaticParams() {
  return listaUfsIbge().map((uf) => ({ uf: uf.toLowerCase() }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uf: string }>;
}) {
  const { uf } = await params;
  const nome = NOME_UF[uf.toUpperCase()];
  return { title: nome ? `Cidades de ${nome} — Tem no SUS?` : "Tem no SUS?" };
}

/**
 * As cidades de um estado.
 *
 * Campo de busca e lista completa na mesma tela, de propósito: quem sabe
 * escrever o nome digita, quem não sabe rola e acha.
 *
 * Um estado por página porque o país inteiro não caberia: Minas Gerais, o
 * maior em número de cidades, dá 48 KB comprimidos; as 5.570 do Brasil em uma
 * página só dariam bem mais, em cima de quem tem internet ruim.
 *
 * Uma cidade sem lista publicada não fica de fora: ela abre na página que
 * mostra o piso que o SUS garante em qualquer lugar do Brasil, com o aviso de
 * que a parte local ainda não foi cadastrada. Ver `docs/ROADMAP.md`, v2.
 */
export default async function CidadesDoEstado({
  params,
}: {
  params: Promise<{ uf: string }>;
}) {
  const { uf: slugUf } = await params;
  const uf = slugUf.toUpperCase();
  const cidades = municipiosDaUf(uf);
  if (cidades.length === 0) notFound();

  const nomeUf = NOME_UF[uf] ?? uf;
  const publicadas = new Set(listaMunicipios());

  return (
    <Pagina atual="cidades" semMenu>
      <Migalha
        itens={[
          { texto: "Início", href: "/" },
          { texto: "Escolher cidade", href: "/cidades" },
          { texto: nomeUf },
        ]}
      />

      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Cidades de {nomeUf}
      </h1>
      <p className="mt-3 max-w-[65ch] text-[17px]">
        São {cidades.length} cidades. Digite o nome da sua ou procure na lista
        abaixo.
      </p>

      <div className="mt-6 max-w-[420px]">
        <SeletorDeCidade cidades={cidadesSerializadas(uf)} />
      </div>

      <h2 className="mt-10 text-[27px] font-bold tracking-tight text-marca">
        Todas as cidades
      </h2>
      <ul className="mt-4 grid gap-x-6 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
        {cidades.map((c) => {
          const completa = publicadas.has(c.slug);
          return (
            <li key={c.codigo_ibge}>
              <a href={`/${c.slug}`} className="link-cidade">
                <span>{c.nome}</span>
                {/*
                  A marca só aparece onde há lista da prefeitura publicada. Nas
                  outras a página avisa o que falta — a tela não promete aqui o
                  que a próxima não entrega.
                */}
                {completa && (
                  <span className="rounded-full bg-marca-suave px-2 py-0.5 text-[12.5px] font-semibold text-marca-link">
                    lista completa
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 max-w-[65ch] border-l-4 border-processo pl-4 text-texto-suave">
        Cada cidade entrega medicamento para quem mora nela. Escolha a cidade
        onde você mora e faz seu tratamento, não a mais perto.
      </p>
    </Pagina>
  );
}
