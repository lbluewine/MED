import { AVISO_INDEPENDENTE } from "@/lib/textos";

export const metadata = { title: "Sobre — Tem no SUS?" };

export default function Sobre() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-[30px] font-bold leading-tight">Sobre este site</h1>

      <h2 className="mt-8 text-2xl font-bold">O que ele faz</h2>
      <p className="mt-3 max-w-[65ch]">
        Este site conta o que o SUS entrega em Criciúma, onde retirar e o que
        levar. Ele traduz para linguagem simples uma informação que já é
        pública, mas está espalhada e escrita para quem trabalha na área.
      </p>

      <h2 className="mt-8 text-2xl font-bold">O que ele não faz</h2>
      <ul className="mt-3 max-w-[65ch] list-disc space-y-2 pl-6">
        <li>Não substitui consulta. Ele nunca indica nem desaconselha tratamento.</li>
        <li>Não diz se dois remédios podem ser tomados juntos.</li>
        <li>Não mostra o estoque de hoje. Ligue para a unidade antes de ir.</li>
        <li>Não pede login, não cria conta e não guarda nada sobre você.</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">De onde vêm os dados</h2>
      <p className="mt-3 max-w-[65ch]">
        Cada informação do site vem de um documento público, e a página mostra
        qual é e quando foi conferida pela última vez. Ainda não publicamos
        nenhuma lista: quando publicarmos, a fonte de cada dado aparece aqui.
      </p>

      <h2 className="mt-8 text-2xl font-bold">Achou um erro?</h2>
      <p className="mt-3 max-w-[65ch]">
        Erro em site de saúde machuca gente. Se você viu algo errado, avise.
        {/* TODO: publicar o canal de contato assim que houver um. */}
      </p>

      <h2 className="mt-8 text-2xl font-bold">Quem faz</h2>
      <p className="mt-3 max-w-[65ch]">
        {/* TODO: nomes e vínculos, com autorização de cada pessoa. */}
        {AVISO_INDEPENDENTE}
      </p>
    </div>
  );
}
