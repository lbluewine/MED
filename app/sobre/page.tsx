import Pagina from "@/components/Pagina";
import { listaMunicipios } from "@/lib/dados";
import { AVISO_INDEPENDENTE } from "@/lib/textos";

export const metadata = { title: "Sobre — Tem no SUS?" };

export default function Sobre() {
  const [id] = listaMunicipios();

  return (
    <Pagina municipioId={id} atual="sobre">
        <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">
          Sobre este site
        </h1>

        <h2 className="mt-8 text-[26px] font-bold tracking-tight text-marca">O que ele faz</h2>
        <p className="mt-3 max-w-[65ch]">
          Este site conta o que o SUS entrega em Criciúma, onde retirar e o que
          levar. Ele traduz para linguagem simples uma informação que já é
          pública, mas está espalhada e escrita para quem trabalha na área.
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
          qual é e quando foi conferida pela última vez. Hoje o site publica a
          lista de medicamentos e as unidades de saúde de Criciúma, e o guia de
          alto custo de Santa Catarina. A fonte de cada dado aparece no rodapé
          da própria página.
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
