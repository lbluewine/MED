import Migalha from "@/components/Migalha";
import Pagina from "@/components/Pagina";
import { AVISO_INDEPENDENTE } from "@/lib/textos";

/**
 * Quem faz o site, o que ele faz e de onde vêm os dados.
 *
 * O conteúdo é o mesmo em qualquer cidade — é sobre o projeto, não sobre um
 * município. A cidade entra só para o topo e o "Início" continuarem sendo os
 * dela: antes a página fixava a primeira da lista, e quem tinha escolhido
 * Içara via "Criciúma" no topo ao clicar em "Sobre o site".
 */
export default function Sobre({ municipioId }: { municipioId?: string }) {
  return (
    <Pagina municipioId={municipioId} atual="sobre">
        <Migalha
          itens={[
            { texto: "Início", href: municipioId ? `/${municipioId}` : "/" },
            { texto: "Sobre" },
          ]}
        />
        <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
          Sobre este site
        </h1>

        <h2 className="mt-8 text-[26px] font-bold tracking-tight text-marca">O que ele faz</h2>
        <p className="mt-3 max-w-[65ch]">
          Este site conta o que o SUS entrega, onde retirar e o que levar. Ele
          traduz para linguagem simples uma informação que já é pública, mas
          está espalhada e escrita para quem trabalha na área.
        </p>

        <h2 className="mt-8 text-[26px] font-bold tracking-tight text-marca">O que ele não faz</h2>
        <ul className="mt-3 max-w-[65ch] list-disc space-y-2 pl-6">
          <li>Não substitui consulta. Ele nunca indica nem desaconselha tratamento.</li>
          <li>Não diz se dois medicamentos podem ser tomados juntos.</li>
          <li>Não mostra o estoque de hoje. Ligue para a unidade antes de ir.</li>
          <li>Não pede login, não cria conta e não guarda nada sobre você.</li>
        </ul>

        <h2 className="mt-8 text-[26px] font-bold tracking-tight text-marca">De onde vêm os dados</h2>
        <p className="mt-3 max-w-[65ch]">
          Cada informação do site vem de um documento público, e a página mostra
          qual é e quando foi conferida pela última vez. A fonte de cada dado
          aparece no rodapé da própria página.
        </p>
        <p className="mt-3 max-w-[65ch]">
          Em qualquer cidade do Brasil o site responde pela RENAME, a lista
          nacional do Ministério da Saúde — é o piso que o SUS garante em todo
          município. Só Criciúma tem, além disso, a lista da própria prefeitura
          e as unidades de saúde cadastradas aqui; e o guia de alto custo é o
          de Santa Catarina. Onde a informação é da cidade e a gente não tem, a
          página diz que não sabe, em vez de mostrar a de outro município.
        </p>

        <h2 className="mt-8 text-[26px] font-bold tracking-tight text-marca">Achou um erro?</h2>
        <p className="mt-3 max-w-[65ch]">
          Erro em site de saúde machuca gente. Se você viu algo errado, avise.
          {/* TODO: publicar o canal de contato assim que houver um. */}
        </p>

        <h2 className="mt-8 text-[26px] font-bold tracking-tight text-marca">Quem faz</h2>
        <p className="mt-3 max-w-[65ch]">
          {/* TODO: nomes e vínculos, com autorização de cada pessoa. */}
          {AVISO_INDEPENDENTE}
        </p>
    </Pagina>
  );
}
